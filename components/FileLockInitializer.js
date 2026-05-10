import { initFileLockIntegration, getFileLockIntegration } from './FileLockIntegration.js'
import fileLockConfig from '../config/file_lock_config.js'

/**
 * 文件锁初始化器
 */
class FileLockInitializer {
    constructor() {
        this.initialized = false
        this.integration = null
        this.config = null
        this.startTime = null
    }

    /**
     * 初始化文件锁系统
     */
    async initialize(customConfig = {}) {
        if (this.initialized) {
            console.warn('[文件锁] 文件锁系统已经初始化')
            return true
        }

        try {
            this.startTime = Date.now()
            console.log('[文件锁] 开始初始化文件锁系统...')

            this.config = this.mergeConfig(fileLockConfig, customConfig)

            if (!this.validateConfig(this.config)) {
                throw new Error('配置验证失败')
            }

            this.integration = initFileLockIntegration(this.config.integration)

            await this.waitForSystemReady()

            this.setupEventListeners()

            if (this.config.monitor.enabled) {
                this.startMonitoring()
            }

            this.startCleanupTasks()

            this.initialized = true
            const initTime = Date.now() - this.startTime
            console.log(`[文件锁] 文件锁系统初始化完成，耗时: ${initTime}ms`)

            if (typeof this.logSystemStatus === 'function') {
                this.logSystemStatus()
            }

            return true
        } catch (error) {
            console.error('[文件锁] 文件锁系统初始化失败:', error)
            this.initialized = false
            return false
        }
    }

    /**
     * 合并配置
     */
    mergeConfig(defaultConfig, customConfig) {
        const merged = JSON.parse(JSON.stringify(defaultConfig))

        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {}
                    deepMerge(target[key], source[key])
                } else {
                    target[key] = source[key]
                }
            }
        }

        deepMerge(merged, customConfig)
        return merged
    }

    /**
     * 验证配置
     */
    validateConfig(config) {
        try {
            if (typeof config.enabled !== 'boolean') {
                throw new Error('config.enabled 必须是布尔值')
            }

            if (config.lockManager.defaultTimeout <= 0) {
                throw new Error('lockManager.defaultTimeout 必须大于0')
            }

            if (config.lockManager.maxConcurrentLocks <= 0) {
                throw new Error('lockManager.maxConcurrentLocks 必须大于0')
            }

            if (config.readWriteLock.maxReaders <= 0) {
                throw new Error('readWriteLock.maxReaders 必须大于0')
            }

            if (config.deadlockDetector.enabled) {
                if (config.deadlockDetector.checkInterval <= 0) {
                    throw new Error('deadlockDetector.checkInterval 必须大于0')
                }

                const validStrategies = ['youngest', 'oldest', 'random']
                if (!validStrategies.includes(config.deadlockDetector.resolutionStrategy)) {
                    throw new Error(`deadlockDetector.resolutionStrategy 必须是: ${validStrategies.join(', ')}`)
                }
            }

            if (config.safeFileOperations.retryAttempts < 0) {
                throw new Error('safeFileOperations.retryAttempts 不能小于0')
            }

            if (config.monitor.enabled) {
                if (config.monitor.alertThresholds.failureRate < 0 || config.monitor.alertThresholds.failureRate > 1) {
                    throw new Error('monitor.alertThresholds.failureRate 必须在0-1之间')
                }
            }

            return true
        } catch (error) {
            console.error('[文件锁] 配置验证失败:', error.message)
            return false
        }
    }

    /**
     * 等待系统准备就绪
     */
    async waitForSystemReady() {
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!this.integration) {
            throw new Error('文件锁集成未初始化')
        }

        if (!this.integration.lockManager) {
            throw new Error('锁管理器未初始化')
        }

        if (!this.integration.safeFileOps) {
            throw new Error('安全文件操作未初始化')
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (!this.integration) return

        process.on('uncaughtException', (error) => {
            console.error('[文件锁] 未捕获的异常:', error)
            this.handleSystemError(error)
        })

        process.on('unhandledRejection', (reason, promise) => {
            this.handleSystemError(reason)
        })

        process.on('SIGINT', () => {
            this.cleanup()
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            this.cleanup()
            process.exit(0)
        })
    }

    startMonitoring() {
        if (!this.config.monitor.enabled || !this.integration.monitor) {
            return
        }

        console.log('[文件锁] 启动文件锁监控系统')

        if (this.config.monitor.reportInterval > 0) {
            setInterval(() => {
                try {
                    const report = this.integration.generateReport()
                    this.processMonitoringReport(report)
                } catch (error) {
                    console.error('[文件锁] 生成监控报告失败:', error)
                }
            }, this.config.monitor.reportInterval)
        }
    }

    /**
     * 处理监控报告
     */
    processMonitoringReport(report) {
        if (this.config.debug.enableVerboseLogging) {
            console.log('[文件锁] 监控报告:', JSON.stringify(report, null, 2))
        }

        if (this.config.monitor.enableAlerts && report.monitoringReport) {
            this.checkAlerts(report.monitoringReport)
        }
    }

    checkAlerts(monitoringReport) {
        const thresholds = this.config.monitor.alertThresholds
        const metrics = monitoringReport.performanceMetrics

        if (!metrics) return

        if (metrics.avgWaitTime > thresholds.lockWaitTime) {
            console.warn(`[文件锁] 告警: 平均锁等待时间过长 (${metrics.avgWaitTime}ms > ${thresholds.lockWaitTime}ms)`)
        }

        if (metrics.avgHoldTime > thresholds.lockHoldTime) {
            console.warn(`[文件锁] 告警: 平均锁持有时间过长 (${metrics.avgHoldTime}ms > ${thresholds.lockHoldTime}ms)`)
        }

        if (metrics.failureRate > thresholds.failureRate) {
            console.warn(`[文件锁] 告警: 锁操作失败率过高 (${(metrics.failureRate * 100).toFixed(2)}% > ${(thresholds.failureRate * 100).toFixed(2)}%)`)
        }

        if (metrics.deadlockCount > thresholds.deadlockCount) {
            console.warn(`[文件锁] 告警: 死锁数量过多 (${metrics.deadlockCount} > ${thresholds.deadlockCount})`)
        }
    }

    startCleanupTasks() {
        if (this.config.lockManager.cleanupInterval > 0) {
            setInterval(() => {
                try {
                    if (this.integration && this.integration.lockManager) {
                        this.integration.lockManager.cleanup()
                    }
                } catch (error) {
                    console.error('[文件锁] 清理任务执行失败:', error)
                }
            }, this.config.lockManager.cleanupInterval)
        }
    }

    /**
     * 处理系统错误
     */
    handleSystemError(error) {
        if (this.config.debug.enableStackTrace) {
            console.error('[文件锁] 系统错误堆栈:', error.stack)
        }

        this.attemptRecovery(error)
    }

    /**
     * 尝试系统恢复
     */
    attemptRecovery(error) {
        console.log('[文件锁] 尝试系统恢复...')

        try {
            if (this.integration && this.integration.lockManager) {
                this.integration.lockManager.cleanup()
            }

            if (this.integration && this.integration.safeFileOps) {
                this.integration.safeFileOps.resetStats()
            }

            console.log('[文件锁] 系统恢复完成')
        } catch (recoveryError) {
            console.error('[文件锁] 系统恢复失败:', recoveryError)
        }
    }

    logSystemStatus() {
        if (!this.integration) return

        const status = this.integration.getSystemStatus()

        console.log('[文件锁] 系统状态:')
        console.log(`  - 锁管理器状态: ${status.lockManager.isActive ? '活跃' : '非活跃'}`)
        console.log(`  - 当前活跃锁数量: ${status.lockManager.activeLocks}`)
        console.log(`  - 等待队列长度: ${status.lockManager.queueLength}`)
        console.log(`  - 文件操作统计: 成功 ${status.safeFileOps.successCount}, 失败 ${status.safeFileOps.failureCount}`)

        if (status.monitor) {
            console.log(`  - 监控状态: 已启用`)
            console.log(`  - 实时统计: ${JSON.stringify(status.monitor.realTime)}`)
        }
    }

    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            startTime: this.startTime,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            config: this.config,
            integration: this.integration ? this.integration.getSystemStatus() : null
        }
    }

    /**
     * 重新加载配置
     */
    async reloadConfig(newConfig = {}) {
        try {
            console.log('[文件锁] 重新加载配置...')

            const mergedConfig = this.mergeConfig(this.config, newConfig)

            if (!this.validateConfig(mergedConfig)) {
                throw new Error('新配置验证失败')
            }

            this.config = mergedConfig

            if (this.integration) {
                this.integration.destroy()
                this.integration = initFileLockIntegration(this.config.integration)
            }

            console.log('[文件锁] 配置重新加载完成')
            return true
        } catch (error) {
            console.error('[文件锁] 配置重新加载失败:', error)
            return false
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (!this.initialized) return

        console.log('[文件锁] 开始清理文件锁系统资源...')

        try {
            if (this.integration) {
                this.integration.cleanup()
            }

            this.initialized = false
            console.log('[文件锁] 文件锁系统资源清理完成')
        } catch (error) {
            console.error('[文件锁] 清理资源时发生错误:', error)
        }
    }

    /**
     * 销毁初始化器
     */
    destroy() {
        this.cleanup()

        if (this.integration) {
            this.integration.destroy()
            this.integration = null
        }

        this.config = null
        this.startTime = null
    }
}

// 全局初始化器实例
let globalInitializer = null

/**
 * 获取全局初始化器实例
 */
export function getFileLockInitializer() {
    if (!globalInitializer) {
        globalInitializer = new FileLockInitializer()
    }
    return globalInitializer
}

/**
 * 初始化文件锁系统
 */
export async function initializeFileLockSystem(config = {}) {
    const initializer = getFileLockInitializer()
    return await initializer.initialize(config)
}

/**
 * 获取文件锁系统状态
 */
export function getFileLockSystemStatus() {
    const initializer = getFileLockInitializer()
    return initializer.getStatus()
}

/**
 * 清理文件锁系统
 */
export function cleanupFileLockSystem() {
    if (globalInitializer) {
        globalInitializer.cleanup()
    }
}

export default FileLockInitializer
