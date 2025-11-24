#!/bin/bash

# Docker Hub 信息更新脚本（改进版，包含详细调试信息）
# 使用方法: ./scripts/update-dockerhub-info-v2.sh [DOCKERHUB_TOKEN]

set -e

# 配置
DOCKERHUB_USERNAME="yxhpy520"
REPO_NAME="qcc_plus"
DOCKERHUB_TOKEN="${1:-${DOCKERHUB_TOKEN}}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Docker Hub 仓库信息更新工具 v2"
echo "=========================================="
echo ""

# 检查 Token
if [ -z "$DOCKERHUB_TOKEN" ]; then
    echo -e "${RED}错误: 未提供 Docker Hub Token${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/update-dockerhub-info-v2.sh YOUR_TOKEN"
    echo ""
    exit 1
fi

echo -e "${BLUE}[1/5] 登录到 Docker Hub...${NC}"
# 使用 Token 登录
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$DOCKERHUB_USERNAME\", \"password\": \"$DOCKERHUB_TOKEN\"}" \
    https://hub.docker.com/v2/users/login/)

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .token 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}✗ 登录失败${NC}"
    echo "响应内容:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ 登录成功${NC}"
echo ""

# 获取当前仓库信息
echo -e "${BLUE}[2/5] 获取当前仓库信息...${NC}"
REPO_INFO=$(curl -s -X GET \
    -H "Authorization: JWT $TOKEN" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

echo "当前描述:"
echo "$REPO_INFO" | jq -r '.description // "无"'
echo ""
echo "当前完整描述长度:"
echo "$REPO_INFO" | jq -r '.full_description // "无"' | wc -c
echo ""

# 准备 Short Description（100 字节限制）
SHORT_DESC="Claude CLI 多租户代理 | 自动切换 | Web管理"

echo -e "${BLUE}[3/5] 更新 Short Description...${NC}"
echo "新描述: $SHORT_DESC"
echo "长度: ${#SHORT_DESC} 字符"
echo ""

UPDATE_SHORT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH \
    -H "Authorization: JWT $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg desc "$SHORT_DESC" '{description: $desc}')" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

HTTP_CODE=$(echo "$UPDATE_SHORT" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$UPDATE_SHORT" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Short Description 更新成功${NC}"
else
    echo -e "${RED}✗ 更新失败 (HTTP $HTTP_CODE)${NC}"
    echo "响应内容:"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
fi
echo ""

# 准备 Full Description
echo -e "${BLUE}[4/5] 更新 Full Description...${NC}"

if [ ! -f "README.dockerhub.md" ]; then
    echo -e "${RED}错误: 未找到 README.dockerhub.md 文件${NC}"
    exit 1
fi

FULL_DESC=$(cat README.dockerhub.md)
FULL_DESC_LENGTH=${#FULL_DESC}

echo "文档长度: $FULL_DESC_LENGTH 字符"
echo ""

# 创建临时 JSON 文件
TEMP_JSON=$(mktemp)
jq -n --arg desc "$FULL_DESC" '{full_description: $desc}' > "$TEMP_JSON"

UPDATE_FULL=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH \
    -H "Authorization: JWT $TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_JSON" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

rm -f "$TEMP_JSON"

HTTP_CODE=$(echo "$UPDATE_FULL" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$UPDATE_FULL" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Full Description 更新成功${NC}"
else
    echo -e "${RED}✗ 更新失败 (HTTP $HTTP_CODE)${NC}"
    echo "响应内容:"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
fi
echo ""

# 验证更新
echo -e "${BLUE}[5/5] 验证更新结果...${NC}"
sleep 2  # 等待 2 秒让 Docker Hub 处理更新

VERIFY_INFO=$(curl -s -X GET \
    -H "Authorization: JWT $TOKEN" \
    "https://hub.docker.com/v2/repositories/$DOCKERHUB_USERNAME/$REPO_NAME/")

NEW_SHORT=$(echo "$VERIFY_INFO" | jq -r '.description // "无"')
NEW_FULL_LEN=$(echo "$VERIFY_INFO" | jq -r '.full_description // "无"' | wc -c | tr -d ' ')

echo "更新后的 Short Description:"
echo "$NEW_SHORT"
echo ""
echo "更新后的 Full Description 长度: $NEW_FULL_LEN 字符"
echo ""

echo "=========================================="
echo -e "${GREEN}更新完成！${NC}"
echo "=========================================="
echo ""
echo "请访问以下链接验证更新:"
echo "  ${BLUE}https://hub.docker.com/r/$DOCKERHUB_USERNAME/$REPO_NAME${NC}"
echo ""
echo "注意: Docker Hub 可能需要几分钟时间来显示更新"
echo ""
