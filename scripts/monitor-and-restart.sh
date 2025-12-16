#!/bin/bash

# 監控腳本 - 定期檢查應用狀態並在崩潰時自動重啟
# 可以添加到 crontab: */5 * * * * /opt/showartz/scripts/monitor-and-restart.sh

set +e

PROJECT_DIR="/opt/showartz"
if [ ! -d "$PROJECT_DIR" ]; then
    if [ -d "/home/$(whoami)/showartz" ]; then
        PROJECT_DIR="/home/$(whoami)/showartz"
    elif [ -d "$HOME/showartz" ]; then
        PROJECT_DIR="$HOME/showartz"
    else
        echo "❌ 錯誤: 找不到專案目錄"
        exit 1
    fi
fi

cd "$PROJECT_DIR" || {
    echo "❌ 錯誤: 無法進入專案目錄: $PROJECT_DIR"
    exit 1
}

# 檢查應用是否響應
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  應用未響應 (HTTP $HTTP_CODE)，嘗試重啟..."
    
    # 檢查容器狀態
    APP_STATUS=$(docker-compose ps app --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    
    if [ "$APP_STATUS" != "running" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 容器狀態: $APP_STATUS，重啟容器..."
        docker-compose restart app
        sleep 15
        
        # 再次檢查
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 應用已恢復"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 應用仍未響應，請手動檢查"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 查看日誌: docker-compose logs app --tail=50"
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 容器運行中但應用無響應，查看日誌..."
        docker-compose logs app --tail=20
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 應用正常運行"
fi

