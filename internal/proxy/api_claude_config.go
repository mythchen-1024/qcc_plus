package proxy

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

const claudeConfigTTL = 24 * time.Hour

// ClaudeConfigTemplate 是返回给前端的配置模板。
type ClaudeConfigTemplate struct {
	ProxyURL    string `json:"proxy_url"`
	APIKey      string `json:"api_key"`
	AccountName string `json:"account_name"`
	ConfigJSON  string `json:"config_json"`
	ConfigID    string `json:"config_id"`
	InstallCmd  struct {
		Unix    string `json:"unix"`
		Windows string `json:"windows"`
	} `json:"install_cmd"`
}

// GET /api/claude-config/template
func (p *Server) handleClaudeConfigTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	account := accountFromCtx(r)
	if account == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	q := r.URL.Query()
	proxyURL := strings.TrimSpace(q.Get("proxy_url"))
	if proxyURL == "" {
		proxyURL = baseURLFromRequest(r)
	}
	apiKey := strings.TrimSpace(q.Get("api_key"))
	if apiKey == "" {
		apiKey = account.ProxyAPIKey
	}

	allowList := normalizeList(q["allow"])
	denyList := normalizeList(q["deny"])

	config := map[string]interface{}{
		"env": map[string]string{
			"ANTHROPIC_BASE_URL": proxyURL,
			"ANTHROPIC_API_KEY":  apiKey,
		},
		"permissions": map[string][]string{
			"allow": allowList,
			"deny":  denyList,
		},
	}

	if model := strings.TrimSpace(q.Get("model")); model != "" {
		config["model"] = model
	}

	cfgBytes, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to build config"})
		return
	}

	cfgStr := string(cfgBytes)
	configID := p.saveClaudeConfig(cfgStr)

	origin := baseURLFromRequest(r)
	unixCmd := "curl -fsSL " + origin + "/api/claude-config/download/" + configID + " -o ~/.claude/settings.json"
	winCmd := "iwr " + origin + "/api/claude-config/download/" + configID + " -OutFile \"$env:USERPROFILE\\.claude\\settings.json\""

	resp := ClaudeConfigTemplate{
		ProxyURL:    proxyURL,
		APIKey:      apiKey,
		AccountName: account.Name,
		ConfigJSON:  cfgStr,
		ConfigID:    configID,
	}
	resp.InstallCmd.Unix = unixCmd
	resp.InstallCmd.Windows = winCmd

	writeJSON(w, http.StatusOK, resp)
}

// GET /api/claude-config/download/:id
func (p *Server) handleClaudeConfigDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/claude-config/download/")
	id = strings.Trim(id, "/")
	if id == "" {
		http.NotFound(w, r)
		return
	}

	cfg, ok := p.getClaudeConfig(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=\"settings.json\"")
	_, _ = w.Write([]byte(cfg))
}

func (p *Server) saveClaudeConfig(content string) string {
	if p == nil {
		return ""
	}
	p.claudeConfigMu.Lock()
	defer p.claudeConfigMu.Unlock()

	if p.claudeConfigCache == nil {
		p.claudeConfigCache = make(map[string]claudeConfigEntry)
	}

	// 清理过期条目
	now := time.Now()
	for k, v := range p.claudeConfigCache {
		if v.expiresAt.Before(now) {
			delete(p.claudeConfigCache, k)
		}
	}

	id := generateShortID()
	p.claudeConfigCache[id] = claudeConfigEntry{content: content, expiresAt: now.Add(claudeConfigTTL)}
	return id
}

func (p *Server) getClaudeConfig(id string) (string, bool) {
	if p == nil {
		return "", false
	}
	p.claudeConfigMu.RLock()
	entry, ok := p.claudeConfigCache[id]
	p.claudeConfigMu.RUnlock()
	if !ok {
		return "", false
	}
	if time.Now().After(entry.expiresAt) {
		p.claudeConfigMu.Lock()
		delete(p.claudeConfigCache, id)
		p.claudeConfigMu.Unlock()
		return "", false
	}
	return entry.content, true
}

func generateShortID() string {
	b := make([]byte, 10)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format("150405")))
	}
	return hex.EncodeToString(b)[:16]
}

func baseURLFromRequest(r *http.Request) string {
	scheme := "http"
	if r != nil {
		if proto := r.Header.Get("X-Forwarded-Proto"); strings.EqualFold(proto, "https") {
			scheme = "https"
		} else if r.TLS != nil {
			scheme = "https"
		}
	}
	host := ""
	if r != nil {
		host = r.Header.Get("X-Forwarded-Host")
		if host == "" {
			host = r.Host
		}
	}
	if host == "" {
		host = "localhost"
	}
	return scheme + "://" + strings.TrimSuffix(host, "/")
}

func normalizeList(vals []string) []string {
	out := make([]string, 0, len(vals))
	seen := make(map[string]struct{})
	for _, v := range vals {
		parts := strings.FieldsFunc(v, func(r rune) bool {
			return r == ',' || r == '\n' || r == ';'
		})
		if len(parts) == 0 {
			parts = []string{v}
		}
		for _, p := range parts {
			item := strings.TrimSpace(p)
			if item == "" {
				continue
			}
			if _, exist := seen[item]; exist {
				continue
			}
			seen[item] = struct{}{}
			out = append(out, item)
		}
	}
	return out
}

type claudeConfigEntry struct {
	content   string
	expiresAt time.Time
}
