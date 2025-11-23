#!/bin/bash
# GitHub Secrets 配置脚本

echo "=========================================="
echo "GitHub Secrets 配置向导"
echo "=========================================="
echo ""

# 检查 gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 未安装 gh CLI，请先安装："
    echo "   macOS: brew install gh"
    echo "   Linux: https://github.com/cli/cli#installation"
    exit 1
fi

# 检查是否登录
if ! gh auth status &> /dev/null; then
    echo "请先登录 GitHub:"
    gh auth login
fi

echo "请输入以下信息："
echo ""

read -p "服务器 IP 地址: " SERVER_IP
read -p "SSH 用户名 (默认: deploy): " SSH_USER
SSH_USER=${SSH_USER:-deploy}

# 检查密钥文件
KEY_FILE="$HOME/.ssh/qcc_deploy"
if [ ! -f "$KEY_FILE" ]; then
    echo ""
    echo "❌ 未找到密钥文件: $KEY_FILE"
    echo "请先运行: ssh-keygen -t ed25519 -C 'deploy@qcc_plus' -f ~/.ssh/qcc_deploy"
    exit 1
fi

echo ""
echo "=========================================="
echo "开始配置 Secrets..."
echo "=========================================="

# 配置测试环境
echo "✓ 配置 TEST_HOST..."
gh secret set TEST_HOST --body "$SERVER_IP"

echo "✓ 配置 TEST_SSH_USER..."
gh secret set TEST_SSH_USER --body "$SSH_USER"

echo "✓ 配置 TEST_SSH_KEY..."
gh secret set TEST_SSH_KEY < "$KEY_FILE"

# 配置生产环境
echo "✓ 配置 PROD_HOST..."
gh secret set PROD_HOST --body "$SERVER_IP"

echo "✓ 配置 PROD_SSH_USER..."
gh secret set PROD_SSH_USER --body "$SSH_USER"

echo "✓ 配置 PROD_SSH_KEY..."
gh secret set PROD_SSH_KEY < "$KEY_FILE"

echo ""
echo "=========================================="
echo "✅ 配置完成！"
echo "=========================================="
echo ""
echo "已配置的 Secrets："
gh secret list
