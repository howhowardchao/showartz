#!/bin/bash

# 一鍵部署和修復腳本
# 自動拉取代碼、重新構建並修復 502 錯誤
# 使用方法: bash scripts/deploy-and-fix.sh

set +e

echo "🚀 開始一鍵部署和修復流程..."
echo ""

# 自動檢測專案目錄
PROJECT_DIR="/opt/showartz"
if [ ! -d "$PROJECT_DIR" ]; then
    if [ -d "/home/$(whoami)/showartz" ]; then
        PROJECT_DIR="/home/$(whoami)/showartz"
    elif [ -d "$HOME/showartz" ]; then
        PROJECT_DIR="$HOME/showartz"
    elif [ -d "./showartz" ]; then
        PROJECT_DIR="./showartz"
    else
        echo "❌ 錯誤: 找不到專案目錄"
        echo "請在專案目錄中執行此腳本"
        exit 1
    fi
fi

cd "$PROJECT_DIR" || {
    echo "❌ 錯誤: 無法進入專案目錄: $PROJECT_DIR"
    exit 1
}

echo "📁 專案目錄: $PROJECT_DIR"
echo ""

# 1. 拉取最新代碼
echo "=========================================="
echo "📥 步驟 1/4: 拉取最新代碼"
echo "=========================================="
if [ -d ".git" ]; then
    echo "正在從 GitHub 拉取最新代碼..."
    git fetch origin main
    git pull origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ 代碼更新成功"
        LATEST_COMMIT=$(git log -1 --oneline)
        echo "   最新提交: $LATEST_COMMIT"
    else
        echo "⚠️  Git pull 失敗，繼續使用現有代碼"
    fi
else
    echo "⚠️  未檢測到 Git 倉庫，跳過代碼更新"
fi
echo ""

# 2. 檢查環境變數
echo "=========================================="
echo "🔐 步驟 2/4: 檢查環境變數"
echo "=========================================="
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env.local" ]; then
        ENV_FILE=".env.local"
    else
        echo "❌ 錯誤: 找不到環境變數文件 (.env 或 .env.local)"
        echo "請確保環境變數已正確配置"
        exit 1
    fi
fi

echo "✅ 找到環境變數文件: $ENV_FILE"

# 檢查關鍵變數
MISSING_VARS=()
if ! grep -q "OPENAI_API_KEY" "$ENV_FILE" 2>/dev/null; then
    MISSING_VARS+=("OPENAI_API_KEY")
fi
if ! grep -q "DATABASE_URL\|POSTGRES_PASSWORD" "$ENV_FILE" 2>/dev/null; then
    MISSING_VARS+=("DATABASE_URL 或 POSTGRES_PASSWORD")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  警告: 以下環境變數可能缺失:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo "   請確認這些變數已正確配置"
else
    echo "✅ 關鍵環境變數已配置"
fi
echo ""

# 3. 停止並重新構建
echo "=========================================="
echo "🔨 步驟 3/4: 重新構建容器"
echo "=========================================="
echo "停止現有容器..."
docker-compose down

echo ""
echo "清理舊的構建（可選，會更慢但更乾淨）..."
read -t 5 -p "是否清理構建緩存？(y/N，5秒後自動跳過): " CLEAN_BUILD
if [[ "$CLEAN_BUILD" =~ ^[Yy]$ ]]; then
    echo "執行完整清理構建..."
    docker-compose build --no-cache
else
    echo "執行增量構建..."
    docker-compose build
fi

echo ""
echo "啟動容器..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 容器啟動失敗！"
    echo "查看錯誤日誌:"
    docker-compose logs --tail=50
    exit 1
fi

echo "✅ 容器已啟動"
echo ""

# 4. 等待並驗證
echo "=========================================="
echo "⏳ 步驟 4/4: 等待服務就緒並驗證"
echo "=========================================="

# 等待資料庫
echo "等待資料庫啟動..."
for i in {1..15}; do
    if docker-compose exec -T postgres pg_isready -U showartz >/dev/null 2>&1; then
        echo "✅ 資料庫已就緒"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "⚠️  資料庫啟動超時，但繼續檢查應用"
    else
        echo "   等待中... ($i/15)"
        sleep 2
    fi
done

# 等待應用
echo ""
echo "等待應用啟動..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
        echo "✅ 應用已響應 (HTTP $HTTP_CODE)"
        break
    fi
    if [ $WAITED -eq 0 ]; then
        echo "   等待應用啟動..."
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    if [ $((WAITED % 15)) -eq 0 ]; then
        echo "   已等待 ${WAITED} 秒..."
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  應用啟動超時，檢查日誌..."
    docker-compose logs app --tail=30
fi

echo ""
echo "=========================================="
echo "📊 最終狀態檢查"
echo "=========================================="
echo ""

# 容器狀態
echo "容器狀態:"
docker-compose ps
echo ""

# 連接測試
echo "連接測試:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if echo "$HTTP_CODE" | grep -qE "200|301|302|404"; then
    echo "✅ 本地連接成功 (HTTP $HTTP_CODE)"
    echo ""
    echo "🎉 部署完成！服務應該已恢復正常"
    echo ""
    echo "🌐 請測試網站訪問:"
    echo "   https://showartz.com"
else
    echo "❌ 本地連接失敗 (HTTP $HTTP_CODE)"
    echo ""
    echo "📋 請查看詳細日誌:"
    echo "   docker-compose logs app --tail=100"
    echo ""
    echo "💡 如果問題持續，請執行:"
    echo "   bash scripts/diagnose-502.sh"
fi

echo ""
echo "=========================================="

