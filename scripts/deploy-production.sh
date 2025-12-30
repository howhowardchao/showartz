#!/bin/bash

# 部署腳本 - 更新生產環境到最新版本
# 使用方式: 在 VPS 上執行: bash scripts/deploy-production.sh

set -e  # 遇到錯誤立即退出

echo "🚀 開始部署 Showartz 到生產環境..."
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}錯誤: 請在專案根目錄執行此腳本${NC}"
    exit 1
fi

# 步驟 1: 拉取最新代碼
echo -e "${YELLOW}步驟 1/6: 拉取最新代碼...${NC}"
git pull origin main
echo -e "${GREEN}✓ 代碼更新完成${NC}"
echo ""

# 步驟 2: 檢查環境變數
echo -e "${YELLOW}步驟 2/6: 檢查環境變數...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}錯誤: .env 文件不存在，請先創建並配置環境變數${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 環境變數文件存在${NC}"
echo ""

# 步驟 3: 停止現有容器
echo -e "${YELLOW}步驟 3/6: 停止現有容器...${NC}"
docker-compose down
echo -e "${GREEN}✓ 容器已停止${NC}"
echo ""

# 步驟 4: 重新構建並啟動
echo -e "${YELLOW}步驟 4/6: 重新構建並啟動容器（這可能需要 1-2 分鐘）...${NC}"
docker-compose up -d --build
echo -e "${GREEN}✓ 容器已啟動${NC}"
echo ""

# 步驟 5: 等待服務就緒
echo -e "${YELLOW}步驟 5/6: 等待服務就緒...${NC}"
sleep 10
echo -e "${GREEN}✓ 等待完成${NC}"
echo ""

# 步驟 6: 檢查服務狀態
echo -e "${YELLOW}步驟 6/6: 檢查服務狀態...${NC}"
echo ""
echo "容器狀態:"
docker-compose ps
echo ""

# 檢查應用健康狀態
echo "檢查應用健康狀態..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 應用健康檢查通過${NC}"
else
    echo -e "${YELLOW}⚠ 應用可能還在啟動中，請稍後檢查${NC}"
fi
echo ""

# 顯示日誌（最後 20 行）
echo "應用日誌（最後 20 行）:"
docker-compose logs app --tail=20
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 後續檢查:"
echo "  1. 訪問網站: https://showartz.com"
echo "  2. 檢查後台: https://showartz.com/admin"
echo "  3. 查看完整日誌: docker-compose logs -f app"
echo ""

