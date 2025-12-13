#!/bin/bash

# 修復 502 Bad Gateway 錯誤
# 使用方法: 在 VPS 上執行: bash scripts/fix-502.sh

set -e

echo "🔧 開始修復 502 Bad Gateway 錯誤..."
echo ""

cd /opt/showartz || {
    echo "❌ 錯誤: 找不到 /opt/showartz 目錄"
    exit 1
}

# 1. 停止所有容器
echo "🛑 步驟 1/5: 停止所有容器..."
docker-compose down
echo "✅ 容器已停止"
echo ""

# 2. 清理可能的問題
echo "🧹 步驟 2/5: 清理..."
# 檢查是否有僵屍進程
pkill -f "node.*next" 2>/dev/null || true
echo "✅ 清理完成"
echo ""

# 3. 檢查環境變數文件
echo "🔐 步驟 3/5: 檢查環境變數..."
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在，請確保已配置"
else
    echo "✅ .env 文件存在"
    # 檢查關鍵變數
    if grep -q "OPENAI_API_KEY" .env && grep -q "DATABASE_URL" .env; then
        echo "✅ 關鍵環境變數已配置"
    else
        echo "⚠️  警告: 某些關鍵環境變數可能缺失"
    fi
fi
echo ""

# 4. 重新構建並啟動
echo "🔨 步驟 4/5: 重新構建並啟動容器..."
docker-compose up -d --build
echo "✅ 容器已啟動"
echo ""

# 5. 等待服務就緒並檢查
echo "⏳ 步驟 5/5: 等待服務就緒..."
sleep 15

echo ""
echo "📊 檢查容器狀態:"
docker-compose ps

echo ""
echo "🔌 檢查端口監聽:"
if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✅ 端口 3000 正在監聽"
else
    echo "❌ 端口 3000 仍未監聽，查看日誌:"
    docker-compose logs app --tail=30
fi

echo ""
echo "🌐 測試本地連接:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ 本地連接成功"
else
    echo "❌ 本地連接失敗，查看詳細日誌:"
    docker-compose logs app --tail=50
fi

echo ""
echo "✅ 修復完成！"
echo ""
echo "💡 如果問題仍然存在，請執行:"
echo "   docker-compose logs app --tail=100"
echo "   查看完整錯誤訊息"


