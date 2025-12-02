package proxy

import (
	"context"
	"fmt"
	"log"
	"time"
)

const (
	// 默认 warmup 并发，优先保护小规格机器。
	defaultWarmupConcurrency = 1
	// 上限收紧到 2，避免一次性拉起过多 CLI 进程。
	maxWarmupConcurrency = 2
)

// WarmupConfig 预热配置
type WarmupConfig struct {
	Enabled         bool          // 是否启用预热，默认 true
	Attempts        int           // 预热尝试次数，默认 2
	Timeout         time.Duration // 单次预热超时，默认 17s（CLI 健康检查 15s + 2s 余量）
	RequiredSuccess int           // 至少成功次数，默认 1
}

// 从环境变量加载 WarmupConfig
func loadWarmupConfig() WarmupConfig {
	cfg := WarmupConfig{
		Enabled:         true,
		Attempts:        2,
		Timeout:         17 * time.Second, // CLI 健康检查 15s + 2s 余量
		RequiredSuccess: 1,
	}

	cfg.Enabled = parseEnvBool("WARMUP_ENABLED", cfg.Enabled, nil)
	cfg.Attempts = parseEnvInt("WARMUP_ATTEMPTS", cfg.Attempts, nil)
	if cfg.Attempts <= 0 {
		cfg.Attempts = 1
	}

	timeoutMS := parseEnvInt("WARMUP_TIMEOUT_MS", int(cfg.Timeout/time.Millisecond), nil)
	if timeoutMS > 0 {
		cfg.Timeout = time.Duration(timeoutMS) * time.Millisecond
	}

	cfg.RequiredSuccess = parseEnvInt("WARMUP_REQUIRED_SUCCESS", cfg.RequiredSuccess, nil)
	if cfg.RequiredSuccess <= 0 {
		cfg.RequiredSuccess = 1
	}
	if cfg.RequiredSuccess > cfg.Attempts {
		cfg.RequiredSuccess = cfg.Attempts
	}

	return cfg
}

// normalizeWarmupConcurrency 将并发度限制在 [1, maxWarmupConcurrency] 区间。
func normalizeWarmupConcurrency(n int, logger *log.Logger) int {
	if n <= 0 {
		n = defaultWarmupConcurrency
	}
	if n > maxWarmupConcurrency {
		if logger != nil {
			logger.Printf("reduce warmup concurrency from %d to %d to protect low-resource host", n, maxWarmupConcurrency)
		}
		n = maxWarmupConcurrency
	}
	if n < 1 {
		n = 1
	}
	return n
}

// warmupNode 对节点进行预热探测
// 返回 (成功次数, 错误)
func (p *Server) warmupNode(node *Node) (int, error) {
	if node == nil {
		return 0, fmt.Errorf("warmup: node is nil")
	}

	release := p.acquireWarmupSlot()
	defer release()

	cfg := p.warmupConfig
	attempts := cfg.Attempts
	if attempts <= 0 {
		attempts = 1
	}
	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = 17 * time.Second // fallback 与默认值一致
	}

	acc := p.nodeAccount[node.ID]
	if acc == nil && node.AccountID != "" {
		p.mu.RLock()
		acc = p.accountByID[node.AccountID]
		p.mu.RUnlock()
	}
	if acc == nil {
		return 0, fmt.Errorf("warmup: account not found for node %s", node.ID)
	}

	successCount := 0
	for i := 0; i < attempts; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		done := make(chan struct{})

		go func() {
			p.checkNodeHealth(acc, node.ID, "warmup")
			close(done)
		}()

		select {
		case <-done:
			p.mu.RLock()
			failed := node.Failed
			p.mu.RUnlock()
			if !failed {
				successCount++
			}
		case <-ctx.Done():
			if p.logger != nil {
				p.logger.Printf("warmup attempt %d for node %s timed out after %v", i+1, node.Name, timeout)
			}
		}
		cancel()
	}

	return successCount, nil
}

// isNodeWarmedUp 检查节点是否预热成功
func isNodeWarmedUp(successCount int, cfg WarmupConfig) bool {
	return successCount >= cfg.RequiredSuccess
}

// acquireWarmupSlot 获取一次 warmup 并发令牌，返回释放函数。
func (p *Server) acquireWarmupSlot() func() {
	sem := p.warmupSem
	if sem == nil {
		return func() {}
	}

	sem <- struct{}{}
	return func() { <-sem }
}
