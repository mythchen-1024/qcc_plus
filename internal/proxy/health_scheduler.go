package proxy

import (
	"context"
	"log"
	"sync"
	"sync/atomic"
	"time"
)

const defaultHealthAllInterval = 5 * time.Minute
const defaultHealthWorkers = 16
const maxHealthWorkers = 256
const defaultHealthRoundTimeout = 60 * time.Second

// healthTask 描述一次健康检查任务。
type healthTask struct {
	acc    *Account
	nodeID string
}

// HealthScheduler 定期探活所有节点（包括健康节点），避免状态盲区。
type HealthScheduler struct {
	server   *Server
	logger   *log.Logger
	stopCh   chan struct{}
	wg       sync.WaitGroup
	interval time.Duration
	stopOnce sync.Once
}

// NewHealthScheduler 创建全量健康检查调度器。
func NewHealthScheduler(server *Server, interval time.Duration, logger *log.Logger) *HealthScheduler {
	if logger == nil {
		logger = log.Default()
	}
	if interval <= 0 {
		interval = defaultHealthAllInterval
	}
	return &HealthScheduler{
		server:   server,
		logger:   logger,
		stopCh:   make(chan struct{}),
		interval: interval,
	}
}

// Start 启动定时全量健康检查。
func (h *HealthScheduler) Start() error {
	if h == nil || h.server == nil {
		return nil
	}
	if h.interval <= 0 {
		return nil
	}

	h.logger.Printf("[HealthScheduler] start full health checks every %v", h.interval)
	h.wg.Add(1)
	go h.checkLoop()
	return nil
}

// Stop 发出停止信号并等待退出，最多等待 30 秒。
func (h *HealthScheduler) Stop() {
	if h == nil {
		return
	}
	h.stopOnce.Do(func() {
		close(h.stopCh)
	})

	done := make(chan struct{})
	go func() {
		h.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(30 * time.Second):
		h.logger.Printf("[HealthScheduler] stop timeout, exiting forcefully")
	}
}

// checkLoop 以固定间隔对所有节点进行健康检查。
func (h *HealthScheduler) checkLoop() {
	defer h.wg.Done()
	defer h.recoverPanic("check loop")

	// 立即执行一次，启动后尽快获取全量状态。
	h.checkAllNodes()

	ticker := time.NewTicker(h.interval)
	defer ticker.Stop()

	for {
		select {
		case <-h.stopCh:
			return
		case <-ticker.C:
			h.checkAllNodes()
		}
	}
}

// checkAllNodes 遍历所有账号的所有节点执行健康检查。
func (h *HealthScheduler) checkAllNodes() {
	if h == nil || h.server == nil {
		return
	}

	start := time.Now()
	logger := h.logger
	logger.Printf("[HealthScheduler] checking all nodes...")

	p := h.server

	// 收集任务列表，避免长时间持有锁。
	p.mu.RLock()
	accs := make([]*Account, 0, len(p.accountByID))
	for _, acc := range p.accountByID {
		accs = append(accs, acc)
	}
	p.mu.RUnlock()

	tasks := make([]healthTask, 0, 32)
	for _, acc := range accs {
		p.mu.RLock()
		if len(acc.Nodes) == 0 {
			p.mu.RUnlock()
			continue
		}
		for id := range acc.Nodes {
			tasks = append(tasks, healthTask{acc: acc, nodeID: id})
		}
		p.mu.RUnlock()
	}

	if len(tasks) == 0 {
		logger.Printf("[HealthScheduler] skip full health check: no nodes")
		return
	}

	workers := p.getHealthWorkers()
	if workers > len(tasks) {
		workers = len(tasks)
	}
	if workers <= 0 {
		workers = defaultHealthWorkers
	}
	roundTimeout := p.getHealthRoundTimeout()
	roundCtx, cancel := context.WithTimeout(context.Background(), roundTimeout)
	defer cancel()

	taskCh := make(chan healthTask, len(tasks))
	var (
		wg      sync.WaitGroup
		success uint32
		fail    uint32
	)

	for i := 0; i < workers; i++ {
		go h.healthWorker(roundCtx, i, taskCh, &wg, &success, &fail)
	}

	for _, t := range tasks {
		if roundCtx.Err() != nil {
			break
		}
		wg.Add(1)
		taskCh <- t
	}
	close(taskCh)

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Printf("[HealthScheduler] full health check finished in %v (nodes=%d success=%d fail=%d workers=%d)", time.Since(start), len(tasks), atomic.LoadUint32(&success), atomic.LoadUint32(&fail), workers)
	case <-roundCtx.Done():
		logger.Printf("[HealthScheduler] full health check timeout after %v (elapsed=%v nodes=%d success=%d fail=%d workers=%d)", roundTimeout, time.Since(start), len(tasks), atomic.LoadUint32(&success), atomic.LoadUint32(&fail), workers)
	}
}

// healthWorker 消费任务队列并执行健康检查，支持上下文取消与 panic 恢复。
func (h *HealthScheduler) healthWorker(ctx context.Context, id int, tasks <-chan healthTask, wg *sync.WaitGroup, success, fail *uint32) {
	defer func() {
		if r := recover(); r != nil {
			h.logger.Printf("[HealthScheduler] worker %d panic: %v", id, r)
		}
	}()

	for task := range tasks {
		select {
		case <-ctx.Done():
			wg.Done()
			continue
		default:
		}

		ok, errMsg := h.server.checkNodeHealth(ctx, task.acc, task.nodeID, CheckSourceScheduled)
		if ok {
			atomic.AddUint32(success, 1)
		} else {
			atomic.AddUint32(fail, 1)
			if errMsg != "" {
				h.logger.Printf("[HealthScheduler] worker %d node %s failed: %s", id, task.nodeID, errMsg)
			}
		}
		wg.Done()
	}
}

// recoverPanic 防止调度器因 panic 退出。
func (h *HealthScheduler) recoverPanic(where string) {
	if r := recover(); r != nil {
		h.logger.Printf("[HealthScheduler] panic recovered in %s: %v", where, r)
	}
}
