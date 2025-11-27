package proxy

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"qcc_plus/internal/store"
	"qcc_plus/internal/timeutil"
)

// handleNodeAPIRoutes 分发 /api/nodes/* 路由。
func (p *Server) handleNodeAPIRoutes(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	switch {
	case strings.HasSuffix(path, "/metrics"):
		p.handleGetNodeMetrics(w, r)
	case strings.HasSuffix(path, "/health-history"):
		p.handleGetHealthHistory(w, r)
	default:
		http.NotFound(w, r)
	}
}

// GET /api/nodes/:node_id/health-history
// 查询参数：
// - from: RFC3339（默认 24 小时前）
// - to: RFC3339（默认当前时间）
// - limit: 默认 300
// - offset: 默认 0
// - share_token: 分享 token（可选，用于未登录访问）
func (p *Server) handleGetHealthHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if p.store == nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "store not enabled"})
		return
	}

	nodeID, ok := extractNodeIDFromHealthHistoryPath(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	node := p.getNode(nodeID)
	if node == nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "node not found"})
		return
	}

	// 检查认证：优先使用 session，否则检查 share_token
	caller := accountFromCtx(r)
	if caller == nil {
		// 尝试通过 share_token 认证
		shareToken := r.URL.Query().Get("share_token")
		if shareToken == "" {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}
		share, err := p.store.GetMonitorShareByToken(r.Context(), shareToken)
		if err != nil || share == nil {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid share token"})
			return
		}
		// 验证节点属于分享的账号
		if node.AccountID != share.AccountID {
			respondJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
			return
		}
	} else {
		// 已登录用户：检查权限
		if !isAdmin(r.Context()) && node.AccountID != caller.ID {
			respondJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
			return
		}
	}

	to, err := parseTime(r.URL.Query().Get("to"))
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid to time"})
		return
	}
	from, err := parseTime(r.URL.Query().Get("from"))
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid from time"})
		return
	}
	if to.IsZero() {
		to = time.Now().UTC()
	}
	if from.IsZero() {
		from = to.Add(-24 * time.Hour)
	}
	if from.After(to) {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "from must be before to"})
		return
	}

	limit := 300
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > 2000 {
		limit = 2000
	}
	offset := 0
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}
	source := strings.TrimSpace(r.URL.Query().Get("source"))

	params := store.QueryHealthCheckParams{
		AccountID:   node.AccountID,
		NodeID:      nodeID,
		From:        from,
		To:          to,
		Limit:       limit,
		Offset:      offset,
		CheckSource: source,
	}

	records, err := p.store.QueryHealthChecks(r.Context(), params)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	total, err := p.store.CountHealthChecks(r.Context(), params)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	checks := make([]map[string]interface{}, 0, len(records))
	for _, rec := range records {
		checks = append(checks, map[string]interface{}{
			"check_time":       timeutil.FormatBeijingTime(rec.CheckTime),
			"success":          rec.Success,
			"response_time_ms": rec.ResponseTimeMs,
			"error_message":    rec.ErrorMessage,
			"check_method":     rec.CheckMethod,
			"check_source":     rec.CheckSource,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"node_id": nodeID,
		"from":    from.UTC().Format(time.RFC3339),
		"to":      to.UTC().Format(time.RFC3339),
		"total":   total,
		"checks":  checks,
	})
}

func extractNodeIDFromHealthHistoryPath(path string) (string, bool) {
	if !strings.HasPrefix(path, "/api/nodes/") || !strings.HasSuffix(path, "/health-history") {
		return "", false
	}
	trimmed := strings.TrimPrefix(path, "/api/nodes/")
	trimmed = strings.TrimSuffix(trimmed, "/health-history")
	trimmed = strings.TrimSuffix(trimmed, "/")
	if trimmed == "" {
		return "", false
	}
	return trimmed, true
}
