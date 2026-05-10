export default {
    // 基础配置
    enabled: true,                      // 是否启用文件锁功能
    logLevel: 'info',

    // 锁管理器配置
    lockManager: {
        defaultTimeout: 30000,          // 默认锁超时时间（毫秒）
        maxConcurrentLocks: 1000,       // 最大并发锁数量
        cleanupInterval: 60000,         // 清理间隔（毫秒）
        enableDeadlockDetection: true,  // 启用死锁检测
        enablePriorityQueue: true,      // 启用优先级队列
        enableStatistics: true          // 启用统计功能
    },

    // 读写锁配置
    readWriteLock: {
        maxReaders: 100,                // 最大并发读者数量
        readerTimeout: 15000,           // 读锁超时时间（毫秒）
        writerTimeout: 30000,           // 写锁超时时间（毫秒）
        enableUpgrade: true,            // 启用锁升级
        enableDowngrade: true,          // 启用锁降级
        fairMode: true                  // 公平模式（防止写锁饥饿）
    },

    // 死锁检测配置
    deadlockDetector: {
        enabled: true,                  // 启用死锁检测
        checkInterval: 5000,            // 检测间隔（毫秒）
        maxWaitTime: 60000,             // 最大等待时间（毫秒）
        enableAutoResolve: true,        // 启用自动解决
        resolutionStrategy: 'youngest', // 解决策略: 'youngest', 'oldest', 'random'
        enableHistory: true,            // 启用历史记录
        maxHistorySize: 1000            // 最大历史记录数量
    },

    // 安全文件操作配置
    safeFileOperations: {
        defaultTimeout: 30000,          // 默认操作超时时间（毫秒）
        retryAttempts: 3,               // 重试次数
        retryDelay: 1000,               // 重试延迟（毫秒）
        enableBackup: true,             // 启用备份功能
        backupSuffix: '.backup',        // 备份文件后缀
        enableRestore: true,            // 启用恢复功能
        enableOperationLog: true        // 启用操作日志
    },

    // 监控配置
    monitor: {
        enabled: true,                  // 启用监控
        enableRealTimeMonitoring: true, // 启用实时监控
        enablePerformanceMetrics: true, // 启用性能指标
        enableAlerts: true,             // 启用告警
        alertThresholds: {
            lockWaitTime: 10000,        // 锁等待时间告警阈值（毫秒）
            lockHoldTime: 30000,        // 锁持有时间告警阈值（毫秒）
            failureRate: 0.1,           // 失败率告警阈值（0-1）
            deadlockCount: 5            // 死锁数量告警阈值
        },
        reportInterval: 300000,         // 报告间隔（毫秒）
        maxEventHistory: 10000          // 最大事件历史记录数量
    },

    // 集成配置
    integration: {
        enableLocking: true,            // 启用文件锁集成
        enableMonitoring: true,         // 启用监控集成
        enableDeadlockDetection: true,  // 启用死锁检测集成
        lockTimeout: 30000,             // 集成锁超时时间（毫秒）
        retryAttempts: 3,               // 集成重试次数
        fallbackToSync: true,           // 失败时回退到同步操作
        enableBatchOperations: true     // 启用批量操作
    },

    // 性能优化配置
    performance: {
        enableCaching: true,            // 启用缓存
        cacheSize: 1000,                // 缓存大小
        cacheTTL: 300000,               // 缓存TTL（毫秒）
        enableCompression: false,       // 启用压缩（暂不支持）
        enableAsyncOperations: true,    // 启用异步操作
        batchSize: 10,                  // 批处理大小
        maxConcurrentOperations: 50     // 最大并发操作数
    },

    // 调试配置
    debug: {
        enableDebugMode: false,         // 启用调试模式
        enableVerboseLogging: false,    // 启用详细日志
        enableStackTrace: false,        // 启用堆栈跟踪
        enablePerformanceProfiling: false, // 启用性能分析
        logFilePath: './logs/debug.log' // 调试日志文件路径
    }
}
