#!/bin/bash

# 遠端部署腳本 - 通過 SSH 執行部署
# 使用方式: bash scripts/deploy-remote.sh [VPS_IP] [SSH_USER]
# 範例: bash scripts/deploy-remote.sh 45.63.123.237 root

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 參數設定
VPS_IP="${1:-45.63.123.237}"
SSH_USER="${2:-root}"
PROJECT_DIR="/opt/showartz"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}遠端部署 Showartz 到生產環境${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "VPS IP: ${YELLOW}${VPS_IP}${NC}"
echo -e "SSH 用戶: ${YELLOW}${SSH_USER}${NC}"
echo -e "專案目錄: ${YELLOW}${PROJECT_DIR}${NC}"
echo ""

# 檢查 SSH 連接
echo -e "${YELLOW}檢查 SSH 連接...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${SSH_USER}@${VPS_IP}" "echo 'SSH 連接成功'" 2>/dev/null; then
    echo -e "${RED}錯誤: 無法連接到 ${SSH_USER}@${VPS_IP}${NC}"
    echo -e "${YELLOW}提示: 請確保 SSH 金鑰已配置，或手動輸入密碼${NC}"
    echo ""
    echo "執行以下命令進行部署:"
    echo "  ssh ${SSH_USER}@${VPS_IP} 'cd ${PROJECT_DIR} && bash scripts/deploy-production.sh'"
    exit 1
fi

echo -e "${GREEN}✓ SSH 連接成功${NC}"
echo ""

# 執行遠端部署
echo -e "${YELLOW}開始遠端部署...${NC}"
echo ""

ssh -t "${SSH_USER}@${VPS_IP}" << 'ENDSSH'
cd /opt/showartz
bash scripts/deploy-production.sh
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}遠端部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"

