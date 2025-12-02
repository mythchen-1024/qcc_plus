# 成本优先节点切换优化方案（终极版）

**创建日期**: 2025-12-01
**版本**: v2.0 - Cost-First Edition
**状态**: 待实施
**核心诉求**: 成本优先 + 丝滑体验

---

## 一、业务场景与核心诉求

### 1.1 业务模型

**节点优先级模型**：
```
weight 值越小 = 优先级越高 = 越便宜 = 可能不稳定

示例：
- node1: weight=1（最便宜，可能抖动）
- node2: weight=2（中等价格，较稳定）
- node3: weight=3（最贵，最稳定）
```

### 1.2 核心诉求（按优先级）

| 优先级 | 诉求 | 说明 |
|--------|------|------|
| P0 | **成本优先** | 优先使用 weight 最小的节点（便宜） |
| P0 | **快速降级** | 便宜节点故障时，立即切换（< 100ms） |
| P0 | **用户无感知** | 整个切换过程对用户透明 |
| P1 | **渐进回归** | 便宜节点恢复后，平滑切回去（节省成本） |

### 1.3 典型流程

```
┌─────────────────────────────────────────────────────────────┐
│ 阶段1: 正常运行（使用最便宜节点）                           │
└─────────────────────────────────────────────────────────────┘
    使用 node1 (weight=1, 最便宜) ✅
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段2: 故障快速降级（< 100ms）                              │
└─────────────────────────────────────────────────────────────┘
    node1 失败 → 立即重试 node2 (weight=2) → 用户请求成功 ✅
    后台切换默认节点到 node2
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段3: 使用降级节点（临时）                                 │
└─────────────────────────────────────────────────────────────┘
    使用 node2 (weight=2, 稍贵但稳定)
    持续健康检查 node1（10秒一次）
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段4: 渐进回归（平滑切回便宜节点）                         │
└─────────────────────────────────────────────────────────────┘
    node1 恢复 → 预热 → 灰度 10% → 30% → 50% → 100% ✅
    每阶段验证指标（成功率、延迟）
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段5: 回到初始状态（节省成本）                             │
└─────────────────────────────────────────────────────────────┘
    又使用 node1 (weight=1) ✅ 成本优化
```

---

## 二、架构设计

### 2.1 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                    请求入口                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  1. NodeSelector (节点选择器)                                │
│  - 成本优先算法：score = weight * α + healthPenalty        │
│  - 维护按 weight 排序的小根堆                               │
│  - 跳过熔断/禁用/已失败节点                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FailFast Router (快速降级路由)                           │
│  - 单请求内立即重试（不等阈值）                             │
│  - 按 weight 升序选择备用节点                               │
│  - 最多重试 2 次（3 个节点）                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CircuitBreaker (智能熔断器)                              │
│  - 根据 weight 动态调整熔断阈值                             │
│  - 便宜节点（w=1）阈值宽松（15% 失败率）                    │
│  - 贵节点（w=3）阈值严格（8% 失败率）                       │
│  - 状态机：Closed → Open → HalfOpen                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. RecoveryController (渐进回归控制器)                      │
│  - 探测恢复：连续成功 m(weight) 次                          │
│  - 灰度切换：10% → 30% → 50% → 80% → 100%                  │
│  - 每阶段验证：成功率、延迟指标                             │
│  - 失败回退：立即全量回退到稳定节点                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. HealthProbe (分级健康检查)                               │
│  - 便宜节点（w=1）：10秒检查一次（及时发现恢复）            │
│  - 中等节点（w=2）：20秒检查一次                            │
│  - 贵节点（w=3）：60秒检查一次（节省资源）                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 状态机设计

#### 2.2.1 节点熔断状态

```
      失败率 ≥ threshold(w)
      或连续失败 ≥ k(w)
    ┌──────────────────┐
    ↓                  │
┌─────────┐      ┌──────────┐      ┌───────────┐
│ Closed  │ ───→ │  Open    │ ───→ │ HalfOpen  │
│ (健康)  │      │ (熔断)   │      │ (探测)    │
└─────────┘      └──────────┘      └───────────┘
     ↑                                    │
     │         探测成功                   │
     └────────────────────────────────────┘
                m(w) 次
```

**状态说明**：
- **Closed（健康）**：正常接收流量
- **Open（熔断）**：拒绝所有请求，等待冷却
- **HalfOpen（探测）**：允许少量试探请求

#### 2.2.2 账号级流量状态

```
ActiveNode:    当前默认节点（最便宜且健康）
CandidateNode: 正在灰度回归的更便宜节点
FallbackChain: 按 weight 排序的可用列表（用于重试）
```

---

## 三、关键算法

### 3.1 成本优先节点选择算法

#### 3.1.1 评分公式

```go
score = weight * α + healthPenalty

其中：
- weight: 节点权重（越小越便宜）
- α: 权重系数（默认 1.0）
- healthPenalty: 健康惩罚分
  - 熔断状态：+∞（直接跳过）
  - 失败率高：+100 * failureRate
  - 延迟高：+10 * (p95Latency - avgP95) / avgP95
```

#### 3.1.2 核心代码

```go
// internal/proxy/node_selector.go (新增)
type NodeSelector struct {
    mu           sync.RWMutex
    nodes        []*Node              // 按 weight 排序
    alpha        float64              // 权重系数
    activeID     string               // 当前活跃节点
    candidateID  string               // 灰度候选节点
    canaryPct    int                  // 灰度流量百分比
}

// 选择最佳节点（成本优先 + 健康度）
func (ns *NodeSelector) SelectBest(exclude map[string]bool) (*Node, error) {
    ns.mu.RLock()
    defer ns.mu.RUnlock()

    var best *Node
    bestScore := math.MaxFloat64

    // 按 weight 升序遍历（优先便宜节点）
    for _, node := range ns.nodes {
        // 跳过排除的节点
        if exclude[node.ID] || node.Disabled {
            continue
        }

        // 跳过熔断的节点
        if node.CircuitBreaker != nil && !node.CircuitBreaker.Allow() {
            continue
        }

        // 计算得分
        score := ns.calculateScore(node)
        if score < bestScore {
            best = node
            bestScore = score
        }
    }

    if best == nil {
        return nil, ErrNoActiveNode
    }

    return best, nil
}

func (ns *NodeSelector) calculateScore(node *Node) float64 {
    // 基础分：weight * α
    base := float64(node.Weight) * ns.alpha

    // 健康惩罚分
    penalty := 0.0

    // 失败率惩罚（0-30% 失败率 → 0-3000 分）
    failureRate := node.Metrics.FailureRate()
    penalty += failureRate * 10000

    // 延迟惩罚（p95 延迟越高惩罚越大）
    if node.Metrics.LastPingMS > 0 {
        // 假设平均 p95 为 200ms，超过则惩罚
        avgP95 := 200.0
        if float64(node.Metrics.LastPingMS) > avgP95 {
            penalty += (float64(node.Metrics.LastPingMS) - avgP95) / avgP95 * 100
        }
    }

    return base + penalty
}

// 灰度路由（支持渐进回归）
func (ns *NodeSelector) SelectWithCanary(exclude map[string]bool) (*Node, error) {
    ns.mu.RLock()
    canaryPct := ns.canaryPct
    candidateID := ns.candidateID
    activeID := ns.activeID
    ns.mu.RUnlock()

    // 无灰度，直接返回最佳节点
    if canaryPct == 0 || candidateID == "" {
        return ns.SelectBest(exclude)
    }

    // 按百分比决定是否使用候选节点
    if rand.Intn(100) < canaryPct {
        candidate := ns.getNode(candidateID)
        if candidate != nil && !exclude[candidateID] {
            return candidate, nil
        }
    }

    // 否则使用活跃节点
    active := ns.getNode(activeID)
    if active != nil && !exclude[activeID] {
        return active, nil
    }

    // 兜底：选择最佳节点
    return ns.SelectBest(exclude)
}
```

### 3.2 快速降级重试策略

#### 3.2.1 Fail-Fast 机制

**核心思想**：首次失败立即切换，不等阈值。

```go
// internal/proxy/failfast_router.go (新增)
func (p *Server) HandleWithFailFast(w http.ResponseWriter, r *http.Request, acc *Account) {
    tried := make(map[string]bool)
    maxRetries := 2 // 最多重试 2 次（总共 3 个节点）

    for attempt := 0; attempt <= maxRetries; attempt++ {
        // 选择节点（跳过已尝试的）
        node, err := p.nodeSelector.SelectBest(tried)
        if err != nil {
            http.Error(w, "no available nodes", http.StatusServiceUnavailable)
            return
        }

        tried[node.ID] = true

        // 设置超时（首次快速，后续稍长）
        timeout := p.getRetryTimeout(attempt)
        ctx, cancel := context.WithTimeout(r.Context(), timeout)
        defer cancel()

        // 代理请求
        recorder := &responseRecorder{ResponseWriter: w, statusCode: 200}
        proxy := p.newReverseProxy(node, &usage{})
        proxy.ServeHTTP(recorder, r.WithContext(ctx))

        // 成功则返回
        if recorder.statusCode < 500 && ctx.Err() == nil {
            // 记录成功
            if node.CircuitBreaker != nil {
                node.CircuitBreaker.RecordSuccess()
            }
            return
        }

        // 失败处理
        errMsg := fmt.Sprintf("status %d", recorder.statusCode)
        if ctx.Err() != nil {
            errMsg = ctx.Err().Error()
        }

        p.logger.Printf("[failfast] node %s failed (attempt %d/%d): %s",
            node.Name, attempt+1, maxRetries+1, errMsg)

        // 记录失败，可能触发熔断
        if node.CircuitBreaker != nil {
            node.CircuitBreaker.RecordFailure()
        }

        // 首次失败立即触发降级（异步切换默认节点）
        if attempt == 0 {
            go p.handleFastDegradation(acc, node.ID, errMsg)
        }

        // 最后一次失败，返回错误
        if attempt == maxRetries {
            http.Error(w, "all retries failed", http.StatusBadGateway)
            return
        }
    }
}

func (p *Server) getRetryTimeout(attempt int) time.Duration {
    // 首次快速超时（30ms），后续逐渐增加
    timeouts := []time.Duration{30 * time.Millisecond, 80 * time.Millisecond, 100 * time.Millisecond}
    if attempt < len(timeouts) {
        return timeouts[attempt]
    }
    return 100 * time.Millisecond
}

// 快速降级（异步）
func (p *Server) handleFastDegradation(acc *Account, failedNodeID, errMsg string) {
    p.mu.Lock()
    node := p.nodeIndex[failedNodeID]
    if node != nil {
        node.Failed = true
        node.LastError = errMsg
        if acc != nil {
            acc.FailedSet[failedNodeID] = struct{}{}
        }
    }
    p.mu.Unlock()

    // 切换到下一个最佳节点
    p.selectBestAndActivate(acc, fmt.Sprintf("快速降级: %s", errMsg))
}
```

### 3.3 智能熔断策略（根据 weight 动态调整）

#### 3.3.1 动态阈值设计

**核心思想**：便宜节点容忍度高，贵节点容忍度低。

```go
// internal/proxy/circuit_breaker.go (扩展)
type WeightBasedCircuitBreaker struct {
    mu                sync.RWMutex
    state             CircuitBreakerState
    window            *SlidingWindow
    consecutiveFails  int
    openedAt          time.Time
    halfOpenProbes    int
    nodeWeight        int // 节点权重
}

// 根据 weight 计算熔断阈值
func (cb *WeightBasedCircuitBreaker) getFailureRateThreshold() float64 {
    // base=15%, delta=5%
    // w=1: 15% (宽松)
    // w=2: 10% (中等)
    // w=3: 5%  (严格)
    base := 0.15
    delta := 0.05
    return base - float64(cb.nodeWeight-1)*delta
}

func (cb *WeightBasedCircuitBreaker) getConsecutiveFailsThreshold() int {
    // w=1: 3 次
    // w=2: 2 次
    // w=3: 2 次
    if cb.nodeWeight == 1 {
        return 3
    }
    return 2
}

func (cb *WeightBasedCircuitBreaker) getMinOpenDuration() time.Duration {
    // w=1: 10s (快速恢复)
    // w=2: 20s
    // w=3: 30s
    return time.Duration(cb.nodeWeight*10) * time.Second
}

func (cb *WeightBasedCircuitBreaker) getHealThreshold() float64 {
    // 恢复阈值（成功率）
    // w=1: 90% (宽松)
    // w=2: 92%
    // w=3: 95% (严格)
    base := 0.90
    delta := 0.025
    return base + float64(cb.nodeWeight-1)*delta
}

// 判断是否应该熔断
func (cb *WeightBasedCircuitBreaker) ShouldOpen() bool {
    cb.mu.RLock()
    defer cb.mu.RUnlock()

    if cb.state != CBClosed {
        return false
    }

    // 条件1: 失败率超过阈值
    failureRate := cb.window.FailureRate()
    totalRequests := cb.window.TotalRequests()
    minRequests := 20 // 最小请求数

    if totalRequests >= minRequests && failureRate >= cb.getFailureRateThreshold() {
        return true
    }

    // 条件2: 连续失败超过阈值
    if cb.consecutiveFails >= cb.getConsecutiveFailsThreshold() {
        return true
    }

    return false
}

// 判断是否可以进入半开状态
func (cb *WeightBasedCircuitBreaker) CanHalfOpen() bool {
    cb.mu.RLock()
    defer cb.mu.RUnlock()

    if cb.state != CBOpen {
        return false
    }

    // 检查是否过了最短熔断时间
    return time.Since(cb.openedAt) >= cb.getMinOpenDuration()
}
```

#### 3.3.2 配置参数（按 weight 分级）

```go
// 熔断阈值配置
type CircuitBreakerConfig struct {
    // 失败率阈值（根据 weight 计算）
    FailureRateBase  float64 // 基础失败率，默认 0.15 (15%)
    FailureRateDelta float64 // 每级递减，默认 0.05 (5%)

    // 连续失败阈值
    ConsecutiveFailsMap map[int]int // weight -> threshold
    // 默认: {1: 3, 2: 2, 3: 2}

    // 最短熔断时间（秒）
    MinOpenDurationPerWeight int // 每级增加，默认 10秒

    // 恢复阈值（成功率）
    HealThresholdBase  float64 // 基础成功率，默认 0.90 (90%)
    HealThresholdDelta float64 // 每级递增，默认 0.025 (2.5%)
}
```

### 3.4 渐进回归策略

#### 3.4.1 灰度阶段设计

```
阶段1: 10%  流量 → 验证 20s 或 200 请求 → 成功率 ≥ 95%
阶段2: 30%  流量 → 验证 20s 或 200 请求 → 成功率 ≥ 95%
阶段3: 50%  流量 → 验证 30s 或 300 请求 → 成功率 ≥ 96%
阶段4: 80%  流量 → 验证 30s 或 300 请求 → 成功率 ≥ 96%
阶段5: 100% 流量 → 完全切换 → 持续监控
```

#### 3.4.2 核心代码

```go
// internal/proxy/recovery_controller.go (新增)
type RecoveryController struct {
    mu              sync.RWMutex
    nodeSelector    *NodeSelector
    store           store.Store
    logger          *log.Logger
    canaryStages    []int     // 灰度阶段 [10, 30, 50, 80, 100]
    stageDuration   time.Duration // 每阶段持续时间
    stageMinReqs    int       // 每阶段最少请求数
    stageSLA        float64   // 阶段成功率要求
}

func NewRecoveryController(selector *NodeSelector, store store.Store) *RecoveryController {
    return &RecoveryController{
        nodeSelector:  selector,
        store:         store,
        canaryStages:  []int{10, 30, 50, 80, 100},
        stageDuration: 20 * time.Second,
        stageMinReqs:  200,
        stageSLA:      0.95, // 95% 成功率
    }
}

// 尝试渐进回归
func (rc *RecoveryController) TryGradualRecovery(acc *Account, nodeID string) error {
    node := rc.getNode(nodeID)
    if node == nil {
        return fmt.Errorf("node not found")
    }

    // 检查是否可以进入半开状态
    if node.CircuitBreaker == nil || !node.CircuitBreaker.CanHalfOpen() {
        return fmt.Errorf("node not ready for recovery")
    }

    // 预热探测
    if !rc.prewarmNode(node) {
        rc.logger.Printf("[recovery] node %s prewarm failed", node.Name)
        return fmt.Errorf("prewarm failed")
    }

    rc.logger.Printf("[recovery] starting gradual recovery for node %s", node.Name)

    // 保存当前活跃节点（用于回退）
    rc.mu.RLock()
    previousActiveID := acc.ActiveID
    rc.mu.RUnlock()

    // 逐阶段灰度
    for i, pct := range rc.canaryStages {
        rc.logger.Printf("[recovery] stage %d/%d: %d%% traffic to node %s",
            i+1, len(rc.canaryStages), pct, node.Name)

        // 设置灰度比例
        rc.nodeSelector.SetCanary(nodeID, pct)

        // 等待验证
        startTime := time.Now()
        requestsAtStart := node.Metrics.ReqCount

        for {
            time.Sleep(1 * time.Second)

            // 检查时长
            elapsed := time.Since(startTime)
            if elapsed >= rc.stageDuration {
                break
            }

            // 检查请求数
            requestsNow := node.Metrics.ReqCount
            if requestsNow-requestsAtStart >= int64(rc.stageMinReqs) {
                break
            }
        }

        // 验证指标
        if !rc.validateStage(node, pct) {
            rc.logger.Printf("[recovery] stage %d failed, rolling back", i+1)
            rc.rollback(acc, previousActiveID, nodeID)
            return fmt.Errorf("stage %d validation failed", i+1)
        }

        rc.logger.Printf("[recovery] stage %d/%d passed", i+1, len(rc.canaryStages))
    }

    // 所有阶段通过，完全切换
    rc.promote(acc, nodeID)
    rc.logger.Printf("[recovery] node %s fully promoted", node.Name)

    return nil
}

// 验证阶段指标
func (rc *RecoveryController) validateStage(node *Node, pct int) bool {
    // 计算最近窗口的成功率
    successRate := node.Metrics.SuccessRate(60) // 最近 60 秒

    // 检查成功率
    if successRate < rc.stageSLA {
        rc.logger.Printf("[recovery] stage validation failed: success_rate=%.2f%% < %.2f%%",
            successRate*100, rc.stageSLA*100)
        return false
    }

    // 检查延迟（可选）
    // TODO: 添加 p95 延迟检查

    return true
}

// 回退到之前的节点
func (rc *RecoveryController) rollback(acc *Account, activeID, candidateID string) {
    // 取消灰度
    rc.nodeSelector.SetCanary("", 0)

    // 恢复原活跃节点
    rc.mu.Lock()
    acc.ActiveID = activeID
    rc.mu.Unlock()

    // 将候选节点重新熔断
    candidate := rc.getNode(candidateID)
    if candidate != nil && candidate.CircuitBreaker != nil {
        candidate.CircuitBreaker.Open()
    }

    rc.logger.Printf("[recovery] rolled back to node %s", activeID)
}

// 提升为正式活跃节点
func (rc *RecoveryController) promote(acc *Account, nodeID string) {
    // 取消灰度
    rc.nodeSelector.SetCanary("", 0)

    // 设置为活跃节点
    rc.mu.Lock()
    acc.ActiveID = nodeID
    rc.mu.Unlock()

    if rc.store != nil {
        _ = rc.store.SetActive(context.Background(), acc.ID, nodeID)
    }
}

// 预热节点
func (rc *RecoveryController) prewarmNode(node *Node) bool {
    attempts := 2
    successCount := 0

    for i := 0; i < attempts; i++ {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        // 使用 HEAD 请求预热
        req, _ := http.NewRequestWithContext(ctx, http.MethodHead, node.URL.String(), nil)
        client := &http.Client{Timeout: 5 * time.Second}

        resp, err := client.Do(req)
        if err == nil && resp.StatusCode == http.StatusOK {
            successCount++
            resp.Body.Close()
        }
    }

    return successCount > 0
}
```

### 3.5 分级健康检查策略

#### 3.5.1 检查频率（根据 weight）

```go
// internal/proxy/health_probe.go (新增)
type HealthProbe struct {
    mu         sync.RWMutex
    nodes      map[string]*Node
    intervals  map[int]time.Duration // weight -> interval
    logger     *log.Logger
}

func NewHealthProbe() *HealthProbe {
    return &HealthProbe{
        nodes: make(map[string]*Node),
        intervals: map[int]time.Duration{
            1: 10 * time.Second, // 便宜节点：10秒（快速发现恢复）
            2: 20 * time.Second, // 中等节点：20秒
            3: 60 * time.Second, // 贵节点：60秒（节省资源）
        },
    }
}

// 启动分级健康检查
func (hp *HealthProbe) Start() {
    // 为每个 weight 级别启动一个 goroutine
    for weight, interval := range hp.intervals {
        go hp.probeByWeight(weight, interval)
    }
}

func (hp *HealthProbe) probeByWeight(weight int, interval time.Duration) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for range ticker.C {
        hp.mu.RLock()
        nodesToProbe := hp.getNodesByWeight(weight)
        hp.mu.RUnlock()

        for _, node := range nodesToProbe {
            // 只探测失败或半开状态的节点
            if node.Failed || (node.CircuitBreaker != nil && node.CircuitBreaker.IsHalfOpen()) {
                go hp.probeNode(node)
            }
        }
    }
}

func (hp *HealthProbe) probeNode(node *Node) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 使用 HEAD 请求探测
    req, _ := http.NewRequestWithContext(ctx, http.MethodHead, node.URL.String(), nil)
    client := &http.Client{Timeout: 5 * time.Second}

    start := time.Now()
    resp, err := client.Do(req)
    latency := time.Since(start)

    success := err == nil && resp.StatusCode == http.StatusOK

    if success {
        resp.Body.Close()
        hp.logger.Printf("[probe] node %s (w=%d) healthy (latency: %dms)",
            node.Name, node.Weight, latency.Milliseconds())

        // 记录成功
        if node.CircuitBreaker != nil {
            node.CircuitBreaker.RecordSuccess()
        }
    } else {
        errMsg := "unknown error"
        if err != nil {
            errMsg = err.Error()
        }
        hp.logger.Printf("[probe] node %s (w=%d) failed: %s",
            node.Name, node.Weight, errMsg)

        // 记录失败
        if node.CircuitBreaker != nil {
            node.CircuitBreaker.RecordFailure()
        }
    }
}

func (hp *HealthProbe) getNodesByWeight(weight int) []*Node {
    var result []*Node
    for _, node := range hp.nodes {
        if node.Weight == weight {
            result = append(result, node)
        }
    }
    return result
}
```

---

## 四、配置参数设计

### 4.1 分级配置（根据 weight）

```go
// config/cost_first_config.go (新增)
type CostFirstConfig struct {
    // 节点选择
    Alpha float64 // 权重系数，默认 1.0

    // 熔断阈值（根据 weight 计算）
    FailureRateThresholds map[int]float64 // weight -> threshold
    // 默认: {1: 0.15, 2: 0.10, 3: 0.08}

    ConsecutiveFailsThresholds map[int]int
    // 默认: {1: 3, 2: 2, 3: 2}

    MinOpenDurations map[int]time.Duration
    // 默认: {1: 10s, 2: 20s, 3: 30s}

    HealThresholds map[int]float64
    // 默认: {1: 0.90, 2: 0.92, 3: 0.95}

    // 健康检查频率
    ProbeIntervals map[int]time.Duration
    // 默认: {1: 10s, 2: 20s, 3: 60s}

    // 渐进回归
    CanaryStages    []int         // 默认: [10, 30, 50, 80, 100]
    StageDuration   time.Duration // 默认: 20s
    StageMinReqs    int           // 默认: 200
    StageSLA        float64       // 默认: 0.95 (95%)

    // 快速重试
    MaxRetries      int           // 默认: 2
    RetryTimeouts   []time.Duration
    // 默认: [30ms, 80ms, 100ms]
}

// 默认配置
func DefaultCostFirstConfig() *CostFirstConfig {
    return &CostFirstConfig{
        Alpha: 1.0,

        FailureRateThresholds: map[int]float64{
            1: 0.15, // 便宜节点容忍 15%
            2: 0.10, // 中等节点容忍 10%
            3: 0.08, // 贵节点容忍 8%
        },

        ConsecutiveFailsThresholds: map[int]int{
            1: 3, // 便宜节点连续失败 3 次
            2: 2,
            3: 2,
        },

        MinOpenDurations: map[int]time.Duration{
            1: 10 * time.Second, // 便宜节点快速恢复
            2: 20 * time.Second,
            3: 30 * time.Second,
        },

        HealThresholds: map[int]float64{
            1: 0.90, // 便宜节点 90% 成功率即可恢复
            2: 0.92,
            3: 0.95, // 贵节点需要 95%
        },

        ProbeIntervals: map[int]time.Duration{
            1: 10 * time.Second, // 便宜节点频繁检查
            2: 20 * time.Second,
            3: 60 * time.Second,
        },

        CanaryStages:  []int{10, 30, 50, 80, 100},
        StageDuration: 20 * time.Second,
        StageMinReqs:  200,
        StageSLA:      0.95,

        MaxRetries: 2,
        RetryTimeouts: []time.Duration{
            30 * time.Millisecond,
            80 * time.Millisecond,
            100 * time.Millisecond,
        },
    }
}
```

### 4.2 环境变量配置

```bash
# 节点选择
COST_FIRST_ALPHA=1.0

# 熔断阈值（便宜节点）
CB_FAILURE_RATE_W1=0.15
CB_CONSECUTIVE_FAILS_W1=3
CB_MIN_OPEN_DURATION_W1=10
CB_HEAL_THRESHOLD_W1=0.90

# 熔断阈值（中等节点）
CB_FAILURE_RATE_W2=0.10
CB_CONSECUTIVE_FAILS_W2=2
CB_MIN_OPEN_DURATION_W2=20
CB_HEAL_THRESHOLD_W2=0.92

# 熔断阈值（贵节点）
CB_FAILURE_RATE_W3=0.08
CB_CONSECUTIVE_FAILS_W3=2
CB_MIN_OPEN_DURATION_W3=30
CB_HEAL_THRESHOLD_W3=0.95

# 健康检查频率
PROBE_INTERVAL_W1=10
PROBE_INTERVAL_W2=20
PROBE_INTERVAL_W3=60

# 渐进回归
CANARY_STAGES=10,30,50,80,100
CANARY_STAGE_DURATION=20
CANARY_STAGE_MIN_REQS=200
CANARY_STAGE_SLA=0.95

# 快速重试
FAILFAST_MAX_RETRIES=2
FAILFAST_RETRY_TIMEOUTS=30,80,100
```

---

## 五、监控指标

### 5.1 成本相关指标

| 指标 | 说明 | 目标 |
|------|------|------|
| `node_request_ratio{weight}` | 各 weight 节点的请求占比 | weight=1 > 80% |
| `estimated_cost_per_hour` | 估算每小时成本 | - |
| `cost_savings_pct` | 成本节省百分比（vs 全用 w=3） | > 50% |
| `degradation_time_pct` | 降级时间占比 | < 5% |

### 5.2 稳定性指标

| 指标 | 说明 | 目标 |
|------|------|------|
| `circuit_breaker_opens{weight}` | 各 weight 节点熔断次数 | - |
| `fast_degradation_count` | 快速降级触发次数 | - |
| `recovery_attempts{weight}` | 各 weight 节点回归尝试次数 | - |
| `recovery_success_rate{weight}` | 回归成功率 | > 90% |
| `rollback_count` | 回归回退次数 | < 10/天 |

### 5.3 用户体验指标

| 指标 | 说明 | 目标 |
|------|------|------|
| `request_success_rate` | 整体请求成功率 | > 99.5% |
| `request_latency_p95` | P95 延迟 | < 500ms |
| `request_latency_p99` | P99 延迟 | < 1s |
| `retry_count_per_request` | 平均每请求重试次数 | < 0.1 |
| `user_visible_errors` | 用户可见错误数 | < 1% |

### 5.4 实时状态指标

| 指标 | 说明 |
|------|------|
| `active_node{weight}` | 当前活跃节点及其 weight |
| `canary_node{weight, pct}` | 灰度节点及流量百分比 |
| `node_state{node, state}` | 各节点状态（Closed/Open/HalfOpen） |
| `fallback_chain_length` | 可用备用节点数量 |

---

## 六、边界情况处理

### 6.1 所有节点都故障

```go
// 处理逻辑
if len(availableNodes) == 0 {
    // 1. 立即告警
    alertManager.Critical("All nodes failed")

    // 2. 尝试半开探测（指数退避）
    for _, node := range allNodes {
        if node.CircuitBreaker.CanHalfOpen() {
            go tryProbe(node)
        }
    }

    // 3. 返回明确错误
    return errors.New("no available nodes, please try again later")
}
```

### 6.2 回归过程中再次故障

```go
// 在 validateStage 中检测
if !rc.validateStage(node, pct) {
    // 1. 立即回退
    rc.rollback(acc, previousActiveID, candidateID)

    // 2. 重新熔断候选节点
    node.CircuitBreaker.Open()

    // 3. 记录事件
    logger.Printf("[recovery] node %s failed during stage %d, rolled back", node.Name, stage)

    return fmt.Errorf("stage validation failed")
}
```

### 6.3 优先节点长期不稳定

```go
// 动态调整策略
type NodeStabilityTracker struct {
    failureHistory map[string][]time.Time // 最近 24 小时的失败记录
}

func (nst *NodeStabilityTracker) ShouldAdjustWeight(node *Node) bool {
    failures := nst.failureHistory[node.ID]

    // 统计最近 24 小时失败次数
    cutoff := time.Now().Add(-24 * time.Hour)
    recentFailures := 0
    for _, t := range failures {
        if t.After(cutoff) {
            recentFailures++
        }
    }

    // 如果 24 小时内失败超过 10 次，建议调整
    return recentFailures > 10
}

// 自动调整（可选）
if nst.ShouldAdjustWeight(node) {
    // 方案1: 临时提高 alpha（降低 weight 影响）
    alpha = 1.5

    // 方案2: 临时标记为 "degraded"，从候选中移除一段时间
    node.Degraded = true
    node.DegradedUntil = time.Now().Add(1 * time.Hour)

    // 方案3: 告警，人工介入
    alertManager.Warning(fmt.Sprintf("Node %s unstable, consider adjusting weight", node.Name))
}
```

---

## 七、实施计划

### 阶段1：核心功能（2 周）

**Week 1**:
- [ ] 实现 `NodeSelector`（成本优先算法）
- [ ] 实现 `FailFastRouter`（快速降级重试）
- [ ] 实现 `WeightBasedCircuitBreaker`（智能熔断）
- [ ] 单元测试（算法验证）

**Week 2**:
- [ ] 实现 `RecoveryController`（渐进回归）
- [ ] 实现 `HealthProbe`（分级健康检查）
- [ ] 集成到现有代码（`handler.go`、`node_manager.go`）
- [ ] 端到端测试

### 阶段2：优化与监控（1 周）

**Week 3**:
- [ ] 添加监控指标（Prometheus）
- [ ] 添加结构化日志
- [ ] 性能优化（并发、锁优化）
- [ ] 文档完善

### 阶段3：压测与调优（1 周）

**Week 4**:
- [ ] 压力测试（1000 RPS）
- [ ] 故障演练（主节点故障、恢复）
- [ ] 参数调优（阈值、间隔）
- [ ] 上线准备

---

## 八、预期效果

### 8.1 成本优化

| 场景 | 当前 | 优化后 | 节省 |
|------|------|--------|------|
| 正常运行 | 主用 w=1 (100%) | 主用 w=1 (95%+) | 0% |
| 故障期间 | 切到 w=2/3 (100%) | 立即重试 + 后台切换 | 用户无感知 |
| 长期统计 | w=1 占 70% | w=1 占 **90%+** | **+20% 成本节省** |

### 8.2 用户体验

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 请求成功率 | ~95% | **> 99.5%** | +4.5% |
| 故障感知度 | 100% | **< 1%** | 减少 99% |
| P99 延迟 | ~2s | **< 500ms** | 4 倍 |
| 切换时间 | 3-5s | **< 100ms** | 50 倍 |

### 8.3 系统稳定性

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 降级速度 | 3-5 秒 | **< 100ms** | 50 倍 |
| 回归成功率 | 未知 | **> 90%** | - |
| 抖动频率 | 高 | **低**（熔断保护） | - |

---

## 九、总结

### 9.1 核心创新点

1. **成本优先算法**：`score = weight * α + healthPenalty`，平衡成本与健康
2. **快速降级机制**：首次失败立即重试，不等阈值
3. **智能熔断策略**：根据 weight 动态调整容忍度
4. **渐进回归策略**：5 阶段灰度，每阶段验证指标
5. **分级健康检查**：便宜节点频繁检查，贵节点节省资源

### 9.2 关键收益

- **成本节省 20%+**：通过优先使用便宜节点
- **用户体验提升 99%**：故障切换透明化
- **系统稳定性提升 50 倍**：快速降级与智能熔断
- **运维成本降低**：自动化故障恢复与回归

### 9.3 向后兼容

- ✅ 可渐进式启用（默认关闭高级特性）
- ✅ 不影响现有 API 和数据库
- ✅ 通过环境变量灵活配置

---

**文档版本**: v2.0
**创建时间**: 2025-12-01
**维护者**: Claude Code Team + Codex
**适用场景**: 成本敏感型多节点代理系统
