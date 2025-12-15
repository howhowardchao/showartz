#!/bin/bash

# 修復 502 Bad Gateway 錯誤
# 使用方法: 在 VPS 上執行: bash scripts/fix-502.sh

# 不設置 set -e，以便在錯誤時繼續診斷
set +e

echo "🔧 開始修復 502 Bad Gateway 錯誤..."
echo ""

# 自動檢測專案目錄
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

cd "$PROJECT_DIR" || {
    echo "❌ 錯誤: 無法進入專案目錄: $PROJECT_DIR"
    exit 1
}

echo "📁 使用專案目錄: $PROJECT_DIR"
echo ""

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

# 4. 拉取最新代碼（如果有 git）
echo "📥 步驟 4/6: 檢查並拉取最新代碼..."
if [ -d ".git" ]; then
    echo "檢測到 Git 倉庫，拉取最新代碼..."
    git pull origin main 2>/dev/null || echo "⚠️  Git pull 失敗或無需更新"
else
    echo "⚠️  未檢測到 Git 倉庫，跳過代碼更新"
fi
echo ""

# 5. 重新構建並啟動
echo "🔨 步驟 5/6: 重新構建並啟動容器..."
echo "這可能需要幾分鐘時間，請耐心等待..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ 容器構建和啟動命令執行成功"
else
    echo "❌ 容器構建或啟動失敗，查看錯誤:"
    docker-compose logs --tail=30
    exit 1
fi
echo ""

# 6. 等待服務就緒並檢查
echo "⏳ 步驟 6/6: 等待服務就緒..."
echo "等待資料庫和應用啟動（最多 60 秒）..."

# 等待資料庫就緒
for i in {1..12}; do
    if docker-compose exec -T postgres pg_isready -U showartz >/dev/null 2>&1; then
        echo "✅ 資料庫已就緒"
        break
    fi
    echo "等待資料庫啟動... ($i/12)"
    sleep 5
done

# 等待應用啟動
for i in {1..12}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302\|404"; then
        echo "✅ 應用已響應"
        break
    fi
    echo "等待應用啟動... ($i/12)"
    sleep 5
done
echo ""

echo ""
echo "=========================================="
echo "📊 最終檢查報告"
echo "=========================================="
echo ""

# 檢查容器狀態
echo "1️⃣  容器狀態:"
docker-compose ps
echo ""

# 檢查容器是否運行
APP_RUNNING=$(docker-compose ps app | grep -c "Up" || echo "0")
if [ "$APP_RUNNING" -eq 0 ]; then
    echo "❌ 應用容器未運行！"
    echo "查看應用日誌:"
    docker-compose logs app --tail=50
    echo ""
    echo "嘗試重啟應用容器:"
    docker-compose restart app
    sleep 10
else
    echo "✅ 應用容器正在運行"
fi
echo ""

# 檢查端口監聽
echo "2️⃣  端口監聽狀態:"
if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":3000"; then
        echo "✅ 端口 3000 正在監聽"
        netstat -tuln | grep ":3000"
    else
        echo "❌ 端口 3000 未監聽"
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q ":3000"; then
        echo "✅ 端口 3000 正在監聽"
        ss -tuln | grep ":3000"
    else
        echo "❌ 端口 3000 未監聽"
    fi
else
    echo "⚠️  無法檢查端口（netstat/ss 未安裝）"
fi
echo ""

# 測試本地連接
echo "3️⃣  本地連接測試:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
    echo "✅ 本地連接成功 (HTTP $HTTP_CODE)"
    echo "   應用正在響應請求"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ 無法連接到 localhost:3000"
    echo "   可能原因：應用未啟動或端口未監聽"
else
    echo "⚠️  應用響應異常 (HTTP $HTTP_CODE)"
fi
echo ""

# 檢查應用日誌中的錯誤
echo "4️⃣  應用日誌檢查（最後 20 行）:"
ERROR_COUNT=$(docker-compose logs app --tail=100 2>&1 | grep -iE "error|fatal|exception" | wc -l || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "⚠️  發現 $ERROR_COUNT 個可能的錯誤訊息:"
    docker-compose logs app --tail=100 2>&1 | grep -iE "error|fatal|exception" | tail -5
else
    echo "✅ 未發現明顯錯誤"
fi
echo ""

# 檢查 Nginx（如果存在）
echo "5️⃣  Nginx 狀態:"
if command -v nginx >/dev/null 2>&1; then
    if nginx -t 2>&1 | grep -q "successful"; then
        echo "✅ Nginx 配置正確"
        if systemctl is-active --quiet nginx 2>/dev/null || pgrep nginx >/dev/null 2>&1; then
            echo "✅ Nginx 服務正在運行"
        else
            echo "⚠️  Nginx 服務未運行"
        fi
    else
        echo "❌ Nginx 配置有錯誤:"
        nginx -t 2>&1 | tail -5
    fi
else
    echo "ℹ️  Nginx 未安裝或不在 PATH 中"
fi
echo ""

# 最終總結
echo "=========================================="
if [ "$APP_RUNNING" -gt 0 ] && echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
    echo "✅ 修復完成！服務應該已恢復正常"
    echo ""
    echo "🌐 請測試網站訪問:"
    echo "   curl -I http://localhost:3000"
    echo "   或訪問 https://showartz.com"
else
    echo "⚠️  修復完成，但仍有問題需要檢查"
    echo ""
    echo "📋 請執行以下命令查看詳細資訊:"
    echo "   docker-compose logs app --tail=100"
    echo "   docker-compose ps"
    echo ""
    echo "💡 如果問題持續，請檢查:"
    echo "   1. 環境變數配置 (.env 文件)"
    echo "   2. 資料庫連接 (docker-compose logs postgres)"
    echo "   3. 系統資源 (df -h, free -h)"
    echo "   4. Nginx 配置和日誌"
fi
echo "=========================================="


