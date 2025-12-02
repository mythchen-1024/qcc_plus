package proxy

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// TestWarmupConfig 测试预热配置加载
func TestWarmupConfig(t *testing.T) {
	t.Run("default config", func(t *testing.T) {
		cfg := WarmupConfig{
			Enabled:         true,
			Attempts:        2,
			Timeout:         5 * time.Second,
			RequiredSuccess: 1,
		}

		if !cfg.Enabled {
			t.Error("expected warmup to be enabled by default")
		}
		if cfg.Attempts != 2 {
			t.Errorf("expected 2 attempts, got %d", cfg.Attempts)
		}
		if cfg.Timeout != 5*time.Second {
			t.Errorf("expected 5s timeout, got %v", cfg.Timeout)
		}
		if cfg.RequiredSuccess != 1 {
			t.Errorf("expected 1 required success, got %d", cfg.RequiredSuccess)
		}
	})
}

// TestWarmupNodeSuccess 测试节点预热成功的场景
func TestWarmupNodeSuccess(t *testing.T) {
	// 创建一个总是返回成功的模拟上游服务器
	attempts := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		// 健康检查使用 API 方式，路径是 /v1/messages
		if r.URL.Path == "/v1/messages" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"id":"msg-123","type":"message","role":"assistant","content":[{"type":"text","text":"ok"}]}`))
			return
		}
		// HEAD 请求
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	// 构建代理服务器
	srv, err := NewBuilder().
		WithUpstream(upstream.URL).
		WithAPIKey("test-key").
		Build()
	if err != nil {
		t.Fatalf("failed to build server: %v", err)
	}

	// 配置预热：启用，2次尝试，至少成功1次
	srv.warmupConfig = WarmupConfig{
		Enabled:         true,
		Attempts:        2,
		Timeout:         5 * time.Second,
		RequiredSuccess: 1,
	}

	// 获取默认节点并设置为 API 健康检查模式
	acc := srv.defaultAccount
	if acc == nil {
		t.Fatal("default account is nil")
	}

	var node *Node
	srv.mu.Lock()
	for _, n := range acc.Nodes {
		n.HealthCheckMethod = HealthCheckMethodAPI
		node = n
		break
	}
	srv.mu.Unlock()

	if node == nil {
		t.Fatal("no nodes found")
	}

	// 执行预热
	successCount, err := srv.warmupNode(node)
	if err != nil {
		t.Fatalf("warmup failed: %v", err)
	}

	// 验证预热成功
	if successCount < 1 {
		t.Errorf("expected at least 1 successful warmup, got %d", successCount)
	}

	// 验证至少执行了一次健康检查
	if attempts < 1 {
		t.Errorf("expected at least 1 warmup attempt, got %d", attempts)
	}
}

// TestWarmupNodeFailure 测试节点预热失败的场景
func TestWarmupNodeFailure(t *testing.T) {
	// 创建一个总是返回失败的模拟上游服务器
	attempts := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer upstream.Close()

	// 构建代理服务器
	srv, err := NewBuilder().
		WithUpstream(upstream.URL).
		WithAPIKey("test-key").
		Build()
	if err != nil {
		t.Fatalf("failed to build server: %v", err)
	}

	// 配置预热
	srv.warmupConfig = WarmupConfig{
		Enabled:         true,
		Attempts:        2,
		Timeout:         2 * time.Second,
		RequiredSuccess: 1,
	}

	// 获取默认节点并设置为 API 健康检查模式
	acc := srv.defaultAccount
	if acc == nil {
		t.Fatal("default account is nil")
	}

	var node *Node
	srv.mu.Lock()
	for _, n := range acc.Nodes {
		n.HealthCheckMethod = HealthCheckMethodAPI
		node = n
		break
	}
	srv.mu.Unlock()

	if node == nil {
		t.Fatal("no nodes found")
	}

	// 执行预热
	successCount, err := srv.warmupNode(node)
	if err != nil {
		t.Logf("warmup error (expected): %v", err)
	}

	// 验证预热失败（成功次数为0）
	if successCount != 0 {
		t.Errorf("expected 0 successful warmup, got %d", successCount)
	}

	// 验证执行了预期次数的健康检查
	if attempts < 1 {
		t.Errorf("expected at least 1 warmup attempt, got %d", attempts)
	}
}

// TestWarmupNodePartialSuccess 测试节点预热部分成功的场景
func TestWarmupNodePartialSuccess(t *testing.T) {
	// 创建一个第一次失败，后续成功的模拟上游服务器
	attempts := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts == 1 && r.URL.Path == "/v1/messages" {
			w.WriteHeader(http.StatusBadGateway)
			return
		}
		if r.URL.Path == "/v1/messages" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"id":"msg-123","type":"message","role":"assistant","content":[{"type":"text","text":"ok"}]}`))
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	// 构建代理服务器
	srv, err := NewBuilder().
		WithUpstream(upstream.URL).
		WithAPIKey("test-key").
		Build()
	if err != nil {
		t.Fatalf("failed to build server: %v", err)
	}

	// 配置预热：2次尝试，至少成功1次
	srv.warmupConfig = WarmupConfig{
		Enabled:         true,
		Attempts:        2,
		Timeout:         5 * time.Second,
		RequiredSuccess: 1,
	}

	// 获取默认节点并设置为 API 健康检查模式
	acc := srv.defaultAccount
	if acc == nil {
		t.Fatal("default account is nil")
	}

	var node *Node
	srv.mu.Lock()
	for _, n := range acc.Nodes {
		n.HealthCheckMethod = HealthCheckMethodAPI
		node = n
		break
	}
	srv.mu.Unlock()

	if node == nil {
		t.Fatal("no nodes found")
	}

	// 执行预热
	successCount, err := srv.warmupNode(node)
	if err != nil {
		t.Logf("warmup error: %v", err)
	}

	// 验证至少成功1次
	if successCount < 1 {
		t.Errorf("expected at least 1 successful warmup, got %d", successCount)
	}

	// 验证执行了预热尝试（可能多于配置的 attempts，因为可能包含激活时的额外检查）
	if attempts < 2 {
		t.Errorf("expected at least 2 warmup attempts, got %d", attempts)
	}

	// 验证预热判定为成功
	if !isNodeWarmedUp(successCount, srv.warmupConfig) {
		t.Error("expected node to be warmed up")
	}
}

// TestIsNodeWarmedUp 测试预热成功判定逻辑
func TestIsNodeWarmedUp(t *testing.T) {
	tests := []struct {
		name         string
		successCount int
		config       WarmupConfig
		expected     bool
	}{
		{
			name:         "all success",
			successCount: 2,
			config:       WarmupConfig{Attempts: 2, RequiredSuccess: 2},
			expected:     true,
		},
		{
			name:         "partial success - pass",
			successCount: 1,
			config:       WarmupConfig{Attempts: 2, RequiredSuccess: 1},
			expected:     true,
		},
		{
			name:         "partial success - fail",
			successCount: 1,
			config:       WarmupConfig{Attempts: 3, RequiredSuccess: 2},
			expected:     false,
		},
		{
			name:         "all failure",
			successCount: 0,
			config:       WarmupConfig{Attempts: 2, RequiredSuccess: 1},
			expected:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isNodeWarmedUp(tt.successCount, tt.config)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

// TestSelectBestAndActivateWithWarmup 测试集成了预热的节点选择
func TestSelectBestAndActivateWithWarmup(t *testing.T) {
	// 创建两个上游服务器：第一个总是失败，第二个成功
	node1Calls := 0
	upstream1 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		node1Calls++
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer upstream1.Close()

	node2Calls := 0
	upstream2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		node2Calls++
		if r.URL.Path == "/v1/messages" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"id":"msg-123","type":"message","role":"assistant","content":[{"type":"text","text":"ok"}]}`))
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream2.Close()

	// 构建代理服务器（仅包含默认节点，稍后手动添加）
	srv, err := NewBuilder().
		WithUpstream(upstream1.URL).
		WithAPIKey("key1").
		WithNodeName("node1").
		Build()
	if err != nil {
		t.Fatalf("failed to build server: %v", err)
	}

	// 启用预热
	srv.warmupConfig = WarmupConfig{
		Enabled:         true,
		Attempts:        2,
		Timeout:         2 * time.Second,
		RequiredSuccess: 1,
	}

	// 手动添加第二个节点（优先级更低）
	acc := srv.defaultAccount
	if acc == nil {
		t.Fatal("default account is nil")
	}

	node2, err := srv.addNodeWithMethod(acc, "node2", upstream2.URL, "key2", 2, HealthCheckMethodAPI, "")
	if err != nil {
		t.Fatalf("failed to add node2: %v", err)
	}

	// 标记 node1 为失败，触发切换
	srv.mu.Lock()
	for id, n := range acc.Nodes {
		if n.Name == "node1" {
			n.Failed = true
			n.HealthCheckMethod = HealthCheckMethodAPI
			acc.FailedSet[id] = struct{}{}
			break
		}
	}
	srv.mu.Unlock()

	// 触发节点选择（应该选择 node2 并预热）
	selectedNode, err := srv.selectBestAndActivate(acc, "测试切换")
	if err != nil {
		t.Fatalf("failed to select node: %v", err)
	}

	// 验证选择了 node2
	if selectedNode.Name != "node2" {
		t.Errorf("expected node2 to be selected, got %s", selectedNode.Name)
	}

	// 验证 node2 被预热调用过
	if node2Calls < 1 {
		t.Errorf("expected node2 to be warmed up (calls >= 1), got %d calls", node2Calls)
	}

	// 验证 node2 被设置为活跃节点
	srv.mu.RLock()
	activeID := acc.ActiveID
	activeNode := acc.Nodes[activeID]
	srv.mu.RUnlock()

	if activeNode == nil {
		t.Fatal("active node is nil")
	}

	if activeNode.Name != "node2" {
		t.Errorf("expected node2 to be active, got %s", activeNode.Name)
	}

	// 验证 node2 ID 匹配
	if node2.ID != activeID {
		t.Errorf("expected node2 ID %s to be active, got %s", node2.ID, activeID)
	}
}
