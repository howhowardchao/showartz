#!/bin/bash
# 檢查部署狀態腳本

echo "🔍 檢查 Showartz 部署狀態..."
echo ""

# 檢查容器狀態
echo "📦 容器狀態:"
ssh root@45.63.123.237 'cd /opt/showartz && docker-compose ps'
echo ""

# 檢查應用日誌（最後 30 行）
echo "📋 應用日誌（最後 30 行）:"
ssh root@45.63.123.237 'cd /opt/showartz && docker-compose logs app --tail=30'
echo ""

# 檢查健康狀態
echo "🏥 健康檢查:"
ssh root@45.63.123.237 'curl -I http://localhost:3000/api/health 2>&1 | head -5'
echo ""

echo "✅ 檢查完成！"
echo ""
echo "🌐 訪問網站: https://showartz.com"
echo "🔐 訪問後台: https://showartz.com/admin"

