import { EventEmitter } from 'events'

/**
 * 锁监控和统计模块
 * 提供锁系统的性能监控、统计分析和报告功能
 */
class LockMonitor extends EventEmitter {
    constructor(config = {}) {
        super()
        
        this.config = {
            enableRealTimeMonitoring: true,     // 启用实时监控
            statisticsInterval: 60000,          // 统计间隔（1分钟）
            maxHistorySize: 1000,               // 最大历史记录数
            alertThresholds: {                  // 告警阈值
                lockWaitTime: 10000,            // 锁等待时间阈值（10秒）
                lockHoldTime: 30000,            // 锁持有时间阈值（30秒）
                deadlockCount: 5,               // 死锁数量阈值
                failureRate: 0.1                // 失败率阈值（10%）
            },
            enableAlerts: true,                 // 启用告警
            logLevel: 'info',                   // 日志级别
            ...config
        }
        
        // 实时统计数据
        this.realTimeStats = {
            activeLocks: new Map(),             // 活跃锁信息
            lockQueue: new Map(),               // 锁等待队列
            currentOperations: new Map(),       // 当前操作
            systemLoad: {
                cpu: 0,
                memory: 0,
                lockCount: 0,
                queueLength: 0
            }
        }
        
        // 历史统计数据
        this.historicalStats = {
            lockOperations: [],                 // 锁操作历史
            performanceMetrics: [],             // 性能指标历史
            alerts: [],                         // 告警历史
            deadlocks: []                       // 死锁历史
        }
        
        // 聚合统计数据
        this.aggregatedStats = {
            totalLockRequests: 0,               // 总锁请求数
            successfulLocks: 0,                 // 成功获取锁数
            failedLocks: 0,                     // 失败锁数
            timeoutLocks: 0,                    // 超时锁数
            deadlockCount: 0,                   // 死锁数量
            avgWaitTime: 0,                     // 平均等待时间
            avgHoldTime: 0,                     // 平均持有时间
            peakConcurrency: 0,                 // 峰值并发数
            hotspotFiles: new Map(),            // 热点文件统计
            operationTypes: new Map()           // 操作类型统计
        }
        
        // 性能指标
        this.performanceMetrics = {
            throughput: 0,                      // 吞吐量（操作/秒）
            latency: {                          // 延迟统计
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0
            },
            errorRate: 0,                       // 错误率
            resourceUtilization: 0              // 资源利用率
        }
        
        // 定时器
        this.statisticsTimer = null
        this.monitoringTimer = null
        
        // 启动监控
        this.startMonitoring()
        
        this.emit('monitor:initialized', { config: this.config })
    }
    
    /**
     * 记录锁请求
     * @param {string} lockId - 锁ID
     * @param {string} filePath - 文件路径
     * @param {string} lockType - 锁类型
     * @param {string} operationId - 操作ID
     * @param {object} metadata - 元数据
     */
    recordLockRequest(lockId, filePath, lockType, operationId, metadata = {}) {
        const timestamp = Date.now()
        
        // 更新实时统计
        this.realTimeStats.currentOperations.set(operationId, {
            lockId,
            filePath,
            lockType,
            startTime: timestamp,
            status: 'waiting',
            metadata
        })
        
        // 更新聚合统计
        this.aggregatedStats.totalLockRequests++
        
        // 更新操作类型统计
        const opType = `${lockType}_${metadata.operation || 'unknown'}`
        this.aggregatedStats.operationTypes.set(
            opType,
            (this.aggregatedStats.operationTypes.get(opType) || 0) + 1
        )
        
        // 更新热点文件统计
        this.aggregatedStats.hotspotFiles.set(
            filePath,
            (this.aggregatedStats.hotspotFiles.get(filePath) || 0) + 1
        )
        
        this.emit('lock:request_recorded', { lockId, filePath, lockType, operationId })
    }
    
    /**
     * 记录锁获取成功
     * @param {string} lockId - 锁ID
     * @param {string} operationId - 操作ID
     * @param {number} waitTime - 等待时间
     */
    recordLockAcquired(lockId, operationId, waitTime) {
        const timestamp = Date.now()
        
        // 更新当前操作状态
        const operation = this.realTimeStats.currentOperations.get(operationId)
        if (operation) {
            operation.status = 'acquired'
            operation.waitTime = waitTime
            operation.acquiredTime = timestamp
        }
        
        // 添加到活跃锁
        this.realTimeStats.activeLocks.set(lockId, {
            operationId,
            acquiredTime: timestamp,
            waitTime
        })
        
        // 更新聚合统计
        this.aggregatedStats.successfulLocks++
        this.updateAverageWaitTime(waitTime)
        
        // 更新峰值并发数
        const currentConcurrency = this.realTimeStats.activeLocks.size
        if (currentConcurrency > this.aggregatedStats.peakConcurrency) {
            this.aggregatedStats.peakConcurrency = currentConcurrency
        }
        
        // 检查告警
        if (this.config.enableAlerts && waitTime > this.config.alertThresholds.lockWaitTime) {
            this.triggerAlert('high_wait_time', {
                lockId,
                operationId,
                waitTime,
                threshold: this.config.alertThresholds.lockWaitTime
            })
        }
        
        this.emit('lock:acquired_recorded', { lockId, operationId, waitTime })
    }
    
    /**
     * 记录锁释放
     * @param {string} lockId - 锁ID
     * @param {string} operationId - 操作ID
     * @param {number} holdTime - 持有时间
     */
    recordLockReleased(lockId, operationId, holdTime) {
        const timestamp = Date.now()
        
        // 从活跃锁中移除
        const lockInfo = this.realTimeStats.activeLocks.get(lockId)
        if (lockInfo) {
            this.realTimeStats.activeLocks.delete(lockId)
        }
        
        // 更新当前操作状态
        const operation = this.realTimeStats.currentOperations.get(operationId)
        if (operation) {
            operation.status = 'completed'
            operation.holdTime = holdTime
            operation.completedTime = timestamp
            
            // 记录到历史
            this.recordOperationHistory(operation)
            
            // 从当前操作中移除
            this.realTimeStats.currentOperations.delete(operationId)
        }
        
        // 更新聚合统计
        this.updateAverageHoldTime(holdTime)
        
        // 检查告警
        if (this.config.enableAlerts && holdTime > this.config.alertThresholds.lockHoldTime) {
            this.triggerAlert('high_hold_time', {
                lockId,
                operationId,
                holdTime,
                threshold: this.config.alertThresholds.lockHoldTime
            })
        }
        
        this.emit('lock:released_recorded', { lockId, operationId, holdTime })
    }
    
    /**
     * 记录锁失败
     * @param {string} lockId - 锁ID
     * @param {string} operationId - 操作ID
     * @param {string} reason - 失败原因
     * @param {object} error - 错误信息
     */
    recordLockFailed(lockId, operationId, reason, error = null) {
        const timestamp = Date.now()
        
        // 更新当前操作状态
        const operation = this.realTimeStats.currentOperations.get(operationId)
        if (operation) {
            operation.status = 'failed'
            operation.failureReason = reason
            operation.error = error
            operation.failedTime = timestamp
            
            // 记录到历史
            this.recordOperationHistory(operation)
            
            // 从当前操作中移除
            this.realTimeStats.currentOperations.delete(operationId)
        }
        
        // 更新聚合统计
        if (reason === 'timeout') {
            this.aggregatedStats.timeoutLocks++
        } else {
            this.aggregatedStats.failedLocks++
        }
        
        this.emit('lock:failed_recorded', { lockId, operationId, reason, error })
    }
    
    /**
     * 记录死锁事件
     * @param {object} deadlockInfo - 死锁信息
     */
    recordDeadlock(deadlockInfo) {
        const timestamp = Date.now()
        
        // 添加到死锁历史
        const deadlockRecord = {
            ...deadlockInfo,
            recordedAt: timestamp
        }
        
        this.historicalStats.deadlocks.push(deadlockRecord)
        this.aggregatedStats.deadlockCount++
        
        // 限制历史记录大小
        if (this.historicalStats.deadlocks.length > this.config.maxHistorySize) {
            this.historicalStats.deadlocks.shift()
        }
        
        // 检查告警
        if (this.config.enableAlerts) {
            this.triggerAlert('deadlock_detected', deadlockInfo)
            
            // 检查死锁频率告警
            const recentDeadlocks = this.getRecentDeadlocks(300000) // 5分钟内
            if (recentDeadlocks.length >= this.config.alertThresholds.deadlockCount) {
                this.triggerAlert('high_deadlock_frequency', {
                    count: recentDeadlocks.length,
                    timeWindow: 300000,
                    threshold: this.config.alertThresholds.deadlockCount
                })
            }
        }
        
        this.emit('deadlock:recorded', deadlockRecord)
    }
    
    /**
     * 记录操作历史
     * @param {object} operation - 操作信息
     */
    recordOperationHistory(operation) {
        const historyRecord = {
            ...operation,
            totalTime: operation.completedTime - operation.startTime
        }
        
        this.historicalStats.lockOperations.push(historyRecord)
        
        // 限制历史记录大小
        if (this.historicalStats.lockOperations.length > this.config.maxHistorySize) {
            this.historicalStats.lockOperations.shift()
        }
    }
    
    /**
     * 更新平均等待时间
     * @param {number} waitTime - 等待时间
     */
    updateAverageWaitTime(waitTime) {
        if (this.aggregatedStats.successfulLocks === 1) {
            this.aggregatedStats.avgWaitTime = waitTime
        } else {
            this.aggregatedStats.avgWaitTime = 
                (this.aggregatedStats.avgWaitTime + waitTime) / 2
        }
    }
    
    /**
     * 更新平均持有时间
     * @param {number} holdTime - 持有时间
     */
    updateAverageHoldTime(holdTime) {
        const completedOps = this.aggregatedStats.successfulLocks
        if (completedOps === 1) {
            this.aggregatedStats.avgHoldTime = holdTime
        } else {
            this.aggregatedStats.avgHoldTime = 
                (this.aggregatedStats.avgHoldTime + holdTime) / 2
        }
    }
    
    /**
     * 计算性能指标
     */
    calculatePerformanceMetrics() {
        const now = Date.now()
        const timeWindow = 60000 // 1分钟窗口
        
        // 获取最近的操作
        const recentOps = this.historicalStats.lockOperations.filter(
            op => (now - op.completedTime) <= timeWindow
        )
        
        if (recentOps.length === 0) {
            return
        }
        
        // 计算吞吐量
        this.performanceMetrics.throughput = recentOps.length / (timeWindow / 1000)
        
        // 计算延迟百分位数
        const totalTimes = recentOps.map(op => op.totalTime).sort((a, b) => a - b)
        const len = totalTimes.length
        
        this.performanceMetrics.latency.p50 = totalTimes[Math.floor(len * 0.5)]
        this.performanceMetrics.latency.p90 = totalTimes[Math.floor(len * 0.9)]
        this.performanceMetrics.latency.p95 = totalTimes[Math.floor(len * 0.95)]
        this.performanceMetrics.latency.p99 = totalTimes[Math.floor(len * 0.99)]
        
        // 计算错误率
        const failedOps = recentOps.filter(op => op.status === 'failed').length
        this.performanceMetrics.errorRate = failedOps / recentOps.length
        
        // 计算资源利用率
        this.performanceMetrics.resourceUtilization = 
            this.realTimeStats.activeLocks.size / this.aggregatedStats.peakConcurrency
        
        // 记录性能指标历史
        this.historicalStats.performanceMetrics.push({
            timestamp: now,
            metrics: { ...this.performanceMetrics }
        })
        
        // 限制历史记录大小
        if (this.historicalStats.performanceMetrics.length > this.config.maxHistorySize) {
            this.historicalStats.performanceMetrics.shift()
        }
    }
    
    /**
     * 触发告警
     * @param {string} alertType - 告警类型
     * @param {object} alertData - 告警数据
     */
    triggerAlert(alertType, alertData) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: alertType,
            severity: this.getAlertSeverity(alertType),
            data: alertData,
            timestamp: new Date(),
            acknowledged: false
        }
        
        this.historicalStats.alerts.push(alert)
        
        // 限制告警历史大小
        if (this.historicalStats.alerts.length > this.config.maxHistorySize) {
            this.historicalStats.alerts.shift()
        }
        
        this.emit('alert:triggered', alert)
        

        if (alert.severity === 'critical') {
            console.error(`[凑哈吉煤提醒你：]  严重告警: ${alertType}`, alertData)
        } else if (alert.severity === 'warning') {
            console.warn(`[凑哈吉煤提醒你：]  警告: ${alertType}`, alertData)
        } else {
            console.info(`[凑哈吉煤提醒你：]  信息: ${alertType}`, alertData)
        }
    }
    
    /**
     * 获取告警严重程度
     * @param {string} alertType - 告警类型
     * @returns {string} 严重程度
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            'high_wait_time': 'warning',
            'high_hold_time': 'warning',
            'deadlock_detected': 'critical',
            'high_deadlock_frequency': 'critical',
            'high_failure_rate': 'warning',
            'system_overload': 'critical'
        }
        
        return severityMap[alertType] || 'info'
    }
    
    /**
     * 获取最近的死锁记录
     * @param {number} timeWindow - 时间窗口（毫秒）
     * @returns {Array} 死锁记录列表
     */
    getRecentDeadlocks(timeWindow) {
        const now = Date.now()
        return this.historicalStats.deadlocks.filter(
            deadlock => (now - deadlock.recordedAt) <= timeWindow
        )
    }
    
    /**
     * 启动监控
     */
    startMonitoring() {
        if (this.config.enableRealTimeMonitoring) {
            // 启动统计计算定时器
            this.statisticsTimer = setInterval(() => {
                this.calculatePerformanceMetrics()
                this.updateSystemLoad()
                this.checkAlertConditions()
            }, this.config.statisticsInterval)
            
            this.emit('monitoring:started')
        }
    }
    
    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.statisticsTimer) {
            clearInterval(this.statisticsTimer)
            this.statisticsTimer = null
        }
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer)
            this.monitoringTimer = null
        }
        
        this.emit('monitoring:stopped')
    }
    
    /**
     * 更新系统负载
     */
    updateSystemLoad() {
        this.realTimeStats.systemLoad = {
            cpu: process.cpuUsage ? this.getCpuUsage() : 0,
            memory: this.getMemoryUsage(),
            lockCount: this.realTimeStats.activeLocks.size,
            queueLength: this.realTimeStats.currentOperations.size
        }
    }
    
    /**
     * 待实现
     */
    getCpuUsage() {
        return false
    }
    
    /**
     * 获取内存使用率
     * @returns {number} 内存使用率百分比
     */
    getMemoryUsage() {
        const usage = process.memoryUsage()
        return (usage.heapUsed / usage.heapTotal) * 100
    }
    
    /**
     * 检查告警条件
     */
    checkAlertConditions() {
        // 检查失败率
        const totalOps = this.aggregatedStats.totalLockRequests
        const failedOps = this.aggregatedStats.failedLocks + this.aggregatedStats.timeoutLocks
        
        if (totalOps > 0) {
            const failureRate = failedOps / totalOps
            if (failureRate > this.config.alertThresholds.failureRate) {
                this.triggerAlert('high_failure_rate', {
                    failureRate,
                    threshold: this.config.alertThresholds.failureRate,
                    totalOps,
                    failedOps
                })
            }
        }
    }
    
    /**
     * 获取实时统计
     * @returns {object} 实时统计数据
     */
    getRealTimeStats() {
        return {
            activeLocks: this.realTimeStats.activeLocks.size,
            queuedOperations: this.realTimeStats.currentOperations.size,
            systemLoad: { ...this.realTimeStats.systemLoad },
            currentOperations: Array.from(this.realTimeStats.currentOperations.values())
        }
    }
    
    /**
     * 获取聚合统计
     * @returns {object} 聚合统计数据
     */
    getAggregatedStats() {
        return {
            ...this.aggregatedStats,
            successRate: this.aggregatedStats.totalLockRequests > 0
                ? (this.aggregatedStats.successfulLocks / this.aggregatedStats.totalLockRequests * 100).toFixed(2) + '%'
                : '0%',
            failureRate: this.aggregatedStats.totalLockRequests > 0
                ? ((this.aggregatedStats.failedLocks + this.aggregatedStats.timeoutLocks) / this.aggregatedStats.totalLockRequests * 100).toFixed(2) + '%'
                : '0%',
            hotspotFiles: Array.from(this.aggregatedStats.hotspotFiles.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10), // 前10个热点文件
            operationTypes: Array.from(this.aggregatedStats.operationTypes.entries())
                .sort((a, b) => b[1] - a[1])
        }
    }
    
    /**
     * 获取性能指标
     * @returns {object} 性能指标
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics }
    }
    
    /**
     * 获取告警列表
     * @param {boolean} onlyUnacknowledged - 只返回未确认的告警
     * @returns {Array} 告警列表
     */
    getAlerts(onlyUnacknowledged = false) {
        let alerts = [...this.historicalStats.alerts]
        
        if (onlyUnacknowledged) {
            alerts = alerts.filter(alert => !alert.acknowledged)
        }
        
        return alerts.sort((a, b) => b.timestamp - a.timestamp)
    }
    
    /**
     * 确认告警
     * @param {string} alertId - 告警ID
     * @returns {boolean} 是否成功确认
     */
    acknowledgeAlert(alertId) {
        const alert = this.historicalStats.alerts.find(a => a.id === alertId)
        if (alert) {
            alert.acknowledged = true
            alert.acknowledgedAt = new Date()
            this.emit('alert:acknowledged', alert)
            return true
        }
        return false
    }
    
    /**
     * 生成监控报告
     * @param {object} options - 报告选项
     * @returns {object} 监控报告
     */
    generateReport(options = {}) {
        const {
            timeRange = 3600000, // 默认1小时
            includeDetails = false
        } = options
        
        const now = Date.now()
        const startTime = now - timeRange
        
        // 过滤时间范围内的数据
        const recentOps = this.historicalStats.lockOperations.filter(
            op => op.completedTime >= startTime
        )
        
        const recentAlerts = this.historicalStats.alerts.filter(
            alert => alert.timestamp >= startTime
        )
        
        const recentDeadlocks = this.historicalStats.deadlocks.filter(
            deadlock => deadlock.recordedAt >= startTime
        )
        
        const report = {
            reportTime: new Date(),
            timeRange: {
                start: new Date(startTime),
                end: new Date(now),
                duration: timeRange
            },
            summary: {
                totalOperations: recentOps.length,
                successfulOperations: recentOps.filter(op => op.status === 'completed').length,
                failedOperations: recentOps.filter(op => op.status === 'failed').length,
                alertsTriggered: recentAlerts.length,
                deadlocksDetected: recentDeadlocks.length,
                avgResponseTime: recentOps.length > 0
                    ? recentOps.reduce((sum, op) => sum + op.totalTime, 0) / recentOps.length
                    : 0
            },
            currentState: this.getRealTimeStats(),
            performanceMetrics: this.getPerformanceMetrics()
        }
        
        if (includeDetails) {
            report.details = {
                operations: recentOps,
                alerts: recentAlerts,
                deadlocks: recentDeadlocks
            }
        }
        
        return report
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.aggregatedStats = {
            totalLockRequests: 0,
            successfulLocks: 0,
            failedLocks: 0,
            timeoutLocks: 0,
            deadlockCount: 0,
            avgWaitTime: 0,
            avgHoldTime: 0,
            peakConcurrency: 0,
            hotspotFiles: new Map(),
            operationTypes: new Map()
        }
        
        this.historicalStats.lockOperations.length = 0
        this.historicalStats.performanceMetrics.length = 0
        this.historicalStats.alerts.length = 0
        this.historicalStats.deadlocks.length = 0
        
        this.emit('stats:reset')
    }
    
    /**
     * 销毁监控器
     */
    destroy() {
        this.stopMonitoring()
        this.resetStats()
        this.removeAllListeners()
        
        this.emit('monitor:destroyed')
    }
}

export default LockMonitor