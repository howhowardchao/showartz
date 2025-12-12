#!/bin/bash

# 部署最新代碼到正式站
# 使用方法: 在 VPS 上執行: bash scripts/deploy-production.sh

set -e  # 遇到錯誤立即退出

echo "🚀 開始部署最新優化到正式站..."
echo ""

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 錯誤: 請在專案根目錄執行此腳本"
    exit 1
fi

# 進入專案目錄（如果不在）
cd /opt/showartz 2>/dev/null || cd "$(dirname "$0")/.."

echo "📂 當前目錄: $(pwd)"
echo ""

# 1. 拉取最新代碼
echo "📥 步驟 1/5: 拉取最新代碼..."
git pull origin main || {
    echo "❌ Git pull 失敗，請檢查網路連線或權限"
    exit 1
}
echo "✅ 代碼更新完成"
echo ""

# 2. 停止現有容器
echo "🛑 步驟 2/5: 停止現有容器..."
docker-compose down
echo "✅ 容器已停止"
echo ""

# 3. 重新構建
echo "🔨 步驟 3/5: 重新構建 Docker 映像..."
docker-compose build --no-cache || {
    echo "❌ 構建失敗，請檢查錯誤訊息"
    exit 1
}
echo "✅ 構建完成"
echo ""

# 4. 啟動容器
echo "🚀 步驟 4/5: 啟動容器..."
docker-compose up -d
echo "✅ 容器已啟動"
echo ""

# 5. 等待服務就緒
echo "⏳ 步驟 5/5: 等待服務就緒..."
sleep 10

# 檢查容器狀態
echo ""
echo "📊 容器狀態:"
docker-compose ps

echo ""
echo "📋 檢查服務健康狀態..."
if docker-compose ps | grep -q "Up (healthy)"; then
    echo "✅ 資料庫服務正常"
fi

if docker-compose ps | grep -q "showartz-app.*Up"; then
    echo "✅ 應用服務已啟動"
fi

echo ""
echo "🔍 檢查應用日誌（最後 20 行）:"
docker-compose logs app --tail=20

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 請訪問 https://showartz.com 確認網站正常運作"
echo ""
echo "💡 如果遇到問題，可以執行以下命令查看日誌:"
echo "   docker-compose logs app --tail=50"
echo "   docker-compose logs postgres --tail=50"

