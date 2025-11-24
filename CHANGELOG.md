# 更新日志

所有重要的更改都将记录在此文件中。

日志格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增
- 版本信息展示功能
- 更新日志查看功能
- `/version` API 接口

## [1.0.0] - 2025-11-23

### 新增
- 多租户架构支持，实现账号隔离
- React Web 管理界面（React 18 + TypeScript + Vite）
- Cloudflare Tunnel 集成，支持内网穿透
- Docker 化部署支持
- MySQL 数据持久化
- 多节点管理和自动故障切换
- 健康检查和自动探活机制
- 会话管理和权限控制
- 实时监控和指标统计

### 核心特性
- Claude Code CLI 请求复刻
- 反向代理服务器（端口转发）
- 工具定义自动清理
- 事件驱动节点切换
- 管理员和普通账号权限分离

### 技术栈
- 后端：Go 1.21, MySQL, Docker
- 前端：React 18, TypeScript, Vite, Chart.js
- 部署：Docker Compose, Cloudflare Tunnel

[unreleased]: https://github.com/yxhpy/qcc_plus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yxhpy/qcc_plus/releases/tag/v1.0.0
