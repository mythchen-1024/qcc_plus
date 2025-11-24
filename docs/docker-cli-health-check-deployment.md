# CLI 健康检查部署指南

## 概述
qcc_plus 支持三种健康检查方式，其中 **CLI 方式** 现已改为在容器内直接安装 Claude Code CLI，无需 Docker-in-Docker 或挂载宿主机 Docker socket。

## 架构说明

### 实现方式：容器内集成 Claude CLI
- **原理**：在运行镜像中预装 Node.js 20 与 `@anthropic-ai/claude-code`，健康检查直接调用 `claude` 命令。
- **优点**：简单、独立、无需额外依赖；不需要宿主机 Docker socket，安全性更高。
- **特点**：镜像自带 CLI，启动即用，无需单独验证容器。

### 组件
1. **Node.js 20**：通过 apt 安装，供 Claude CLI 运行。
2. **Claude Code CLI**：通过 npm 全局安装 `@anthropic-ai/claude-code`。
3. **健康检查逻辑**：进程内直接执行 `claude -p "hi" --non-interactive --timeout 10s`。

## 部署步骤

### 1. 使用 docker-compose 部署（推荐）
示例 `docker-compose.yml` 片段：

```yaml
services:
  proxy:
    build: .
    container_name: qcc_plus
    ports:
      - "8000:8000"
    environment:
      UPSTREAM_BASE_URL: https://api.anthropic.com
      UPSTREAM_API_KEY: your-api-key
      PROXY_HEALTH_INTERVAL_SEC: 30
    depends_on:
      mysql:
        condition: service_healthy
```

启动：
```bash
docker-compose up -d
```

### 2. 使用 docker run 部署

```bash
docker build -t qcc_plus:latest .

docker run -d \
  --name qcc_plus \
  -p 8000:8000 \
  -e UPSTREAM_BASE_URL=https://api.anthropic.com \
  -e UPSTREAM_API_KEY=your-api-key \
  qcc_plus:latest
```

### 3. 使用 Docker Hub 镜像

```bash
docker pull yxhpy520/qcc_plus:latest

docker run -d \
  --name qcc_plus \
  -p 8000:8000 \
  -e UPSTREAM_BASE_URL=https://api.anthropic.com \
  -e UPSTREAM_API_KEY=your-api-key \
  yxhpy520/qcc_plus:latest
```

> 提示：与旧方案不同，无需 `-v /var/run/docker.sock:/var/run/docker.sock`，也无需额外的验证镜像。

## 配置说明

### 关键环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `UPSTREAM_BASE_URL` | 上游 API 地址 | https://api.anthropic.com |
| `UPSTREAM_API_KEY` | 上游 API Key | - |
| `PROXY_HEALTH_INTERVAL_SEC` | 健康检查间隔（秒） | 30 |

### Dockerfile 关键片段

```dockerfile
# 安装 Node.js 20
RUN apt-get update && apt-get install -y ca-certificates curl gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# 安装 Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code@latest && claude --version
```

## 验证部署

### 1. 检查容器启动日志
```bash
docker logs qcc_plus
```

预期输出片段：
```
=== qcc_plus Entrypoint ===
✓ Claude Code CLI detected: @anthropic-ai/claude-code/x.x.x
=== Starting ccproxy ===
```

### 2. 测试 CLI 健康检查
1) 在管理界面创建节点，选择健康检查方式 `cli`。
2) 等待健康检查周期（默认 30s）。
3) 节点详情的 `last_ping_error` 为空即代表成功；若有错误会显示具体原因（如 API Key 缺失）。

## 故障排查

### 问题 1：Claude CLI 未安装
- **症状**：日志出现 `claude: command not found`
- **排查**：
  ```bash
  docker exec -it qcc_plus which claude
  docker exec -it qcc_plus claude --version
  ```
- **解决**：重新构建镜像，确保 Dockerfile 中包含 Node.js 与 `npm install -g @anthropic-ai/claude-code`。

### 问题 2：CLI 健康检查超时
- **症状**：`last_ping_error` 显示 `context deadline exceeded` 或 `claude cli failed: ... timeout`
- **排查**：
  1. 确认节点的 API Key 与 Base URL 正确；
  2. 在容器内手动执行：
     ```bash
     docker exec -it qcc_plus claude -p "hi" --non-interactive --timeout 10s
     ```
  3. 观察是否联网受限或上游延迟过高。
- **解决**：
  - 调整节点配置或网络；
  - 适当增大健康检查超时时间（代码层参数）。

## 安全优势

与旧的 Docker-in-Docker 方案相比：
1. **无需特权访问**：不再挂载 Docker socket，避免容器控制宿主机 Docker。
2. **隔离性更好**：容器无法接触宿主机守护进程，降低攻击面。
3. **简化配置**：部署命令更短，减少故障点。
4. **更轻量**：无需额外构建/运行验证容器。

## 技术细节

### Claude CLI 安装过程
见上方 Dockerfile 片段，镜像构建时完成安装并在启动时通过 `claude --version` 校验。

### 健康检查执行
Go 代码直接调用本地 CLI：

```go
cmd := exec.CommandContext(ctx, "claude", "-p", prompt, "--non-interactive", "--timeout", "10s")
```

## 相关文档
- [健康检查机制](health_check_mechanism.md)
- [CLI 健康检查实现](cli_health_check_implementation.md)
