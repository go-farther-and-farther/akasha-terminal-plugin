import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import FileLockManager from './FileLockManager.js'

const fsPromises = {
    readFile: promisify(fs.readFile),
    writeFile: promisify(fs.writeFile),
    appendFile: promisify(fs.appendFile),
    unlink: promisify(fs.unlink),
    mkdir: promisify(fs.mkdir),
    rmdir: promisify(fs.rmdir),
    stat: promisify(fs.stat),
    access: promisify(fs.access),
    copyFile: promisify(fs.copyFile),
    rename: promisify(fs.rename)
}


class SafeFileOperations {
    constructor(lockManager = null, config = {}) {
        this.lockManager = lockManager || new FileLockManager()
        
        this.config = {
            defaultTimeout: 30000,      // 默认超时时间（30秒）
            retryAttempts: 3,           // 重试次数
            retryDelay: 1000,           // 重试延迟（1秒）
            enableBackup: true,         // 启用备份
            backupSuffix: '.backup',    // 备份文件后缀
            logLevel: 'info',          
            ...config
        }
        
        // 操作统计
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            retriedOperations: 0,
            avgOperationTime: 0
        }
    }
    
    /**
     * 安全读取文件
     * @param {string} filePath - 文件路径
     * @param {object} options - 选项
     * @returns {Promise<Buffer|string>} 文件内容
     */
    async readFile(filePath, options = {}) {
        const normalizedPath = path.resolve(filePath)
        const operationId = this.generateOperationId('read', normalizedPath)
        
        return this.executeWithLock(
            normalizedPath,
            'read',
            async () => {
                const encoding = options.encoding || null
                const result = await fsPromises.readFile(normalizedPath, { encoding })
                
                this.logOperation(operationId, 'read', normalizedPath, 'success')
                return result
            },
            options,
            operationId
        )
    }
    
    /**
     * 写入文件
     * @param {string} filePath - 文件路径
     * @param {string|Buffer} data - 写入数据
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async writeFile(filePath, data, options = {}) {
        const normalizedPath = path.resolve(filePath)
        const operationId = this.generateOperationId('write', normalizedPath)
        
        return this.executeWithLock(
            normalizedPath,
            'write',
            async () => {
                // 创建备份（如果启用）
                let backupPath = null
                if (this.config.enableBackup && await this.fileExists(normalizedPath)) {
                    backupPath = await this.createBackup(normalizedPath)
                }
                
                try {
                    // 确保目录存在
                    await this.ensureDirectoryExists(path.dirname(normalizedPath))
                    
                    // 写入文件
                    const encoding = options.encoding || 'utf8'
                    await fsPromises.writeFile(normalizedPath, data, { encoding })
                    
                    // 删除备份文件（如果写成功）
                    if (backupPath && this.config.enableBackup) {
                        await this.deleteBackup(backupPath)
                    }
                    
                    this.logOperation(operationId, 'write', normalizedPath, 'success')
                } catch (error) {
                    // 恢复备份（如果失败）
                    if (backupPath && this.config.enableBackup) {
                        await this.restoreBackup(backupPath, normalizedPath)
                    }
                    throw error
                }
            },
            options,
            operationId
        )
    }
    
    /**
     * 安全追加文件
     * @param {string} filePath - 文件路径
     * @param {string|Buffer} data - 追加数据
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async appendFile(filePath, data, options = {}) {
        const normalizedPath = path.resolve(filePath)
        const operationId = this.generateOperationId('append', normalizedPath)
        
        return this.executeWithLock(
            normalizedPath,
            'write',
            async () => {
               
                await this.ensureDirectoryExists(path.dirname(normalizedPath))
                
                const encoding = options.encoding || 'utf8'
                await fsPromises.appendFile(normalizedPath, data, { encoding })
                
                this.logOperation(operationId, 'append', normalizedPath, 'success')
            },
            options,
            operationId
        )
    }
    
    /**
     * 删除文件
     * @param {string} filePath - 文件路径
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async deleteFile(filePath, options = {}) {
        const normalizedPath = path.resolve(filePath)
        const operationId = this.generateOperationId('delete', normalizedPath)
        
        return this.executeWithLock(
            normalizedPath,
            'write',
            async () => {
                // 创建备份（如果启用）
                let backupPath = null
                if (this.config.enableBackup && await this.fileExists(normalizedPath)) {
                    backupPath = await this.createBackup(normalizedPath)
                }
                
                try {
                    await fsPromises.unlink(normalizedPath)
                    this.logOperation(operationId, 'delete', normalizedPath, 'success')
                } catch (error) {
                    // 恢复备份（如果删除失败）
                    if (backupPath && this.config.enableBackup) {
                        await this.restoreBackup(backupPath, normalizedPath)
                    }
                    throw error
                }
            },
            options,
            operationId
        )
    }
    
    /**
     * 复制文件
     * @param {string} srcPath - 源文件路径
     * @param {string} destPath - 目标文件路径
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async copyFile(srcPath, destPath, options = {}) {
        const normalizedSrc = path.resolve(srcPath)
        const normalizedDest = path.resolve(destPath)
        const operationId = this.generateOperationId('copy', `${normalizedSrc} -> ${normalizedDest}`)
        
        // 要对两个文件都加锁
        const lockPaths = [normalizedSrc, normalizedDest].sort() // 排序避免死锁
        
        return this.executeWithMultipleLocks(
            lockPaths,
            ['read', 'write'],
            async () => {
              
                await this.ensureDirectoryExists(path.dirname(normalizedDest))
                await fsPromises.copyFile(normalizedSrc, normalizedDest)
                this.logOperation(operationId, 'copy', `${normalizedSrc} -> ${normalizedDest}`, 'success')
            },
            options,
            operationId
        )
    }
    
    /**
     * 重命名文件
     * @param {string} oldPath - 旧文件路径
     * @param {string} newPath - 新文件路径
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async renameFile(oldPath, newPath, options = {}) {
        const normalizedOld = path.resolve(oldPath)
        const normalizedNew = path.resolve(newPath)
        const operationId = this.generateOperationId('rename', `${normalizedOld} -> ${normalizedNew}`)
        const lockPaths = [normalizedOld, normalizedNew].sort() // 排序避免死锁
        
        return this.executeWithMultipleLocks(
            lockPaths,
            ['write', 'write'],
            async () => {
                // 确保目标目录存在
                await this.ensureDirectoryExists(path.dirname(normalizedNew))
                
                await fsPromises.rename(normalizedOld, normalizedNew)
                this.logOperation(operationId, 'rename', `${normalizedOld} -> ${normalizedNew}`, 'success')
            },
            options,
            operationId
        )
    }
    
    /**
     * 读取JSON文件
     * @param {string} filePath - 文件路径
     * @param {object} options - 选项
     * @returns {Promise<object>} 解析后的JSON对象
     */
    async readJsonFile(filePath, options = {}) {
        const content = await this.readFile(filePath, { encoding: 'utf8', ...options })
        
        try {
            return JSON.parse(content)
        } catch (error) {
            throw new Error(`JSON解析失败: ${error.message}`)
        }
    }
    
    /**
     * 写入JSON文件
     * @param {string} filePath - 文件路径
     * @param {object} data - 要写入的对象
     * @param {object} options - 选项
     * @returns {Promise<void>}
     */
    async writeJsonFile(filePath, data, options = {}) {
        const jsonString = JSON.stringify(data, null, options.indent || 2)
        await this.writeFile(filePath, jsonString, { encoding: 'utf8', ...options })
    }
    
    /**
     * 使用锁执行操作
     * @param {string} filePath - 文件路径
     * @param {string} lockType - 锁类型
     * @param {Function} operation - 操作函数
     * @param {object} options - 选项
     * @param {string} operationId - 操作ID
     * @returns {Promise<any>} 操作结果
     */
    async executeWithLock(filePath, lockType, operation, options = {}, operationId) {
        const startTime = Date.now()
        this.stats.totalOperations++
        
        const timeout = options.timeout || this.config.defaultTimeout
        const retryAttempts = options.retryAttempts || this.config.retryAttempts
        
        let lastError = null
        
        for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
                // 获取锁
                const lock = await this.lockManager.acquireLock(
                    filePath,
                    lockType,
                    { timeout, operationId }
                )
                
                try {
                    // 执行操作
                    const result = await operation()
                    
                    // 更新统计
                    const operationTime = Date.now() - startTime
                    this.updateStats(true, operationTime, attempt > 0)
                    
                    return result
                } finally {
                    // 释放锁
                    await this.lockManager.releaseLock(filePath, lock.id)
                }
            } catch (error) {
                lastError = error
                
                // 如果是最后一次尝试，抛出错误
                if (attempt === retryAttempts) {
                    this.updateStats(false, Date.now() - startTime, attempt > 0)
                    this.logOperation(operationId, lockType, filePath, 'failed', error.message)
                    throw error
                }
                
                // 等待后重试
                if (attempt < retryAttempts) {
                    await this.delay(this.config.retryDelay * (attempt + 1))
                }
            }
        }
        
        throw lastError
    }
    
    /**
     * 使用多锁执行操作
     * @param {Array} filePaths - 文件路径列表
     * @param {Array} lockTypes - 锁类型列表
     * @param {Function} operation - 操作函数
     * @param {object} options - 选项
     * @param {string} operationId - 操作ID
     * @returns {Promise<any>} 操作结果
     */
    async executeWithMultipleLocks(filePaths, lockTypes, operation, options = {}, operationId) {
        const startTime = Date.now()
        this.stats.totalOperations++
        
        const timeout = options.timeout || this.config.defaultTimeout
        const locks = []
        
        try {
            // 按顺序获取所有锁
            for (let i = 0; i < filePaths.length; i++) {
                const lock = await this.lockManager.acquireLock(
                    filePaths[i],
                    lockTypes[i] || 'write',
                    { timeout, operationId }
                )
                locks.push({ path: filePaths[i], lock })
            }
            
            // 执行操作
            const result = await operation()
            
            // 更新统计
            const operationTime = Date.now() - startTime
            this.updateStats(true, operationTime, false)
            
            return result
        } catch (error) {
            this.updateStats(false, Date.now() - startTime, false)
            this.logOperation(operationId, 'multi-lock', filePaths.join(', '), 'failed', error.message)
            throw error
        } finally {
            // 按相反顺序释放所有锁
            for (let i = locks.length - 1; i >= 0; i--) {
                try {
                    await this.lockManager.releaseLock(locks[i].path, locks[i].lock.id)
                } catch (error) {
                    console.error(`哈吉煤哭哭惹，释放锁失败: ${locks[i].path}`, error)
                }
            }
        }
    }
    
    /**
     * 创建备份文件
     * @param {string} filePath - 原文件路径
     * @returns {Promise<string>} 备份文件路径
     */
    async createBackup(filePath) {
        const backupPath = filePath + this.config.backupSuffix
        await fsPromises.copyFile(filePath, backupPath)
        return backupPath
    }
    
    /**
     * 删除备份文件
     * @param {string} backupPath - 备份文件路径
     * @returns {Promise<void>}
     */
    async deleteBackup(backupPath) {
        try {
            await fsPromises.unlink(backupPath)
        } catch (error) {
            // 忽略错误
        }
    }
    
    /**
     * 恢复备份文件
     * @param {string} backupPath - 备份文件路径
     * @param {string} originalPath - 原文件路径
     * @returns {Promise<void>}
     */
    async restoreBackup(backupPath, originalPath) {
        try {
            await fsPromises.copyFile(backupPath, originalPath)
            await this.deleteBackup(backupPath)
        } catch (error) {
            console.error(`哈吉煤哭哭惹，恢复备份失败: ${backupPath} -> ${originalPath}`, error)
        }
    }
    
    /**
     * 确保目录存在
     * @param {string} dirPath - 目录路径
     * @returns {Promise<void>}
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fsPromises.mkdir(dirPath, { recursive: true })
        } catch (error) {
            // 如果目录已存在，忽略错误
            if (error.code !== 'EEXIST') {
                throw error
            }
        }
    }
    
    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 是否存在
     */
    async fileExists(filePath) {
        try {
            await fsPromises.access(filePath)
            return true
        } catch {
            return false
        }
    }
    
    /**
     * 获取文件状态
     * @param {string} filePath - 文件路径
     * @returns {Promise<fs.Stats>} 文件状态
     */
    async getFileStats(filePath) {
        return await fsPromises.stat(filePath)
    }
    
    /**
     * 生成操作ID
     * @param {string} operation - 操作类型
     * @param {string} target - 目标路径
     * @returns {string} 操作ID
     */
    generateOperationId(operation, target) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        return `${operation}_${timestamp}_${random}`
    }
    
    /**
     * 记录日志
     * @param {string} operationId - 操作ID
     * @param {string} operation - 操作类型
     * @param {string} target - 目标路径
     * @param {string} status - 状态
     * @param {string} error - 错误信息
     */
    logOperation(operationId, operation, target, status, error = null) {
        if (this.config.logLevel === 'debug' || (this.config.logLevel === 'info' && status === 'failed')) {
            const logData = {
                operationId,
                operation,
                target,
                status,
                timestamp: new Date().toISOString(),
                error
            }
            
            if (status === 'success') {
                console.log(`哈吉煤哭哭惹： ${operation} ${target} - 成功`)
            } else {
                console.error(`哈吉煤哭哭惹： ${operation} ${target} - 失败:`, error)
            }
        }
    }
    
    /**
     * 更新统计信息
     * @param {boolean} success - 是否成功
     * @param {number} operationTime - 操作时间
     * @param {boolean} wasRetried - 是否重试过
     */
    updateStats(success, operationTime, wasRetried) {
        if (success) {
            this.stats.successfulOperations++
        } else {
            this.stats.failedOperations++
        }
        
        if (wasRetried) {
            this.stats.retriedOperations++
        }
        
        // 更新平均操作时间
        this.stats.avgOperationTime = (this.stats.avgOperationTime + operationTime) / 2
    }
    
   
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
   
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalOperations > 0 
                ? (this.stats.successfulOperations / this.stats.totalOperations * 100).toFixed(2) + '%'
                : '0%',
            retryRate: this.stats.totalOperations > 0
                ? (this.stats.retriedOperations / this.stats.totalOperations * 100).toFixed(2) + '%'
                : '0%'
        }
    }
    
  
    resetStats() {
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            retriedOperations: 0,
            avgOperationTime: 0
        }
    }
    
    /**
     * 获取锁管理器实例
     * @returns {FileLockManager} 锁管理器
     */
    getLockManager() {
        return this.lockManager
    }
    
    /**
     * 设置锁管理器
     * @param {FileLockManager} lockManager - 锁管理器实例
     */
    setLockManager(lockManager) {
        this.lockManager = lockManager
    }
}

export default SafeFileOperations