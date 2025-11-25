#!/usr/bin/env bash
# 诊断脚本：检查数据持久化情况
set -euo pipefail

echo "========================================="
echo "数据持久化诊断报告"
echo "========================================="
echo ""

# 1. 检查容器状态
echo "1. 检查容器状态："
echo "---"
docker ps | grep qcc_test || echo "⚠️  未找到 qcc_test 容器"
echo ""

# 2. 检查 MySQL volume
echo "2. 检查 MySQL volume："
echo "---"
docker volume ls | grep mysql_data_test || echo "⚠️  未找到 mysql_data_test volume"
echo ""

# 3. 检查数据库连接
echo "3. 检查数据库连接："
echo "---"
if docker exec qcc_test_mysql mysqladmin ping -uqcc -pexample -h localhost 2>/dev/null; then
    echo "✅ MySQL 连接正常"
else
    echo "❌ MySQL 连接失败"
    exit 1
fi
echo ""

# 4. 检查节点表数据
echo "4. 检查节点累计统计数据："
echo "---"
docker exec qcc_test_mysql mysql -uqcc -pexample -e "
USE qcc_proxy;
SELECT
    id,
    name,
    account_id,
    requests as 请求数,
    fail_count as 失败数,
    ROUND(total_bytes/1024/1024, 2) as 'MB流量',
    total_input as 输入tokens,
    total_output as 输出tokens,
    last_health_check_at as 最后健康检查
FROM proxy_nodes
ORDER BY requests DESC;
" 2>/dev/null || echo "❌ 查询失败"
echo ""

# 5. 检查指标表数据量
echo "5. 检查监控指标数据量："
echo "---"
docker exec qcc_test_mysql mysql -uqcc -pexample -e "
USE qcc_proxy;
SELECT
    'raw_metrics' as 表名,
    COUNT(*) as 记录数,
    MIN(ts) as 最早时间,
    MAX(ts) as 最新时间
FROM node_metrics_raw
UNION ALL
SELECT
    'hourly_metrics' as 表名,
    COUNT(*) as 记录数,
    MIN(bucket_start) as 最早时间,
    MAX(bucket_start) as 最新时间
FROM node_metrics_hourly
UNION ALL
SELECT
    'health_check_history' as 表名,
    COUNT(*) as 记录数,
    MIN(check_time) as 最早时间,
    MAX(check_time) as 最新时间
FROM health_check_history;
" 2>/dev/null || echo "❌ 查询失败"
echo ""

# 6. 检查最近的健康检查记录
echo "6. 最近 5 次健康检查："
echo "---"
docker exec qcc_test_mysql mysql -uqcc -pexample -e "
USE qcc_proxy;
SELECT
    node_id,
    check_time as 检查时间,
    success as 成功,
    response_time_ms as 响应时间ms,
    error_message as 错误信息
FROM health_check_history
ORDER BY check_time DESC
LIMIT 5;
" 2>/dev/null || echo "❌ 查询失败"
echo ""

# 7. 检查 API 返回数据
echo "7. 检查 API 返回的节点数据："
echo "---"
echo "请登录后访问: http://测试服务器:8001/api/nodes"
echo "或使用 curl 测试（需要先登录获取 session_token）："
echo "curl -H 'Cookie: session_token=YOUR_TOKEN' http://localhost:8001/api/nodes | jq"
echo ""

echo "========================================="
echo "诊断完成"
echo "========================================="
echo ""
echo "如果数据库中有数据但前端显示为 0，可能的原因："
echo "1. API 查询逻辑有问题"
echo "2. 前端渲染逻辑有问题"
echo "3. 权限问题导致无法读取数据"
echo ""
echo "下一步操作建议："
echo "1. 检查数据库中是否有数据（上面的查询结果）"
echo "2. 检查 API 返回是否正确（访问 /api/nodes）"
echo "3. 检查浏览器控制台是否有 JavaScript 错误"
