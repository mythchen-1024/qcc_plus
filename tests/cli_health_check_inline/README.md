# CLI 健康检查内联实现测试

## 概述
本测试验证 CLI 健康检查从 Docker-in-Docker 方式改为容器内直接安装 Claude CLI 的实现。

## 主要改动

### 1. Dockerfile
- 添加 Node.js 20 安装（通过 NodeSource apt 仓库）
- 添加 Claude Code CLI 全局安装（`npm install -g @anthropic-ai/claude-code@latest`）
- 移除 Docker CLI 下载和安装
- 移除验证容器 Dockerfile 复制
- 保留 cloudflared（用于隧道功能）

### 2. internal/proxy/health.go
- 修改 `defaultCLIRunner` 函数：
  - 不再执行 `docker run`
  - 直接调用本地 `claude` 命令
  - 传递环境变量：`ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`
  - 执行命令：`claude -p "{prompt}" --non-interactive --timeout 10s`
- 移除 `isDockerUnavailable` 函数
- 保持 API 和 HEAD 健康检查逻辑不变

### 3. scripts/docker-entrypoint.sh
- 移除所有 Docker 相关检查（socket、CLI、镜像构建）
- 添加 Claude CLI 可用性检查
- 打印 Claude CLI 版本信息
- 简化为直接启动主程序

### 4. docker-compose.yml
- 移除 Docker socket 挂载（`/var/run/docker.sock`）
- 移除相关注释
- 保持其他配置不变

## 优势

### 安全性
- **无需特权访问**：不需要挂载 Docker socket
- **隔离性更好**：容器无法访问宿主机 Docker
- **减少攻击面**：移除了 Docker-in-Docker 的安全风险

### 简化性
- **部署更简单**：无需额外配置 Docker socket
- **依赖更少**：不需要宿主机 Docker 支持
- **更轻量**：无需构建和运行额外的验证容器

### 可靠性
- **更快的健康检查**：无需启动容器，直接进程调用
- **减少失败点**：移除了 Docker 通信链路
- **更清晰的错误信息**：直接的命令行输出

## 测试方法

### 快速测试（不构建镜像）
```bash
# 编译检查
go build -o /tmp/ccproxy_test ./cmd/cccli
```

### 完整测试（构建镜像）
```bash
# 运行测试脚本
./tests/cli_health_check_inline/test_inline_cli.sh
```

测试脚本会：
1. 编译 Go 代码
2. 构建 Docker 镜像
3. 检查 Claude CLI 安装
4. 测试 entrypoint 脚本
5. 清理测试资源

### 手动测试
```bash
# 构建镜像
docker build -t qcc_plus_test .

# 检查 Claude CLI
docker run --rm qcc_plus_test claude --version

# 运行服务
docker run --rm -p 8000:8000 \
  -e UPSTREAM_BASE_URL=https://api.anthropic.com \
  -e UPSTREAM_API_KEY=your-key \
  qcc_plus_test

# 在管理界面创建节点，选择 "CLI" 健康检查方式
# 等待健康检查执行，查看结果
```

## 兼容性

### 现有节点
- 已存在的使用 CLI 健康检查的节点会自动使用新实现
- 无需修改节点配置
- API 和 HEAD 健康检查方式不受影响

### 配置变更
- 不再需要挂载 Docker socket
- 环境变量保持不变
- 健康检查接口保持不变

## 已更新文档
- `docs/docker-cli-health-check-deployment.md` - 完全重写，说明新架构
- `docs/health_check_mechanism.md` - 更新 CLI 健康检查说明
- `docs/cli_health_check_implementation.md` - 同步实现细节

## 测试状态
- [x] Go 代码编译通过
- [ ] Docker 镜像构建测试（需要构建环境）
- [ ] Claude CLI 功能测试（需要有效 API Key）
- [ ] 端到端健康检查测试（需要运行环境）

## 后续工作
1. 在 CI/CD 环境中验证镜像构建
2. 使用真实 API Key 测试完整的健康检查流程
3. 更新 CHANGELOG.md
4. 发布新版本到 Docker Hub
