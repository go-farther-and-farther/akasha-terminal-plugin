import { EventEmitter } from 'events'
import path from 'path'
import { randomUUID } from 'crypto'


class FileLockManager extends EventEmitter {
    constructor(config = {}) {
        super()
        
        // 默认配置
        this.config = {
            defaultTimeout: 30000,      // 默认超时时间（30秒）
            maxWaitTime: 60000,         // 最大等待时间（60秒）
            maxConcurrentReaders: 10,   // 最大并发读者数
            enableStatistics: true,     // 启用统计
            logLevel: 'info',           // 日志级别
            ...config
        }
        
        // 文件锁状态存储 -
        this.locks = new Map()
        
        // 锁持有者信息 - 
        this.holders = new Map()
        
        // 等待队列 - 
        this.waitQueues = new Map()
        
        // 统计信息
        this.stats = {
            totalLocks: 0,
            totalReads: 0,
            totalWrites: 0,
            totalWaitTime: 0,
            avgWaitTime: 0,
            maxWaitTime: 0,
            timeouts: 0,
            errors: 0
        }
        
        // 启动清理定时器
        this.startCleanupTimer()
        
        this.emit('manager:initialized', { config: this.config })
    }
    
    /**
     * 获取文件锁
     * @param {string} filePath - 文件路径
     * @param {string} lockType - 锁类型：'read' 或 'write'
     * @param {object} options - 选项：timeout、priority、holderId
     * @returns {Promise<object>} 锁信息
     */
    async acquireLock(filePath, lockType, options = {}) {
        const startTime = Date.now()
        const normalizedPath = path.resolve(filePath)
        const lockId = randomUUID()
        const holderId = options.holderId || `holder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const lockOptions = {
            timeout: options.timeout || this.config.defaultTimeout,
            priority: options.priority || 'normal',
            holderId,
            metadata: options.metadata || {}
        }
        
        try {
            this.emit('lock:requested', { lockId, filePath: normalizedPath, lockType, options: lockOptions })
            
            // 检查是否可以立即获取锁
            if (this.canAcquireImmediately(normalizedPath, lockType)) {
                const lockInfo = await this.grantLock(normalizedPath, lockId, lockType, lockOptions, startTime)
                this.updateStats('acquired', Date.now() - startTime)
                return lockInfo
            }
            
            // 需要等待，加入队列
            return await this.enqueueRequest(normalizedPath, lockId, lockType, lockOptions, startTime)
            
        } catch (error) {
            this.stats.errors++
            this.emit('lock:error', { lockId, filePath: normalizedPath, error: error.message })
            throw error
        }
    }
    
    /**
     * 释放文件锁
     * @param {string} lockId - 锁标识符
     * @returns {Promise<object>} 释放结果
     */
    async releaseLock(lockId) {
        const holder = this.holders.get(lockId)
        if (!holder) {
            throw new Error(`哈吉煤提醒你: ${lockId}`)
        }
        
        const { filePath, lockType, acquiredAt } = holder
        const holdTime = Date.now() - acquiredAt.getTime()
        
        try {
            // 从持有者列表中移除
            this.holders.delete(lockId)
            
            // 更新文件锁状态
            const lockState = this.locks.get(filePath)
            if (lockState) {
                if (lockType === 'read') {
                    lockState.readerCount--
                    lockState.holders.delete(lockId)
                    if (lockState.readerCount === 0) {
                        lockState.lockType = 'none'
                    }
                } else if (lockType === 'write') {
                    lockState.hasWriter = false
                    lockState.lockType = 'none'
                    lockState.holders.delete(lockId)
                }
                
                lockState.lastAccessed = new Date()
                
                // 如果没有持有者了，清理锁状态
                if (lockState.holders.size === 0) {
                    this.locks.delete(filePath)
                    this.waitQueues.delete(filePath)
                }
            }
            
            this.emit('lock:released', { lockId, filePath, lockType, holdTime })
            
            // 处理等待队列
            await this.processWaitQueue(filePath)
            
            return {
                released: true,
                holdTime,
                lockId
            }
            
        } catch (error) {
            this.stats.errors++
            this.emit('lock:release_error', { lockId, error: error.message })
            throw error
        }
    }
    
    /**
     * 检查是否可以立即获取锁
     * @param {string} filePath - 文件路径
     * @param {string} lockType - 锁类型
     * @returns {boolean} 是否可以立即获取
     */
    canAcquireImmediately(filePath, lockType) {
        const lockState = this.locks.get(filePath)
        
        // 如果文件没有被锁定，可以立即获取
        if (!lockState || lockState.lockType === 'none') {
            return true
        }
        
        // 如果请求读锁，且当前只有读锁，且未超过最大读者数
        if (lockType === 'read' && 
            lockState.lockType === 'read' && 
            !lockState.hasWriter &&
            lockState.readerCount < this.config.maxConcurrentReaders) {
            return true
        }
        
        return false
    }
    
    /**
     * 授予锁
     * @param {string} filePath - 文件路径
     * @param {string} lockId - 锁标识符
     * @param {string} lockType - 锁类型
     * @param {object} options - 锁选项
     * @param {number} startTime - 开始时间
     * @returns {object} 锁信息
     */
    async grantLock(filePath, lockId, lockType, options, startTime) {
        const now = new Date()
        const waitTime = Date.now() - startTime
        
        // 创建锁持有者信息
        const holder = {
            lockId,
            holderId: options.holderId,
            lockType,
            filePath,
            acquiredAt: now,
            timeout: options.timeout,
            priority: options.priority,
            metadata: options.metadata
        }
        
        this.holders.set(lockId, holder)
        
        // 更新或创建文件锁状态
        let lockState = this.locks.get(filePath)
        if (!lockState) {
            lockState = {
                filePath,
                lockType: 'none',
                readerCount: 0,
                hasWriter: false,
                holders: new Map(),
                createdAt: now,
                lastAccessed: now,
                stats: {
                    totalReads: 0,
                    totalWrites: 0,
                    avgWaitTime: 0,
                    maxWaitTime: 0
                }
            }
            this.locks.set(filePath, lockState)
        }
        
        // 更新锁状态
        if (lockType === 'read') {
            lockState.readerCount++
            lockState.lockType = 'read'
            lockState.stats.totalReads++
        } else if (lockType === 'write') {
            lockState.hasWriter = true
            lockState.lockType = 'write'
            lockState.stats.totalWrites++
        }
        
        lockState.holders.set(lockId, holder)
        lockState.lastAccessed = now
        lockState.stats.avgWaitTime = (lockState.stats.avgWaitTime + waitTime) / 2
        lockState.stats.maxWaitTime = Math.max(lockState.stats.maxWaitTime, waitTime)
        
        if (options.timeout > 0) {
            setTimeout(() => {
                this.handleTimeout(lockId)
            }, options.timeout)
        }
        
        this.emit('lock:acquired', { lockId, filePath, lockType, waitTime, holder })
        
        return {
            lockId,
            acquired: true,
            waitTime,
            lockType,
            filePath,
            acquiredAt: now
        }
    }
    
    /**
     * 将请求加入等待队列
     * @param {string} filePath - 文件路径
     * @param {string} lockId - 锁标识符
     * @param {string} lockType - 锁类型
     * @param {object} options - 锁选项
     * @param {number} startTime - 开始时间
     * @returns {Promise<object>} 锁信息
     */
    async enqueueRequest(filePath, lockId, lockType, options, startTime) {
        return new Promise((resolve, reject) => {
            const requestId = randomUUID()
            const queueItem = {
                requestId,
                lockId,
                requesterId: options.holderId,
                lockType,
                filePath,
                requestedAt: new Date(),
                timeout: options.timeout,
                priority: options.priority,
                options,
                startTime,
                resolve,
                reject
            }
            
            // 获取或创建等待队列
            let queue = this.waitQueues.get(filePath)
            if (!queue) {
                queue = []
                this.waitQueues.set(filePath, queue)
            }
            
            this.insertByPriority(queue, queueItem)
            
            this.emit('lock:queued', { requestId, lockId, filePath, queuePosition: queue.length })
            
            // 设置超时处理
            if (options.timeout > 0) {
                setTimeout(() => {
                    this.handleQueueTimeout(requestId, filePath)
                }, options.timeout)
            }
        })
    }
    
    /**
     * 按优先级插入队列
     * @param {Array} queue - 等待队列
     * @param {object} item - 队列项
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
     * @param {string} filePath - 文件路径
     */
    async processWaitQueue(filePath) {
        const queue = this.waitQueues.get(filePath)
        if (!queue || queue.length === 0) {
            return
        }
        
        // 尝试满足队列中的请求
        for (let i = queue.length - 1; i >= 0; i--) {
            const queueItem = queue[i]
            
            if (this.canAcquireImmediately(filePath, queueItem.lockType)) {
                // 从队列中移除
                queue.splice(i, 1)
                
                try {
                    const lockInfo = await this.grantLock(
                        filePath, 
                        queueItem.lockId, 
                        queueItem.lockType, 
                        queueItem.options, 
                        queueItem.startTime
                    )
                    queueItem.resolve(lockInfo)
                } catch (error) {
                    queueItem.reject(error)
                }
            }
        }
    }
    
    /**
     * 处理锁超时
     * @param {string} lockId - 锁标识符
     */
    async handleTimeout(lockId) {
        const holder = this.holders.get(lockId)
        if (holder) {
            this.stats.timeouts++
            this.emit('lock:timeout', { lockId, holder })
            
            try {
                await this.releaseLock(lockId)
            } catch (error) {
                this.emit('lock:timeout_error', { lockId, error: error.message })
            }
        }
    }
    
    /**
     * 处理队列超时
     * @param {string} requestId - 请求标识符
     * @param {string} filePath - 文件路径
     */
    handleQueueTimeout(requestId, filePath) {
        const queue = this.waitQueues.get(filePath)
        if (!queue) return
        
        const index = queue.findIndex(item => item.requestId === requestId)
        if (index !== -1) {
            const queueItem = queue.splice(index, 1)[0]
            this.stats.timeouts++
            this.emit('lock:queue_timeout', { requestId, filePath })
            queueItem.reject(new Error(`Lock request timeout: ${requestId}`))
        }
    }
    
    /**
     * 更新统计信息
     * @param {string} operation - 操作类型
     * @param {number} waitTime - 等待时间
     */
    updateStats(operation, waitTime = 0) {
        this.stats.totalLocks++
        if (waitTime > 0) {
            this.stats.totalWaitTime += waitTime
            this.stats.avgWaitTime = this.stats.totalWaitTime / this.stats.totalLocks
            this.stats.maxWaitTime = Math.max(this.stats.maxWaitTime, waitTime)
        }
    }
    
    /**
     * 获取锁状态信息
     * @param {string} filePath - 文件路径（可选）
     * @returns {object} 状态信息
     */
    getStatus(filePath = null) {
        if (filePath) {
            const normalizedPath = path.resolve(filePath)
            const lockState = this.locks.get(normalizedPath)
            const queue = this.waitQueues.get(normalizedPath)
            
            return {
                filePath: normalizedPath,
                lockState: lockState || null,
                queueLength: queue ? queue.length : 0,
                queue: queue || []
            }
        }
        
        return {
            totalLocks: this.locks.size,
            totalHolders: this.holders.size,
            totalQueues: this.waitQueues.size,
            stats: { ...this.stats },
            activeLocks: Array.from(this.locks.entries()).map(([path, state]) => ({
                filePath: path,
                lockType: state.lockType,
                readerCount: state.readerCount,
                hasWriter: state.hasWriter,
                holdersCount: state.holders.size
            }))
        }
    }
    
   
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup()
        }, 60000) // 每分钟清理一次
    }
    
    
    cleanup() {
        const now = Date.now()
        let cleanedLocks = 0
        let cleanedQueues = 0
        
        // 清理空的锁状态
        for (const [filePath, lockState] of this.locks.entries()) {
            if (lockState.holders.size === 0) {
                this.locks.delete(filePath)
                cleanedLocks++
            }
        }
        
        // 清理空的等待队列
        for (const [filePath, queue] of this.waitQueues.entries()) {
            if (queue.length === 0) {
                this.waitQueues.delete(filePath)
                cleanedQueues++
            }
        }
        
        if (cleanedLocks > 0 || cleanedQueues > 0) {
            this.emit('cleanup:completed', { cleanedLocks, cleanedQueues })
        }
    }
    
   
    destroy() {
        // 释放所有锁
        for (const lockId of this.holders.keys()) {
            try {
                this.releaseLock(lockId)
            } catch (error) {}
        }
        
        // 清理所有数据结构
        this.locks.clear()
        this.holders.clear()
        this.waitQueues.clear()
        
        this.emit('manager:destroyed')
    }
}

export default FileLockManager