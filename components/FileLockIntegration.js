import fs from 'fs'
import path from 'path'
import SafeFileOperations from './SafeFileOperations.js'
import FileLockManager from './FileLockManager.js'
import LockMonitor from './LockMonitor.js'
import DeadlockDetector from './DeadlockDetector.js'

/**
 * 文件锁集成模块
 * 为现有代码提供无缝的文件锁集成
 */
class FileLockIntegration {
    constructor(config = {}) {
        this.config = {
            enableLocking: true,            // 启用文件锁
            enableMonitoring: true,         // 启用监控
            enableDeadlockDetection: true,  // 启用死锁检测
            lockTimeout: 30000,             // 锁超时时间
            retryAttempts: 3,               // 重试次数
            logLevel: 'info',               // 日志级别
            ...config
        }

        // 初始化组件
        this.lockManager = new FileLockManager({
            defaultTimeout: this.config.lockTimeout,
            enableDeadlockDetection: this.config.enableDeadlockDetection,
            logLevel: this.config.logLevel
        })

        this.monitor = this.config.enableMonitoring
            ? new LockMonitor({
                enableRealTimeMonitoring: true,
                logLevel: this.config.logLevel
            })
            : null

        this.safeFileOps = new SafeFileOperations(this.lockManager, {
            defaultTimeout: this.config.lockTimeout,
            retryAttempts: this.config.retryAttempts,
            logLevel: this.config.logLevel
        })

        // 连接监控器和锁管理器
        if (this.monitor) {
            this.connectMonitoring()
        }

        // 全局实例
        FileLockIntegration.instance = this
    }

    /**
     * 连接监控功能
     */
    connectMonitoring() {
        this.lockManager.on('lock:acquired', (data) => {
            this.monitor.recordLockAcquired(data.lockId, data.operationId, data.waitTime)
        })

        this.lockManager.on('lock:released', (data) => {
            this.monitor.recordLockReleased(data.lockId, data.operationId, data.holdTime)
        })

        this.lockManager.on('lock:failed', (data) => {
            this.monitor.recordLockFailed(data.lockId, data.operationId, data.reason, data.error)
        })

        this.lockManager.on('lock:request', (data) => {
            this.monitor.recordLockRequest(data.lockId, data.filePath, data.lockType, data.operationId, data.metadata)
        })

        if (this.lockManager.deadlockDetector) {
            this.lockManager.deadlockDetector.on('deadlock:detected', (data) => {
                data.cycles.forEach(cycle => {
                    this.monitor.recordDeadlock(cycle)
                })
            })
        }
    }

    /**
     * 获取全局实例
     */
    static getInstance() {
        if (!FileLockIntegration.instance) {
            FileLockIntegration.instance = new FileLockIntegration()
        }
        return FileLockIntegration.instance
    }

    /**
     * 安全的JSON读取操作
     */
    async readJSON(filePath, defaultValue = {}, options = {}) {
        if (!this.config.enableLocking) {
            return this.readJSONSync(filePath, defaultValue)
        }

        try {
            const exists = await this.safeFileOps.fileExists(filePath)
            if (!exists) {
                return defaultValue
            }

            return await this.safeFileOps.readJsonFile(filePath, options)
        } catch (error) {
            console.error(`[文件锁] 读取JSON文件失败: ${filePath}`, error)
            return defaultValue
        }
    }

    /**
     * 安全的JSON写入操作
     */
    async writeJSON(filePath, data, options = {}) {
        if (!this.config.enableLocking) {
            return this.writeJSONSync(filePath, data, options)
        }

        try {
            await this.safeFileOps.writeJsonFile(filePath, data, {
                indent: options.space || 2,
                ...options
            })
        } catch (error) {
            console.error(`[文件锁] 写入JSON文件失败: ${filePath}`, error)
            throw error
        }
    }

    /**
     * 同步JSON读取（兼容原有代码）
     */
    readJSONSync(filePath, defaultValue = {}) {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8')
                return JSON.parse(content)
            }
        } catch (error) {
            console.error(`[文件锁] 同步读取JSON失败: ${filePath}`, error)
        }

        return defaultValue
    }

    /**
     * 同步JSON写入（兼容原有代码）
     */
    writeJSONSync(filePath, data, options = {}) {
        try {
            const dir = path.dirname(filePath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            const jsonString = JSON.stringify(data, null, options.space || 2)
            fs.writeFileSync(filePath, jsonString, 'utf8')
        } catch (error) {
            console.error(`[文件锁] 同步写入JSON失败: ${filePath}`, error)
            throw error
        }
    }

    /**
     * 创建安全的文件操作包装器
     */
    wrapFileOperations(originalModule) {
        const wrapped = { ...originalModule }

        if (originalModule.readJSON) {
            wrapped.readJSON = async (file, root = '') => {
                const filePath = this.resolvePath(file, root)
                return await this.readJSON(filePath, {})
            }
        }

        if (originalModule.writeJSON) {
            wrapped.writeJSON = async (file, data, space = '\t', root = '') => {
                const filePath = this.resolvePath(file, root)
                return await this.writeJSON(filePath, data, { space })
            }
        }

        return wrapped
    }

    /**
     * 解析文件路径
     */
    resolvePath(file, root = '') {
        const _path = process.cwd()
        const plugin = 'akasha-terminal-plugin'

        if (root === 'root' || root === 'yunzai') {
            root = `${_path}/`
        } else if (!root) {
            root = `${_path}/plugins/${plugin}/`
        }

        return path.resolve(root, file)
    }

    /**
     * 创建用户数据操作包装器
     */
    wrapGetUser(originalGetUser) {
        return async (id, json, Template, filename, is_save) => {
            if (!id || id === '0' || id === 0 || id === 'undefined' || id === 'null' ||
                (typeof id === 'string' && id.length < 5)) {
                console.warn(`[文件锁] 无效的用户ID: ${id}`)
                return {}
            }

            const dirpath = "plugins/akasha-terminal-plugin/data"
            const filePath = `${dirpath}/${filename}`

            if (!this.config.enableLocking) {
                return await originalGetUser(id, json, Template, filename, is_save)
            }

            try {
                if (!is_save) {
                    let data = await this.readJSON(filePath, {})

                    if (!data.hasOwnProperty(id)) {
                        data[id] = Template
                        await this.writeJSON(filePath, data)
                    }

                    return data
                } else {
                    await this.writeJSON(filePath, json)
                    return json
                }
            } catch (error) {
                console.error(`[文件锁] getUser操作失败: ${filePath}`, error)
                return await originalGetUser(id, json, Template, filename, is_save)
            }
        }
    }

    /**
     * 创建用户数据操作包装器2
     */
    wrapGetUser2(originalGetUser2) {
        return async (user_id, json, dirname, is_save) => {
            if (!user_id || user_id === '0' || user_id === 0 || user_id === 'undefined' || user_id === 'null' ||
                (typeof user_id === 'string' && user_id.length < 5)) {
                console.warn(`[文件锁] 无效的用户ID: ${user_id}`)
                return {}
            }

            const dirpath = "plugins/akasha-terminal-plugin/data"
            const filename = `${user_id}.json`
            const filePath = `${dirpath}/${dirname}/${filename}`

            if (!this.config.enableLocking) {
                return await originalGetUser2(user_id, json, dirname, is_save)
            }

            try {
                if (is_save) {
                    await this.writeJSON(filePath, json)
                } else {
                    const data = await this.readJSON(filePath, {})
                    return data
                }
            } catch (error) {
                console.error(`[文件锁] getUser2操作失败: ${filePath}`, error)
                return await originalGetUser2(user_id, json, dirname, is_save)
            }
        }
    }

    /**
     * 批量文件操作
     */
    async batchOperations(operations) {
        const results = []

        for (const operation of operations) {
            try {
                let result

                switch (operation.type) {
                    case 'read':
                        result = await this.readJSON(operation.filePath, operation.defaultValue)
                        break
                    case 'write':
                        result = await this.writeJSON(operation.filePath, operation.data, operation.options)
                        break
                    case 'copy':
                        result = await this.safeFileOps.copyFile(operation.srcPath, operation.destPath, operation.options)
                        break
                    case 'delete':
                        result = await this.safeFileOps.deleteFile(operation.filePath, operation.options)
                        break
                    default:
                        throw new Error(`不支持的操作类型: ${operation.type}`)
                }

                results.push({ success: true, result, operation })
            } catch (error) {
                results.push({ success: false, error: error.message, operation })
            }
        }

        return results
    }

    /**
     * 获取系统状态
     */
    getSystemStatus() {
        const status = {
            lockManager: this.lockManager.getStatus(),
            safeFileOps: this.safeFileOps.getStats(),
            config: this.config
        }

        if (this.monitor) {
            status.monitor = {
                realTime: this.monitor.getRealTimeStats(),
                aggregated: this.monitor.getAggregatedStats(),
                performance: this.monitor.getPerformanceMetrics()
            }
        }

        return status
    }

    /**
     * 生成系统报告
     */
    generateReport(options = {}) {
        const report = {
            timestamp: new Date(),
            systemStatus: this.getSystemStatus()
        }

        if (this.monitor) {
            report.monitoringReport = this.monitor.generateReport(options)
        }

        return report
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.lockManager) {
            this.lockManager.cleanup()
        }

        if (this.monitor) {
            this.monitor.destroy()
        }

        if (this.safeFileOps) {
            this.safeFileOps.resetStats()
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.cleanup()
        FileLockIntegration.instance = null
    }
}

// 全局实例
let globalInstance = null

/**
 * 获取全局文件锁集成实例
 */
export function getFileLockIntegration(config = {}) {
    if (!globalInstance) {
        globalInstance = new FileLockIntegration(config)
    }
    return globalInstance
}

/**
 * 初始化文件锁集成
 */
export function initFileLockIntegration(config = {}) {
    if (globalInstance) {
        globalInstance.destroy()
    }
    globalInstance = new FileLockIntegration(config)
    return globalInstance
}

export default FileLockIntegration
