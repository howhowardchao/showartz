#!/bin/bash
# ============================================
# 直接修復 502 錯誤 - 複製以下所有命令到伺服器執行
# ============================================

# 進入專案目錄（根據實際路徑調整）
cd /opt/showartz || cd ~/showartz || cd ./showartz

# 1. 拉取最新代碼
echo "📥 拉取最新代碼..."
git pull origin main

# 2. 停止所有容器
echo "🛑 停止容器..."
docker-compose down

# 3. 重新構建並啟動
echo "🔨 重新構建和啟動（這需要幾分鐘）..."
docker-compose up -d --build

# 4. 等待 30 秒讓服務啟動
echo "⏳ 等待服務啟動..."
sleep 30

# 5. 檢查狀態
echo "📊 檢查容器狀態:"
docker-compose ps

echo ""
echo "📋 查看應用日誌（最後 30 行）:"
docker-compose logs app --tail=30

echo ""
echo "🌐 測試連接:"
curl -I http://localhost:3000

echo ""
echo "✅ 完成！如果仍有問題，執行: docker-compose logs app --tail=100"

