import { EventEmitter } from 'events'

/**
 * 死锁检测器
 * 使用等待图算法检测和解决死锁问题
 */
class DeadlockDetector extends EventEmitter {
    constructor(config = {}) {
        super()
        
        this.config = {
            checkInterval: 5000,        // 检测间隔（5秒）
            maxWaitTime: 60000,         // 最大等待时间（60秒）
            enableAutoResolve: true,    // 启用自动解决死锁
            resolutionStrategy: 'youngest', // 解决策略：'youngest', 'oldest', 'priority'
            logLevel: 'info',           
            ...config
        }
        
        // 等待图：记录锁依赖关系
        this.waitGraph = new Map() // holderId -> Set<resourceId>
        this.resourceOwners = new Map() // resourceId -> Set<holderId>
        this.waitingFor = new Map() // holderId -> Set<resourceId>
        
        // 检测历史
        this.detectionHistory = []
        this.maxHistorySize = 100
        
        // 统计信息
        this.stats = {
            totalDetections: 0,
            deadlocksFound: 0,
            deadlocksResolved: 0,
            avgDetectionTime: 0,
            lastDetectionTime: null
        }
        
        // 启动检测定时器
        this.detectionTimer = null
        this.startDetection()
        
        this.emit('detector:initialized', { config: this.config })
    }
    
    /**
     * 添加锁持有关系
     * @param {string} holderId - 持有者ID
     * @param {string} resourceId - 资源ID
     * @param {string} lockType - 锁类型
     */
    addLockHolder(holderId, resourceId, lockType) {
        // 记录资源所有者
        if (!this.resourceOwners.has(resourceId)) {
            this.resourceOwners.set(resourceId, new Set())
        }
        this.resourceOwners.get(resourceId).add(holderId)
        
        // 从等待图中移除（已获得锁）
        if (this.waitingFor.has(holderId)) {
            this.waitingFor.get(holderId).delete(resourceId)
            if (this.waitingFor.get(holderId).size === 0) {
                this.waitingFor.delete(holderId)
            }
        }
        
        this.emit('lock:holder_added', { holderId, resourceId, lockType })
    }
    
    /**
     * 移除锁持有关系
     * @param {string} holderId - 持有者ID
     * @param {string} resourceId - 资源ID
     */
    removeLockHolder(holderId, resourceId) {
        // 从资源所有者中移除
        if (this.resourceOwners.has(resourceId)) {
            this.resourceOwners.get(resourceId).delete(holderId)
            if (this.resourceOwners.get(resourceId).size === 0) {
                this.resourceOwners.delete(resourceId)
            }
        }
        
        this.emit('lock:holder_removed', { holderId, resourceId })
    }
    
    /**
     * 添加等待关系
     * @param {string} holderId - 等待者ID
     * @param {string} resourceId - 等待的资源ID
     * @param {object} metadata - 元数据
     */
    addWaitRelation(holderId, resourceId, metadata = {}) {
        if (!this.waitingFor.has(holderId)) {
            this.waitingFor.set(holderId, new Set())
        }
        this.waitingFor.get(holderId).add(resourceId)
        
        // 构建等待图
        this.buildWaitGraph()
        
        this.emit('wait:relation_added', { holderId, resourceId, metadata })
    }
    
    /**
     * 移除等待关系
     * @param {string} holderId - 等待者ID
     * @param {string} resourceId - 等待的资源ID
     */
    removeWaitRelation(holderId, resourceId) {
        if (this.waitingFor.has(holderId)) {
            this.waitingFor.get(holderId).delete(resourceId)
            if (this.waitingFor.get(holderId).size === 0) {
                this.waitingFor.delete(holderId)
            }
        }
        
        // 重新构建等待图
        this.buildWaitGraph()
        
        this.emit('wait:relation_removed', { holderId, resourceId })
    }
    
   
    buildWaitGraph() {
        this.waitGraph.clear()
        
        // 遍历所有等待关系
        for (const [waiterId, waitingResources] of this.waitingFor.entries()) {
            if (!this.waitGraph.has(waiterId)) {
                this.waitGraph.set(waiterId, new Set())
            }
            
            // 对于每个等待的资源，找到其当前持有者
            for (const resourceId of waitingResources) {
                const owners = this.resourceOwners.get(resourceId)
                if (owners) {
                    for (const ownerId of owners) {
                        if (ownerId !== waiterId) {
                            this.waitGraph.get(waiterId).add(ownerId)
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 检测死锁
     * 使用深度优先搜索检测环路
     * @returns {Array} 检测到的死锁环路
     */
    detectDeadlocks() {
        const startTime = Date.now()
        this.stats.totalDetections++
        
        const cycles = []
        const visited = new Set()
        const recursionStack = new Set()
        const path = []
        
        // 对每个节点进行DFS
        for (const [holderId] of this.waitGraph) {
            if (!visited.has(holderId)) {
                const cycle = this.dfsDetectCycle(holderId, visited, recursionStack, path, new Map())
                if (cycle) {
                    cycles.push(cycle)
                }
            }
        }
        
        const detectionTime = Date.now() - startTime
        this.stats.avgDetectionTime = (this.stats.avgDetectionTime + detectionTime) / 2
        this.stats.lastDetectionTime = new Date()
        
        if (cycles.length > 0) {
            this.stats.deadlocksFound += cycles.length
            this.emit('deadlock:detected', { cycles, detectionTime })
            
            // 记录检测历史
            this.recordDetection(cycles, detectionTime)
            
            // 自动解决死锁
            if (this.config.enableAutoResolve) {
                this.resolveDeadlocks(cycles)
            }
        }
        
        return cycles
    }
    
    /**
     * 深度优先搜索检测环路
     * @param {string} node - 当前节点
     * @param {Set} visited - 已访问节点
     * @param {Set} recursionStack - 递归栈
     * @param {Array} path - 当前路径
     * @param {Map} pathMap - 路径映射
     * @returns {Array|null} 检测到的环路
     */
    dfsDetectCycle(node, visited, recursionStack, path, pathMap) {
        visited.add(node)
        recursionStack.add(node)
        path.push(node)
        pathMap.set(node, path.length - 1)
        
        const neighbors = this.waitGraph.get(node) || new Set()
        
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                const cycle = this.dfsDetectCycle(neighbor, visited, recursionStack, path, pathMap)
                if (cycle) {
                    return cycle
                }
            } else if (recursionStack.has(neighbor)) {
                // 找到环路
                const cycleStart = pathMap.get(neighbor)
                const cycle = path.slice(cycleStart)
                cycle.push(neighbor) // 闭合环路
                return this.buildCycleInfo(cycle)
            }
        }
        
        recursionStack.delete(node)
        path.pop()
        pathMap.delete(node)
        
        return null
    }
    
    /**
     * 构建环路信息
     * @param {Array} cycle - 环路节点
     * @returns {object} 环路信息
     */
    buildCycleInfo(cycle) {
        const cycleInfo = {
            id: `deadlock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nodes: cycle,
            resources: new Set(),
            detectedAt: new Date(),
            severity: this.calculateSeverity(cycle)
        }
        
        // 收集涉及的资源
        for (const holderId of cycle) {
            const waitingResources = this.waitingFor.get(holderId)
            if (waitingResources) {
                for (const resourceId of waitingResources) {
                    cycleInfo.resources.add(resourceId)
                }
            }
        }
        
        return cycleInfo
    }
    
    /**
     * 计算死锁严重程度
     * @param {Array} cycle - 环路节点
     * @returns {string} 严重程度
     */
    calculateSeverity(cycle) {
        const cycleLength = cycle.length
        
        if (cycleLength <= 2) return 'low'
        if (cycleLength <= 4) return 'medium'
        return 'high'
    }
    
    /**
     * 解决死锁
     * @param {Array} cycles - 死锁环路列表
     */
    async resolveDeadlocks(cycles) {
        for (const cycle of cycles) {
            try {
                await this.resolveSingleDeadlock(cycle)
                this.stats.deadlocksResolved++
                this.emit('deadlock:resolved', { cycle })
            } catch (error) {
                this.emit('deadlock:resolve_failed', { cycle, error: error.message })
            }
        }
    }
    
    /**
     * 解决单个死锁
     * @param {object} cycle - 死锁环路
     */
    async resolveSingleDeadlock(cycle) {
        // 根据策略选择要中断的持有者
        const victimId = this.selectVictim(cycle)
        
        if (victimId) {
            // 中断受害者的等待
            this.interruptWaiter(victimId)
            
            this.emit('deadlock:victim_selected', { 
                cycleId: cycle.id, 
                victimId, 
                strategy: this.config.resolutionStrategy 
            })
        }
    }
    
   
    selectVictim(cycle) {
        const nodes = cycle.nodes
        
        switch (this.config.resolutionStrategy) {
            case 'youngest':
                return this.selectYoungestWaiter(nodes)
            
            case 'oldest':
                return this.selectOldestWaiter(nodes)
            
            case 'priority':
                return this.selectLowestPriorityWaiter(nodes)
            
            default:
                return nodes[0]
        }
    }
    
    /**
     * 选择最新的等待者
     * 等实现
     */
    selectYoungestWaiter(nodes) {
        return false
    }
    
    /**
     * 选择最老的等待者
     * 等实现
     */
    selectOldestWaiter(nodes) {
        return false
    }
    
    /**
     * 选择优先级最低的等待者
     * 等实现
     */
    selectLowestPriorityWaiter(nodes) {
       return false
    }
    
    /**
     * 中断等待者
     * @param {string} waiterId - 等待者ID
     */
    interruptWaiter(waiterId) {
        // 移除所有等待关系
        const waitingResources = this.waitingFor.get(waiterId)
        if (waitingResources) {
            for (const resourceId of waitingResources) {
                this.removeWaitRelation(waiterId, resourceId)
            }
        }
        
        this.emit('waiter:interrupted', { waiterId })
    }
    
    /**
     * 记录检测历史
     * @param {Array} cycles - 检测到的环路
     * @param {number} detectionTime - 检测时间
     */
    recordDetection(cycles, detectionTime) {
        const record = {
            timestamp: new Date(),
            cyclesCount: cycles.length,
            cycles: cycles.map(cycle => ({
                id: cycle.id,
                nodesCount: cycle.nodes.length,
                resourcesCount: cycle.resources.size,
                severity: cycle.severity
            })),
            detectionTime
        }
        
        this.detectionHistory.push(record)
        
        // 限制历史记录大小
        if (this.detectionHistory.length > this.maxHistorySize) {
            this.detectionHistory.shift()
        }
    }
    
    /**
     * 启动死锁检测
     */
    startDetection() {
        if (this.detectionTimer) {
            clearInterval(this.detectionTimer)
        }
        
        this.detectionTimer = setInterval(() => {
            try {
                this.detectDeadlocks()
            } catch (error) {
                this.emit('detection:error', { error: error.message })
            }
        }, this.config.checkInterval)
        
        this.emit('detection:started', { interval: this.config.checkInterval })
    }
    
    /**
     * 停止死锁检测
     */
    stopDetection() {
        if (this.detectionTimer) {
            clearInterval(this.detectionTimer)
            this.detectionTimer = null
        }
        
        this.emit('detection:stopped')
    }
    
    /**
     * 获取检测器状态
     * @returns {object} 状态信息
     */
    getStatus() {
        return {
            config: { ...this.config },
            stats: { ...this.stats },
            currentState: {
                waitGraphSize: this.waitGraph.size,
                resourceOwnersCount: this.resourceOwners.size,
                waitingRelationsCount: this.waitingFor.size,
                isDetectionActive: this.detectionTimer !== null
            },
            recentHistory: this.detectionHistory.slice(-10) // 最近10次检测
        }
    }
    
    
    getWaitGraphData() {
        const nodes = []
        const edges = []
        
        // 添加节点
        for (const [holderId] of this.waitGraph) {
            nodes.push({
                id: holderId,
                type: 'holder',
                waitingFor: Array.from(this.waitingFor.get(holderId) || []),
                owning: Array.from(this.getOwnedResources(holderId))
            })
        }
        
        // 添加边
        for (const [fromId, toIds] of this.waitGraph) {
            for (const toId of toIds) {
                edges.push({
                    from: fromId,
                    to: toId,
                    type: 'waits_for'
                })
            }
        }
        
        return { nodes, edges }
    }
    
    /**
     * 获取持有者拥有的资源
     * @param {string} holderId - 持有者ID
     * @returns {Set} 拥有的资源集合
     */
    getOwnedResources(holderId) {
        const ownedResources = new Set()
        
        for (const [resourceId, owners] of this.resourceOwners) {
            if (owners.has(holderId)) {
                ownedResources.add(resourceId)
            }
        }
        
        return ownedResources
    }
    
    /**
     * 清理检测器
     */
    cleanup() {
        this.stopDetection()
        this.waitGraph.clear()
        this.resourceOwners.clear()
        this.waitingFor.clear()
        this.detectionHistory.length = 0
        
        this.emit('detector:cleaned')
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.cleanup()
        this.removeAllListeners()
        
        this.emit('detector:destroyed')
    }
}

export default DeadlockDetector