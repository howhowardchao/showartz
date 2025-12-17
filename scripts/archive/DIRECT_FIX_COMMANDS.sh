#!/bin/bash
# ============================================
# 直接修復 502 錯誤 - 複製以下所有命令到伺服器執行
# ============================================

# 自動檢測專案目錄（安全模式）
PROJECT_DIR="/opt/showartz"
if [ ! -d "$PROJECT_DIR" ]; then
    # 嘗試其他常見路徑
    if [ -d "/home/$(whoami)/showartz" ]; then
        PROJECT_DIR="/home/$(whoami)/showartz"
    elif [ -d "$HOME/showartz" ]; then
        PROJECT_DIR="$HOME/showartz"
    elif [ -d "./showartz" ]; then
        PROJECT_DIR="./showartz"
    else
        echo "❌ 錯誤: 找不到專案目錄"
        echo "請在專案目錄中執行此腳本，或修改 PROJECT_DIR 變數"
        exit 1
    fi
fi

# 進入專案目錄（如果失敗則退出）
cd "$PROJECT_DIR" || {
    echo "❌ 錯誤: 無法進入專案目錄: $PROJECT_DIR"
    exit 1
}

echo "📁 使用專案目錄: $PROJECT_DIR"
echo ""

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

