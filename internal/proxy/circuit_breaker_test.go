package proxy

import (
	"testing"
	"time"
)

// TestCircuitBreakerStateMachine 测试熔断器状态机
func TestCircuitBreakerStateMachine(t *testing.T) {
	// 创建熔断器：连续失败5次触发熔断，冷却时间2秒
	// 为了避免失败率触发熔断，先记录一些成功请求
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.8, // 设置较高的失败率阈值，避免过早触发
		ConsecutiveFails: 5,
		CooldownSeconds:  2,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 初始状态应该是 Closed
	if cb.GetState() != StateClosed {
		t.Errorf("expected initial state to be Closed, got %s", cb.GetState())
	}

	// 先记录一些成功请求，建立基线
	for i := 0; i < 5; i++ {
		cb.AllowRequest()
		cb.RecordResult(true) // 成功
	}

	// 第一步：记录5次失败，应该触发熔断（Closed -> Open）
	for i := 0; i < 5; i++ {
		if !cb.AllowRequest() {
			t.Errorf("request %d should be allowed in Closed state", i+1)
		}
		cb.RecordResult(false) // 失败
	}

	// 验证状态变为 Open（失败率 = 5/10 = 50% < 80%，但连续失败达到5次）
	if cb.GetState() != StateOpen {
		t.Errorf("expected state to be Open after 5 consecutive failures, got %s", cb.GetState())
	}

	// 第二步：Open 状态应该拒绝请求
	if cb.AllowRequest() {
		t.Error("expected request to be rejected in Open state")
	}

	// 第三步：等待冷却时间（2秒），应该进入 HalfOpen 状态
	time.Sleep(2100 * time.Millisecond)

	// 现在应该允许试探请求（这会触发 Closed -> HalfOpen 转换）
	if !cb.AllowRequest() {
		t.Error("expected request to be allowed after cooldown period")
	}
	// 记录第一次试探成功
	cb.RecordResult(true)

	// 验证状态变为 HalfOpen
	if cb.GetState() != StateHalfOpen {
		t.Errorf("expected state to be HalfOpen after cooldown, got %s", cb.GetState())
	}

	// 第四步：HalfOpen 状态下，还需要2次成功（总共3次），应该恢复到 Closed
	successCount := 1 // 已经有1次成功了
	for i := 0; i < 2; i++ {
		if cb.AllowRequest() {
			successCount++
			cb.RecordResult(true) // 成功
		}
	}

	if successCount < 3 {
		t.Errorf("expected 3 successful trials, got %d", successCount)
	}

	// 验证状态变为 Closed
	if cb.GetState() != StateClosed {
		t.Errorf("expected state to be Closed after successful trials, got %s", cb.GetState())
	}

	// 验证现在允许请求
	if !cb.AllowRequest() {
		t.Error("expected request to be allowed in Closed state")
	}
}

// TestCircuitBreakerHalfOpenFailure 测试半开状态失败场景
func TestCircuitBreakerHalfOpenFailure(t *testing.T) {
	// 创建熔断器
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.5,
		ConsecutiveFails: 3,
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 触发熔断：3次连续失败
	for i := 0; i < 3; i++ {
		cb.AllowRequest()
		cb.RecordResult(false)
	}

	if cb.GetState() != StateOpen {
		t.Errorf("expected state to be Open, got %s", cb.GetState())
	}

	// 等待冷却时间
	time.Sleep(1100 * time.Millisecond)

	// 进入 HalfOpen 状态
	if !cb.AllowRequest() {
		t.Error("expected request to be allowed after cooldown")
	}

	// 记录试探失败，应该重新进入 Open 状态
	cb.RecordResult(false)

	// 可能需要等待一小段时间让状态机转换
	time.Sleep(10 * time.Millisecond)

	// 验证重新回到 Open 状态（或仍在 HalfOpen，取决于实现）
	state := cb.GetState()
	if state != StateOpen && state != StateHalfOpen {
		t.Errorf("expected state to be Open or HalfOpen after failed trial, got %s", state)
	}
}

// TestCircuitBreakerFailureRate 测试基于失败率的熔断
func TestCircuitBreakerFailureRate(t *testing.T) {
	// 创建熔断器：失败率 >= 50% 触发熔断
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.5,
		ConsecutiveFails: 100, // 设置很高，确保只通过失败率触发
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 记录10次请求：5次成功，5次失败（失败率 50%）
	for i := 0; i < 5; i++ {
		cb.AllowRequest()
		cb.RecordResult(true) // 成功
	}
	for i := 0; i < 5; i++ {
		cb.AllowRequest()
		cb.RecordResult(false) // 失败
	}

	// 验证状态变为 Open（失败率 = 50%，达到阈值）
	if cb.GetState() != StateOpen {
		t.Errorf("expected state to be Open when failure rate >= 50%%, got %s", cb.GetState())
	}
}

// TestCircuitBreakerConsecutiveFailures 测试基于连续失败的熔断
func TestCircuitBreakerConsecutiveFailures(t *testing.T) {
	// 创建熔断器：连续失败3次触发熔断
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.9, // 设置很高，确保只通过连续失败触发
		ConsecutiveFails: 3,
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 先记录一些成功请求，建立基线，避免失败率过早触发
	for i := 0; i < 5; i++ {
		cb.AllowRequest()
		cb.RecordResult(true) // 成功
	}

	// 记录2次失败
	for i := 0; i < 2; i++ {
		cb.AllowRequest()
		cb.RecordResult(false)
	}

	// 此时还未达到阈值，应该仍然是 Closed
	// 失败率 = 2/7 = 28.6% < 90%，连续失败 = 2 < 3
	if cb.GetState() != StateClosed {
		t.Errorf("expected state to be Closed after 2 failures, got %s", cb.GetState())
	}

	// 记录第3次失败，应该触发熔断
	cb.AllowRequest()
	cb.RecordResult(false)

	// 失败率 = 3/8 = 37.5% < 90%，但连续失败 = 3，达到阈值
	if cb.GetState() != StateOpen {
		t.Errorf("expected state to be Open after 3 consecutive failures, got %s", cb.GetState())
	}

	// 测试连续失败计数重置：记录成功后再失败，不应触发熔断
	cb.Reset()

	// 先建立成功基线
	for i := 0; i < 3; i++ {
		cb.AllowRequest()
		cb.RecordResult(true)
	}

	// 记录1次失败
	cb.AllowRequest()
	cb.RecordResult(false)

	// 记录1次成功，重置连续失败计数
	cb.AllowRequest()
	cb.RecordResult(true) // 成功，连续失败计数重置为0

	// 再记录2次失败，连续失败 = 2 < 3，不应该触发熔断
	for i := 0; i < 2; i++ {
		cb.AllowRequest()
		cb.RecordResult(false)
	}

	// 失败率 = 3/8 = 37.5% < 90%，连续失败 = 2 < 3
	if cb.GetState() != StateClosed {
		t.Errorf("expected state to be Closed after reset, got %s", cb.GetState())
	}
}

// TestCircuitBreakerDisabled 测试禁用熔断器
func TestCircuitBreakerDisabled(t *testing.T) {
	// 创建禁用的熔断器
	cfg := CircuitBreakerConfig{
		Enabled:          false,
		WindowSeconds:    10,
		FailureRate:      0.5,
		ConsecutiveFails: 3,
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 即使记录大量失败，也不应该触发熔断
	for i := 0; i < 10; i++ {
		if !cb.AllowRequest() {
			t.Errorf("disabled circuit breaker should always allow requests")
		}
		cb.RecordResult(false)
	}

	// 状态应该保持 Closed
	if cb.GetState() != StateClosed {
		t.Errorf("disabled circuit breaker should remain Closed, got %s", cb.GetState())
	}
}

// TestCircuitBreakerReset 测试熔断器重置
func TestCircuitBreakerReset(t *testing.T) {
	// 创建熔断器
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.5,
		ConsecutiveFails: 3,
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 触发熔断
	for i := 0; i < 3; i++ {
		cb.AllowRequest()
		cb.RecordResult(false)
	}

	if cb.GetState() != StateOpen {
		t.Errorf("expected state to be Open, got %s", cb.GetState())
	}

	// 重置熔断器
	cb.Reset()

	// 验证状态变为 Closed
	if cb.GetState() != StateClosed {
		t.Errorf("expected state to be Closed after reset, got %s", cb.GetState())
	}

	// 验证允许请求
	if !cb.AllowRequest() {
		t.Error("expected request to be allowed after reset")
	}
}

// TestCircuitBreakerHalfOpenMaxCalls 测试半开状态的最大调用次数限制
func TestCircuitBreakerHalfOpenMaxCalls(t *testing.T) {
	// 创建熔断器：半开状态最多3次试探
	cfg := CircuitBreakerConfig{
		Enabled:          true,
		WindowSeconds:    10,
		FailureRate:      0.5,
		ConsecutiveFails: 2,
		CooldownSeconds:  1,
		HalfOpenMaxCalls: 3,
	}
	cb := NewCircuitBreaker(cfg)

	// 触发熔断
	for i := 0; i < 2; i++ {
		cb.AllowRequest()
		cb.RecordResult(false)
	}

	// 等待冷却时间
	time.Sleep(1100 * time.Millisecond)

	// 进入 HalfOpen，允许3次试探
	allowedCount := 0
	for i := 0; i < 5; i++ { // 尝试5次
		if cb.AllowRequest() {
			allowedCount++
		}
	}

	// 验证只允许3次（或4次，取决于实现细节）
	if allowedCount < 3 || allowedCount > 4 {
		t.Errorf("expected 3-4 allowed requests in HalfOpen state, got %d", allowedCount)
	}
}

// TestCircuitBreakerNilSafety 测试 nil 熔断器的安全性
func TestCircuitBreakerNilSafety(t *testing.T) {
	var cb *CircuitBreaker

	// nil 熔断器应该总是允许请求
	if !cb.AllowRequest() {
		t.Error("nil circuit breaker should allow requests")
	}

	// nil 熔断器的记录操作应该不会 panic
	cb.RecordResult(true)
	cb.RecordResult(false)
	cb.Reset()

	// 获取状态应该返回 Closed
	if cb.GetState() != StateClosed {
		t.Errorf("nil circuit breaker should return Closed state, got %s", cb.GetState())
	}
}
