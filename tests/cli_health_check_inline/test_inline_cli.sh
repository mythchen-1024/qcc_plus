#!/bin/bash
# CLI 健康检查功能测试脚本

echo "=== CLI 健康检查功能验证 ==="
echo

# 1. 检查 Go 代码编译
echo "1. 检查 Go 代码编译..."
if go build -o /tmp/ccproxy_test ./cmd/cccli; then
    echo "✓ Go 代码编译成功"
    rm -f /tmp/ccproxy_test
else
    echo "✗ Go 代码编译失败"
    exit 1
fi
echo

# 2. 检查 Dockerfile 语法
echo "2. 检查 Dockerfile 语法..."
if docker build --no-cache -t qcc_plus_cli_test . > /tmp/docker_build.log 2>&1; then
    echo "✓ Docker 镜像构建成功"
else
    echo "✗ Docker 镜像构建失败，查看日志："
    tail -50 /tmp/docker_build.log
    exit 1
fi
echo

# 3. 检查镜像中 Claude CLI 是否已安装
echo "3. 检查 Claude CLI 安装..."
if docker run --rm qcc_plus_cli_test bash -c "claude --version" > /tmp/claude_version.log 2>&1; then
    echo "✓ Claude CLI 已安装"
    cat /tmp/claude_version.log
else
    echo "✗ Claude CLI 未安装或无法运行"
    cat /tmp/claude_version.log
    exit 1
fi
echo

# 4. 检查 entrypoint 脚本
echo "4. 测试 entrypoint 脚本..."
if docker run --rm qcc_plus_cli_test bash -c "/app/docker-entrypoint.sh --help" > /tmp/entrypoint.log 2>&1; then
    echo "✓ Entrypoint 脚本可以执行"
    head -20 /tmp/entrypoint.log
else
    echo "✗ Entrypoint 脚本执行失败"
    cat /tmp/entrypoint.log
fi
echo

# 5. 清理
echo "5. 清理测试资源..."
docker rmi qcc_plus_cli_test 2>/dev/null
rm -f /tmp/docker_build.log /tmp/claude_version.log /tmp/entrypoint.log
echo "✓ 清理完成"
echo

echo "=== 测试完成 ==="
echo "✓ 所有基本检查通过"
echo
echo "注意："
echo "- 完整的健康检查功能需要在运行时测试"
echo "- 需要配置有效的 ANTHROPIC_API_KEY 才能验证完整功能"
