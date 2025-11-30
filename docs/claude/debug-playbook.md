# 调试排查手册

本文档汇总常见问题的诊断步骤和解决方案。

> **定位**：本文档是调试排查的详细说明，主文件见 @CLAUDE.md

## 请求类问题

### 400 错误

| 检查项 | 解决方案 |
|--------|----------|
| USER_HASH | 检查是否匹配账号 |
| 预热 | 尝试 `NO_WARMUP=1` 跳过预热 |
| 系统提示 | 确认使用精简系统提示 `MINIMAL_SYSTEM=1` |

### 工具定义格式错误 (tools.*.custom)

- v3.0.1+ 自动清理工具定义中的非标准字段（如 custom、input_examples）
- 代理会自动移除 Anthropic API 不支持的字段，保留 name/description/input_schema
- 如需查看清理日志，检查代理服务器输出

## 节点/连接类问题

### 代理连接失败

| 检查项 | 解决方案 |
|--------|----------|
| 上游地址 | 检查 `UPSTREAM_BASE_URL` 配置 |
| 网络 | 确认网络连通性 |
| 重试 | 查看 `PROXY_RETRY_MAX` 重试配置 |

### MySQL 连接问题

| 检查项 | 解决方案 |
|--------|----------|
| DSN 格式 | 检查 `PROXY_MYSQL_DSN` 格式 |
| 服务状态 | 确认 MySQL 服务运行状态 |
| 网络 | 检查防火墙和端口配置 |

## CI/CD 类问题

### 健康检查超时

| 检查项 | 解决方案 |
|--------|----------|
| 版本 | v1.0.1+ 已增强健康检查：10s 初始等待 + 6 次重试 |
| 端口 | 检查服务器端口和防火墙配置 |
| 日志 | 查看部署日志：`docker logs qcc_test-proxy-1` |

详见 @docs/ci-cd-troubleshooting.md

## 日志位置

| 组件 | 日志命令 |
|------|----------|
| Docker 容器 | `docker logs <container_name>` |
| 代理服务器 | 标准输出 |
| 健康检查 | 代理服务器日志中的 `[health]` 标签 |

## 相关文档

- @CLAUDE.md - 主记忆文件
- @docs/claude/lessons-learned.md - 踩坑记录
- @docs/ci-cd-troubleshooting.md - CI/CD 部署故障排查指南
- @docs/health_check_mechanism.md - 健康检查机制详解
