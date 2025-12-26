#!/bin/bash

# 快速重啟服務以修復 502 錯誤
# 使用方法: bash scripts/restart-services.sh

set +e

echo "🔧 開始重啟服務..."
echo ""

cd /opt/showartz || {
    echo "❌ 錯誤: 無法進入 /opt/showartz 目錄"
    exit 1
}

echo "📁 當前目錄: $(pwd)"
echo ""

# 1. 停止容器
echo "🛑 步驟 1/4: 停止容器..."
docker-compose down
echo ""

# 2. 啟動容器
echo "🚀 步驟 2/4: 啟動容器..."
docker-compose up -d
echo ""

# 3. 等待服務啟動
echo "⏳ 步驟 3/4: 等待服務啟動（60秒）..."
sleep 60
echo ""

# 4. 檢查狀態
echo "📊 步驟 4/4: 檢查服務狀態..."
echo ""
docker-compose ps
echo ""

# 檢查健康狀態
echo "🏥 檢查應用健康狀態..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ 應用運行正常 (HTTP $HEALTH_CHECK)"
else
    echo "⚠️  應用可能尚未就緒 (HTTP $HEALTH_CHECK)"
    echo "查看應用日誌:"
    docker-compose logs --tail 30 app
fi

echo ""
echo "✨ 完成！"

