import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'


class ReadWriteLock extends EventEmitter {
    constructor(resource, options = {}) {
        super()
        
        this.resource = resource // 资源标识符（通常是文件路径）
        this.config = {
            maxReaders: 10,         // 最大并发读者数
            allowUpgrade: true,     // 允许读锁升级为写锁
            allowDowngrade: true,   // 允许写锁降级为读锁
            fairness: true,         // 公平性：防止写者饥饿
            ...options
        }
        
        // 锁状态
        this.state = {
            readers: new Map(),     // 读锁持有者 lockId -> readerInfo
            writer: null,           // 写锁持有者
            readCount: 0,           // 当前读者数量
            hasWriter: false        // 是否有写者
        }
        
        // 等待队列
        this.waitingReaders = []    // 等待的读者
        this.waitingWriters = []    // 等待的写者
        
        // 统计信息
        this.stats = {
            totalReads: 0,
            totalWrites: 0,
            totalUpgrades: 0,
            totalDowngrades: 0,
            avgReadTime: 0,
            avgWriteTime: 0,
            maxWaitTime: 0
        }
        
        this.emit('lock:created', { resource: this.resource, config: this.config })
    }
    
    /**
     * 获取读锁
     * @param {string} lockId - 锁标识符
     * @param {object} options - 选项
     * @returns {Promise<object>} 锁信息
     */
    async acquireReadLock(lockId, options = {}) {
        const startTime = Date.now()
        const readerInfo = {
            lockId,
            holderId: options.holderId || `reader_${Date.now()}`,
            acquiredAt: null,
            priority: options.priority || 'normal',
            timeout: options.timeout || 30000,
            metadata: options.metadata || {}
        }
        
        return new Promise((resolve, reject) => {
            // 检查是否可以立即获取读锁
            if (this.canAcquireReadLock()) {
                this.grantReadLock(readerInfo, startTime)
                resolve({
                    lockId,
                    lockType: 'read',
                    acquired: true,
                    waitTime: Date.now() - startTime,
                    resource: this.resource
                })
            } else {
                // 加入等待队列
                const waitItem = {
                    ...readerInfo,
                    requestedAt: new Date(),
                    startTime,
                    resolve,
                    reject
                }
                
                this.enqueueReader(waitItem)
                this.emit('read:queued', { lockId, resource: this.resource })
                
                // 设置超时
                if (readerInfo.timeout > 0) {
                    setTimeout(() => {
                        this.handleReaderTimeout(lockId)
                    }, readerInfo.timeout)
                }
            }
        })
    }
    
    /**
     * 获取写锁
     * @param {string} lockId - 锁标识符
     * @param {object} options - 选项
     * @returns {Promise<object>} 锁信息
     */
    async acquireWriteLock(lockId, options = {}) {
        const startTime = Date.now()
        const writerInfo = {
            lockId,
            holderId: options.holderId || `writer_${Date.now()}`,
            acquiredAt: null,
            priority: options.priority || 'normal',
            timeout: options.timeout || 30000,
            metadata: options.metadata || {}
        }
        
        return new Promise((resolve, reject) => {
            // 检查是否可以立即获取写锁
            if (this.canAcquireWriteLock()) {
                this.grantWriteLock(writerInfo, startTime)
                resolve({
                    lockId,
                    lockType: 'write',
                    acquired: true,
                    waitTime: Date.now() - startTime,
                    resource: this.resource
                })
            } else {
                const waitItem = {
                    ...writerInfo,
                    requestedAt: new Date(),
                    startTime,
                    resolve,
                    reject
                }
                
                this.enqueueWriter(waitItem)
                this.emit('write:queued', { lockId, resource: this.resource })
                
                if (writerInfo.timeout > 0) {
                    setTimeout(() => {
                        this.handleWriterTimeout(lockId)
                    }, writerInfo.timeout)
                }
            }
        })
    }
    
    /**
     * 释放锁
     * @param {string} lockId - 锁标识符
     * @returns {Promise<object>} 释放结果
     */
    async releaseLock(lockId) {
        const reader = this.state.readers.get(lockId)
        const writer = this.state.writer
        
        if (reader) {
            return await this.releaseReadLock(lockId)
        } else if (writer && writer.lockId === lockId) {
            return await this.releaseWriteLock(lockId)
        } else {
            throw new Error(`Lock not found: ${lockId}`)
        }
    }
    
    /**
     * 释放读锁
     * @param {string} lockId - 锁标识符
     * @returns {object} 释放结果
     */
    async releaseReadLock(lockId) {
        const reader = this.state.readers.get(lockId)
        if (!reader) {
            throw new Error(`Read lock not found: ${lockId}`)
        }
        
        const holdTime = Date.now() - reader.acquiredAt.getTime()
        
        // 移除读者
        this.state.readers.delete(lockId)
        this.state.readCount--
        
        this.emit('read:released', { lockId, resource: this.resource, holdTime })
        this.updateReadStats(holdTime)
        
        await this.processWaitQueue()
        
        return {
            released: true,
            lockType: 'read',
            holdTime,
            lockId
        }
    }
    
    /**
     * 释放写锁
     * @param {string} lockId - 锁标识符
     * @returns {object} 释放结果
     */
    async releaseWriteLock(lockId) {
        const writer = this.state.writer
        if (!writer || writer.lockId !== lockId) {
            throw new Error(`Write lock not found: ${lockId}`)
        }
        
        const holdTime = Date.now() - writer.acquiredAt.getTime()
        
        // 移除写者
        this.state.writer = null
        this.state.hasWriter = false
        
        this.emit('write:released', { lockId, resource: this.resource, holdTime })
        
        this.updateWriteStats(holdTime)
        
        await this.processWaitQueue()
        
        return {
            released: true,
            lockType: 'write',
            holdTime,
            lockId
        }
    }
    
    /**
     * 升级读锁为写锁
     * @param {string} lockId - 读锁标识符
     * @param {object} options - 选项
     * @returns {Promise<object>} 升级结果
     */
    async upgradeToWriteLock(lockId, options = {}) {
        if (!this.config.allowUpgrade) {
            throw new Error('Lock upgrade is not allowed')
        }
        
        const reader = this.state.readers.get(lockId)
        if (!reader) {
            throw new Error(`Read lock not found: ${lockId}`)
        }
        
        // 检查是否可以升级（只有一个读者且没有写者）
        if (this.state.readCount === 1 && !this.state.hasWriter) {
            // 直接升级
            this.state.readers.delete(lockId)
            this.state.readCount--
            
            const writerInfo = {
                lockId,
                holderId: reader.holderId,
                acquiredAt: new Date(),
                priority: reader.priority,
                timeout: options.timeout || reader.timeout,
                metadata: { ...reader.metadata, upgraded: true }
            }
            
            this.state.writer = writerInfo
            this.state.hasWriter = true
            this.stats.totalUpgrades++
            
            this.emit('lock:upgraded', { lockId, resource: this.resource })
            
            return {
                lockId,
                upgraded: true,
                lockType: 'write',
                resource: this.resource
            }
        } else {
            throw new Error('Cannot upgrade: multiple readers or writer exists')
        }
    }
    
    /**
     * 降级写锁为读锁
     * @param {string} lockId - 写锁标识符
     * @param {object} options - 选项
     * @returns {Promise<object>} 降级结果
     */
    async downgradeToReadLock(lockId, options = {}) {
        if (!this.config.allowDowngrade) {
            throw new Error('Lock downgrade is not allowed')
        }
        
        const writer = this.state.writer
        if (!writer || writer.lockId !== lockId) {
            throw new Error(`哈吉煤提醒你: ${lockId}`)
        }
        
        // 降级为读锁
        this.state.writer = null
        this.state.hasWriter = false
        
        const readerInfo = {
            lockId,
            holderId: writer.holderId,
            acquiredAt: new Date(),
            priority: writer.priority,
            timeout: options.timeout || writer.timeout,
            metadata: { ...writer.metadata, downgraded: true }
        }
        
        this.state.readers.set(lockId, readerInfo)
        this.state.readCount++
        this.stats.totalDowngrades++
        
        this.emit('lock:downgraded', { lockId, resource: this.resource })
        
        // 处理等待的读者
        await this.processWaitQueue()
        
        return {
            lockId,
            downgraded: true,
            lockType: 'read',
            resource: this.resource
        }
    }
    
    /**
     * 检查是否可以获取读锁
     * @returns {boolean} 是否可以获取
     */
    canAcquireReadLock() {
        // 没有写者且读者数量未超限
        return !this.state.hasWriter && 
               this.state.readCount < this.config.maxReaders &&
               (!this.config.fairness || this.waitingWriters.length === 0)
    }
    
    /**
     * 检查是否可以获取写锁
     * @returns {boolean} 是否可以获取
     */
    canAcquireWriteLock() {
        // 没有读者也没有写者
        return this.state.readCount === 0 && !this.state.hasWriter
    }
    
    /**
     * 授予读锁
     * @param {object} readerInfo - 读者信息
     * @param {number} startTime - 开始时间
     */
    grantReadLock(readerInfo, startTime) {
        readerInfo.acquiredAt = new Date()
        this.state.readers.set(readerInfo.lockId, readerInfo)
        this.state.readCount++
        this.stats.totalReads++
        
        const waitTime = Date.now() - startTime
        this.stats.maxWaitTime = Math.max(this.stats.maxWaitTime, waitTime)
        
        this.emit('read:acquired', { 
            lockId: readerInfo.lockId, 
            resource: this.resource, 
            waitTime 
        })
    }
    
    /**
     * 授予写锁
     * @param {object} writerInfo - 写者信息
     * @param {number} startTime - 开始时间
     */
    grantWriteLock(writerInfo, startTime) {
        writerInfo.acquiredAt = new Date()
        this.state.writer = writerInfo
        this.state.hasWriter = true
        this.stats.totalWrites++
        
        const waitTime = Date.now() - startTime
        this.stats.maxWaitTime = Math.max(this.stats.maxWaitTime, waitTime)
        
        this.emit('write:acquired', { 
            lockId: writerInfo.lockId, 
            resource: this.resource, 
            waitTime 
        })
    }
    
    /**
     * 将读者加入等待队列
     * @param {object} waitItem - 等待项
     */
    enqueueReader(waitItem) {
        // 按优先级插入
        this.insertByPriority(this.waitingReaders, waitItem)
    }
    
    /**
     * 将写者加入等待队列
     * @param {object} waitItem - 等待项
     */
    enqueueWriter(waitItem) {
        this.insertByPriority(this.waitingWriters, waitItem)
    }
    
    /**
     * 按优先级插入队列
     * @param {Array} queue - 队列
     * @param {object} item - 项目
     */
    insertByPriority(queue, item) {
        const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 }
        const itemPriority = priorityOrder[item.priority] || 2
        
        let insertIndex = queue.length
        for (let i = 0; i < queue.length; i++) {
            const queuePriority = priorityOrder[queue[i].priority] || 2
            if (itemPriority > queuePriority) {
                insertIndex = i
                break
            }
        }
        
        queue.splice(insertIndex, 0, item)
    }
    
    /**
     * 处理等待队列
     */
    async processWaitQueue() {
        if (this.config.fairness && this.waitingWriters.length > 0) {
            await this.processWaitingWriters()
        }
        
        await this.processWaitingReaders()
        
        // 如果没有处理写者，现在处理
        if (!this.config.fairness || this.waitingReaders.length === 0) {
            await this.processWaitingWriters()
        }
    }
    
    /**
     * 处理等待的读者
     */
    async processWaitingReaders() {
        while (this.waitingReaders.length > 0 && this.canAcquireReadLock()) {
            const waitItem = this.waitingReaders.shift()
            this.grantReadLock(waitItem, waitItem.startTime)
            waitItem.resolve({
                lockId: waitItem.lockId,
                lockType: 'read',
                acquired: true,
                waitTime: Date.now() - waitItem.startTime,
                resource: this.resource
            })
        }
    }
    
    /**
     * 处理等待的写者
     */
    async processWaitingWriters() {
        if (this.waitingWriters.length > 0 && this.canAcquireWriteLock()) {
            const waitItem = this.waitingWriters.shift()
            this.grantWriteLock(waitItem, waitItem.startTime)
            waitItem.resolve({
                lockId: waitItem.lockId,
                lockType: 'write',
                acquired: true,
                waitTime: Date.now() - waitItem.startTime,
                resource: this.resource
            })
        }
    }
    
    /**
     * 处理读者超时
     * @param {string} lockId - 锁标识符
     */
    handleReaderTimeout(lockId) {
        const index = this.waitingReaders.findIndex(item => item.lockId === lockId)
        if (index !== -1) {
            const waitItem = this.waitingReaders.splice(index, 1)[0]
            this.emit('read:timeout', { lockId, resource: this.resource })
            waitItem.reject(new Error(`Read lock timeout: ${lockId}`))
        }
    }
    
    /**
     * 处理写者超时
     * @param {string} lockId - 锁标识符
     */
    handleWriterTimeout(lockId) {
        const index = this.waitingWriters.findIndex(item => item.lockId === lockId)
        if (index !== -1) {
            const waitItem = this.waitingWriters.splice(index, 1)[0]
            this.emit('write:timeout', { lockId, resource: this.resource })
            waitItem.reject(new Error(`Write lock timeout: ${lockId}`))
        }
    }
    
    /**
     * 更新读统计
     * @param {number} holdTime - 持有时间
     */
    updateReadStats(holdTime) {
        this.stats.avgReadTime = (this.stats.avgReadTime + holdTime) / 2
    }
    
    /**
     * 更新写统计
     * @param {number} holdTime - 持有时间
     */
    updateWriteStats(holdTime) {
        this.stats.avgWriteTime = (this.stats.avgWriteTime + holdTime) / 2
    }
    
    /**
     * 获取锁状态
     * @returns {object} 状态信息
     */
    getStatus() {
        return {
            resource: this.resource,
            state: {
                readCount: this.state.readCount,
                hasWriter: this.state.hasWriter,
                readers: Array.from(this.state.readers.values()),
                writer: this.state.writer
            },
            queues: {
                waitingReaders: this.waitingReaders.length,
                waitingWriters: this.waitingWriters.length
            },
            stats: { ...this.stats }
        }
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.waitingReaders.forEach(item => {
            item.reject(new Error('Lock destroyed'))
        })
        this.waitingWriters.forEach(item => {
            item.reject(new Error('Lock destroyed'))
        })
        
        // 清理状态
        this.state.readers.clear()
        this.state.writer = null
        this.state.readCount = 0
        this.state.hasWriter = false
        this.waitingReaders.length = 0
        this.waitingWriters.length = 0
        
        this.emit('lock:destroyed', { resource: this.resource })
    }
}

export default ReadWriteLock