package proxy

import (
	"log"
	"os"
	"strconv"
	"sync"
	"time"
)

// CircuitBreakerState 熔断器状态
type CircuitBreakerState int

const (
	StateClosed   CircuitBreakerState = iota // 正常状态（关闭）
	StateOpen                                // 熔断状态（开放）
	StateHalfOpen                            // 半开状态（试探）
)

func (s CircuitBreakerState) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateOpen:
		return "open"
	case StateHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// CircuitBreakerConfig 熔断器配置
type CircuitBreakerConfig struct {
	Enabled          bool    // 是否启用熔断器，默认 true
	WindowSeconds    int     // 滑动窗口大小（秒），默认 60
	FailureRate      float64 // 失败率阈值（0-1），默认 0.5
	ConsecutiveFails int     // 连续失败次数阈值，默认 5
	CooldownSeconds  int     // 冷却时间（秒），默认 30
	HalfOpenMaxCalls int     // 半开状态最大试探次数，默认 3
}

// CircuitBreaker 熔断器
type CircuitBreaker struct {
	mu               sync.RWMutex
	state            CircuitBreakerState
	requests         []requestRecord // 滑动窗口记录
	consecutiveFails int             // 当前连续失败次数
	stateChangedAt   time.Time       // 状态变更时间
	halfOpenCalls    int             // 半开状态下的调用次数
	halfOpenSuccess  int             // 半开状态下的成功次数
	config           CircuitBreakerConfig
}

type requestRecord struct {
	timestamp time.Time
	failed    bool
}

// NewCircuitBreaker 创建熔断器
func NewCircuitBreaker(cfg CircuitBreakerConfig) *CircuitBreaker {
	cfg = applyCircuitBreakerDefaults(cfg)
	return &CircuitBreaker{
		state:          StateClosed,
		stateChangedAt: time.Now(),
		config:         cfg,
	}
}

func applyCircuitBreakerDefaults(cfg CircuitBreakerConfig) CircuitBreakerConfig {
	if cfg.WindowSeconds <= 0 {
		cfg.WindowSeconds = 60
	}
	if cfg.FailureRate <= 0 || cfg.FailureRate > 1 {
		cfg.FailureRate = 0.5
	}
	if cfg.ConsecutiveFails <= 0 {
		cfg.ConsecutiveFails = 5
	}
	if cfg.CooldownSeconds <= 0 {
		cfg.CooldownSeconds = 30
	}
	if cfg.HalfOpenMaxCalls <= 0 {
		cfg.HalfOpenMaxCalls = 3
	}
	return cfg
}

// 从环境变量加载 CircuitBreakerConfig
func loadCircuitBreakerConfig() CircuitBreakerConfig {
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    60,
		FailureRate:      0.5,
		ConsecutiveFails: 5,
		CooldownSeconds:  30,
		HalfOpenMaxCalls: 3,
	}

	logger := log.Default()

	cfg.Enabled = parseEnvBool("CB_ENABLED", cfg.Enabled, logger)
	cfg.WindowSeconds = parseEnvInt("CB_WINDOW_SECONDS", cfg.WindowSeconds, logger)
	cfg.ConsecutiveFails = parseEnvInt("CB_CONSECUTIVE_FAILS", cfg.ConsecutiveFails, logger)
	cfg.CooldownSeconds = parseEnvInt("CB_COOLDOWN_SECONDS", cfg.CooldownSeconds, logger)
	cfg.HalfOpenMaxCalls = parseEnvInt("CB_HALFOPEN_MAX_CALLS", cfg.HalfOpenMaxCalls, logger)

	if v := os.Getenv("CB_FAILURE_RATE"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f >= 0 && f <= 1 {
			cfg.FailureRate = f
		} else if logger != nil {
			logger.Printf("invalid CB_FAILURE_RATE=%s, fallback to %.2f", v, cfg.FailureRate)
		}
	}

	return applyCircuitBreakerDefaults(cfg)
}

// AllowRequest 判断是否允许请求通过
func (cb *CircuitBreaker) AllowRequest() bool {
	if cb == nil {
		return true
	}
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if !cb.config.Enabled {
		return true
	}

	now := time.Now()

	switch cb.state {
	case StateClosed:
		return true // 正常状态，允许所有请求
	case StateOpen:
		// 检查是否到达冷却时间
		if now.Sub(cb.stateChangedAt) >= time.Duration(cb.config.CooldownSeconds)*time.Second {
			cb.transitionLocked(StateHalfOpen, now)
			cb.halfOpenCalls = 1 // 将当前请求计为半开试探的第一次调用
			cb.halfOpenSuccess = 0
			return true
		}
		return false // 熔断中，拒绝请求
	case StateHalfOpen:
		// 半开状态，限制调用次数
		if cb.halfOpenCalls < cb.config.HalfOpenMaxCalls {
			cb.halfOpenCalls++
			return true
		}
		return false // 试探次数已满，拒绝请求
	default:
		return false
	}
}

// RecordResult 记录请求结果
func (cb *CircuitBreaker) RecordResult(success bool) {
	if cb == nil {
		return
	}
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if !cb.config.Enabled {
		return
	}

	now := time.Now()

	// 记录到滑动窗口
	cb.requests = append(cb.requests, requestRecord{
		timestamp: now,
		failed:    !success,
	})

	// 清理过期记录（超出窗口时间）
	windowStart := now.Add(-time.Duration(cb.config.WindowSeconds) * time.Second)
	trimIdx := len(cb.requests)
	for i, r := range cb.requests {
		if r.timestamp.After(windowStart) || r.timestamp.Equal(windowStart) {
			trimIdx = i
			break
		}
	}
	if trimIdx >= len(cb.requests) {
		cb.requests = nil
	} else if trimIdx > 0 {
		cb.requests = cb.requests[trimIdx:]
	}

	// 更新连续失败计数
	if !success {
		cb.consecutiveFails++
	} else {
		cb.consecutiveFails = 0
	}

	// 状态机转换
	switch cb.state {
	case StateClosed:
		// 检查是否需要熔断
		if cb.shouldOpenLocked() {
			cb.transitionLocked(StateOpen, now)
		}
	case StateHalfOpen:
		// 半开状态下，记录试探结果
		if success {
			cb.halfOpenSuccess++
		}
		// 检查是否恢复或重新熔断
		if cb.halfOpenCalls >= cb.config.HalfOpenMaxCalls {
			if cb.halfOpenSuccess >= cb.config.HalfOpenMaxCalls {
				// 全部成功，恢复正常
				cb.transitionLocked(StateClosed, now)
				cb.consecutiveFails = 0
				cb.requests = nil
			} else {
				// 仍有失败，重新熔断
				cb.transitionLocked(StateOpen, now)
			}
		}
	}
}

// shouldOpen 判断是否应该打开熔断器
func (cb *CircuitBreaker) shouldOpen() bool {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.shouldOpenLocked()
}

func (cb *CircuitBreaker) shouldOpenLocked() bool {
	// 条件1：连续失败次数达到阈值
	if cb.consecutiveFails >= cb.config.ConsecutiveFails {
		return true
	}

	// 条件2：失败率达到阈值
	if len(cb.requests) == 0 {
		return false
	}

	failCount := 0
	for _, r := range cb.requests {
		if r.failed {
			failCount++
		}
	}
	failureRate := float64(failCount) / float64(len(cb.requests))
	return failureRate >= cb.config.FailureRate
}

// GetState 获取当前状态
func (cb *CircuitBreaker) GetState() CircuitBreakerState {
	if cb == nil {
		return StateClosed
	}
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// Reset 重置熔断器
func (cb *CircuitBreaker) Reset() {
	if cb == nil {
		return
	}
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.state = StateClosed
	cb.requests = nil
	cb.consecutiveFails = 0
	cb.halfOpenCalls = 0
	cb.halfOpenSuccess = 0
	cb.stateChangedAt = time.Now()
}

func (cb *CircuitBreaker) transitionLocked(next CircuitBreakerState, now time.Time) {
	if cb.state == next {
		return
	}
	prev := cb.state
	cb.state = next
	cb.stateChangedAt = now
	log.Printf("circuit breaker state %s -> %s", prev.String(), next.String())
}
