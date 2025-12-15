#!/bin/bash

# 重新部署 Showartz 到 Vultr VPS
# 使用方法：在 VPS 上執行 ./scripts/redeploy-vultr.sh

set -e  # 遇到錯誤立即退出

echo "🚀 開始重新部署 Showartz..."

# 進入專案目錄
cd /opt/showartz || {
    echo "❌ 錯誤：找不到 /opt/showartz 目錄"
    exit 1
}

echo "📥 拉取最新代碼..."
git pull

echo "🛑 停止現有容器..."
docker-compose down

echo "🔨 重新構建並啟動服務..."
docker-compose up -d --build

echo "⏳ 等待服務啟動..."
sleep 5

echo "📊 檢查容器狀態..."
docker-compose ps

echo "📋 查看應用日誌（最後 20 行）..."
docker-compose logs --tail=20 app

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 有用的命令："
echo "   - 查看所有日誌：docker-compose logs -f"
echo "   - 查看應用日誌：docker-compose logs -f app"
echo "   - 查看容器狀態：docker-compose ps"
echo "   - 停止服務：docker-compose down"
echo "   - 重啟服務：docker-compose restart"


