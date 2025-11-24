#!/bin/bash

# Docker Hub 仓库信息更新脚本
# 使用方法: ./scripts/update-dockerhub-info.sh [DOCKERHUB_TOKEN]

set -e

# 配置
DOCKERHUB_USERNAME="yxhpy520"
REPO_NAME="qcc_plus"
DOCKERHUB_TOKEN="${1:-${DOCKERHUB_TOKEN}}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Docker Hub 仓库信息更新工具"
echo "=========================================="

# 检查 Token
if [ -z "$DOCKERHUB_TOKEN" ]; then
    echo -e "${RED}错误: 未提供 Docker Hub Token${NC}"
    echo ""
    echo "使用方法:"
    echo "  方式1: ./scripts/update-dockerhub-info.sh YOUR_TOKEN"
    echo "  方式2: export DOCKERHUB_TOKEN=YOUR_TOKEN && ./scripts/update-dockerhub-info.sh"
    echo ""
    echo "如何获取 Token:"
    echo "  1. 访问 https://hub.docker.com/settings/security"
    echo "  2. 点击 'New Access Token'"
    echo "  3. 名称填写: qcc_plus_update"
    echo "  4. 权限选择: Read & Write"
    echo "  5. 复制生成的 Token"
    echo ""
    exit 1
fi

echo -e "${YELLOW}登录到 Docker Hub...${NC}"
# 使用 Token 登录
TOKEN=$(curl -s -H "Content-Type: application/json" -X POST \
    -d "{\"username\": \"$DOCKERHUB_USERNAME\", \"password\": \"$DOCKERHUB_TOKEN\"}" \
    https://hub.docker.com/v2/users/login/ | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}错误: 登录失败，请检查 Token 是否正确${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 登录成功${NC}"

# 准备 Short Description
SHORT_DESC="功能完整的 Claude Code CLI 多租户代理服务器，支持多节点管理、自动故障切换和 React Web 管理界面"

echo ""
echo -e "${YELLOW}更新 Short Description...${NC}"
echo "内容: $SHORT_DESC"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
    -H "Authorization: JWT $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"description\": \"$SHORT_DESC\"}" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Short Description 更新成功${NC}"
else
    echo -e "${RED}✗ Short Description 更新失败 (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

# 准备 Full Description
echo ""
echo -e "${YELLOW}更新 Full Description...${NC}"

if [ ! -f "README.dockerhub.md" ]; then
    echo -e "${RED}错误: 未找到 README.dockerhub.md 文件${NC}"
    exit 1
fi

FULL_DESC=$(cat README.dockerhub.md | jq -Rs .)

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
    -H "Authorization: JWT $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"full_description\": $FULL_DESC}" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Full Description 更新成功${NC}"
else
    echo -e "${RED}✗ Full Description 更新失败 (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}更新完成！${NC}"
echo "=========================================="
echo ""
echo "请访问以下链接验证更新:"
echo "  https://hub.docker.com/r/$DOCKERHUB_USERNAME/$REPO_NAME"
echo ""
