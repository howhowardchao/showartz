#!/bin/bash

# 檢查並修復 .env 文件
cd /opt/showartz

echo "📋 當前 .env 文件內容："
echo "---"
cat .env
echo "---"
echo ""

echo "🔍 檢查關鍵環境變數..."
if grep -q "your_openai_api_key_here" .env; then
    echo "❌ 發現預設值 'your_openai_api_key_here'，需要更新！"
    exit 1
fi

if grep -q "your_assistant_id_here" .env; then
    echo "❌ 發現預設值 'your_assistant_id_here'，需要更新！"
    exit 1
fi

echo "✅ 環境變數看起來正確"
echo ""
echo "🔄 重啟服務以應用環境變數..."
docker-compose down
docker-compose up -d
sleep 5

echo ""
echo "🔍 驗證容器中的環境變數..."
docker-compose exec -T app env | grep -E "OPENAI|DATABASE" | head -5


