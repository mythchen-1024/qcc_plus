#!/bin/bash
# SSH 配置验证脚本

echo "=========================================="
echo "SSH 配置验证"
echo "=========================================="
echo ""

SERVER_IP="43.156.77.170"
SSH_USER="ubuntu"
KEY_FILE="$HOME/.ssh/qcc_deploy"

# 检查密钥文件
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ 密钥文件不存在: $KEY_FILE"
    exit 1
fi

echo "测试 SSH 连接..."
echo "命令: ssh -i $KEY_FILE -o ConnectTimeout=10 ${SSH_USER}@${SERVER_IP} 'echo 连接成功'"
echo ""

if ssh -i "$KEY_FILE" -o ConnectTimeout=10 "${SSH_USER}@${SERVER_IP}" 'echo "✅ SSH 连接成功！"' 2>/dev/null; then
    echo ""
    echo "=========================================="
    echo "✅ SSH 配置正确！"
    echo "=========================================="
    echo ""
    echo "现在可以配置 GitHub Secrets 了："
    echo "  ./scripts/setup-github-secrets.sh"
else
    echo ""
    echo "=========================================="
    echo "❌ SSH 连接失败"
    echo "=========================================="
    echo ""
    echo "请检查："
    echo "1. 公钥是否已添加到服务器？"
    echo "   公钥内容："
    cat "${KEY_FILE}.pub"
    echo ""
    echo "2. 通过云控制台或 VNC 添加公钥到服务器："
    echo "   mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "   echo '$(cat ${KEY_FILE}.pub)' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    echo ""
    echo "3. 检查服务器防火墙是否允许 SSH（端口 22）"
fi
