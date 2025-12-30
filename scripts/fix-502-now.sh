#!/bin/bash

# 502 錯誤快速修復腳本
# 使用方式: 在 VPS 上執行: bash scripts/fix-502-now.sh

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}502 Bad Gateway 診斷與修復${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}錯誤: 請在專案根目錄執行此腳本${NC}"
    exit 1
fi

# 步驟 1: 檢查容器狀態
echo -e "${YELLOW}步驟 1/6: 檢查容器狀態...${NC}"
docker-compose ps
echo ""

# 步驟 2: 檢查應用日誌
echo -e "${YELLOW}步驟 2/6: 檢查應用日誌（最後 50 行）...${NC}"
docker-compose logs app --tail=50
echo ""

# 步驟 3: 檢查應用是否在運行
echo -e "${YELLOW}步驟 3/6: 檢查應用健康狀態...${NC}"
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 應用健康檢查通過${NC}"
else
    echo -e "${RED}✗ 應用無法訪問，嘗試重啟...${NC}"
    
    # 步驟 4: 重啟容器
    echo -e "${YELLOW}步驟 4/6: 重啟應用容器...${NC}"
    docker-compose restart app
    echo -e "${GREEN}✓ 容器已重啟${NC}"
    
    # 等待服務啟動
    echo -e "${YELLOW}等待服務啟動（15 秒）...${NC}"
    sleep 15
    
    # 再次檢查
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 應用已恢復正常${NC}"
    else
        echo -e "${RED}✗ 應用仍無法訪問，檢查詳細日誌...${NC}"
        echo ""
        echo "最近的錯誤日誌:"
        docker-compose logs app --tail=100 | grep -i error || echo "未發現明顯錯誤"
        echo ""
        
        # 步驟 5: 完全重建
        echo -e "${YELLOW}步驟 5/6: 嘗試完全重建容器...${NC}"
        docker-compose down
        docker-compose up -d --build
        echo -e "${GREEN}✓ 容器已重建${NC}"
        
        echo -e "${YELLOW}等待服務啟動（20 秒）...${NC}"
        sleep 20
        
        # 最終檢查
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 應用已恢復正常${NC}"
        else
            echo -e "${RED}✗ 應用仍無法訪問，請檢查以下項目:${NC}"
            echo "  1. 環境變數是否正確配置"
            echo "  2. 資料庫連接是否正常"
            echo "  3. 端口 3000 是否被佔用"
            echo "  4. 查看完整日誌: docker-compose logs app"
        fi
    fi
fi
echo ""

# 步驟 6: 檢查 Nginx 狀態
echo -e "${YELLOW}步驟 6/6: 檢查 Nginx 狀態...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx 正在運行${NC}"
    
    # 檢查 Nginx 錯誤日誌
    echo "Nginx 錯誤日誌（最後 10 行）:"
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "無法讀取 Nginx 日誌"
    
    # 重載 Nginx 配置
    echo ""
    echo "重載 Nginx 配置..."
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx 配置已重載${NC}"
else
    echo -e "${YELLOW}⚠ Nginx 未運行或未安裝${NC}"
fi
echo ""

# 最終狀態檢查
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}診斷完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📋 檢查項目:"
echo "  1. 容器狀態:"
docker-compose ps
echo ""
echo "  2. 應用健康檢查:"
curl -I http://localhost:3000/api/health 2>&1 | head -3
echo ""
echo "  3. 訪問網站: https://showartz.com"
echo ""

