#!/bin/bash

# Showartz Vultr 部署腳本
# 此腳本會自動完成大部分部署步驟

set -e

echo "🚀 開始部署 Showartz 到 Vultr..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}請使用 root 權限執行此腳本${NC}"
    exit 1
fi

# 步驟 1: 更新系統
echo -e "${GREEN}[1/10] 更新系統...${NC}"
apt update && apt upgrade -y

# 步驟 2: 安裝必要工具
echo -e "${GREEN}[2/10] 安裝必要工具...${NC}"
apt install -y curl wget git ufw

# 步驟 3: 安裝 Docker
echo -e "${GREEN}[3/10] 安裝 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker 已安裝"
fi

# 步驟 4: 安裝 Docker Compose
echo -e "${GREEN}[4/10] 安裝 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose 已安裝"
fi

# 步驟 5: 配置防火牆
echo -e "${GREEN}[5/10] 配置防火牆...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 步驟 6: 創建專案目錄
echo -e "${GREEN}[6/10] 創建專案目錄...${NC}"
PROJECT_DIR="/opt/showartz"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 步驟 7: 檢查是否已克隆倉庫
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}請先克隆倉庫：${NC}"
    echo "git clone https://github.com/howhowardchao/showartz.git ."
    echo "或使用 SSH："
    echo "git clone git@github.com:howhowardchao/showartz.git ."
    echo ""
    read -p "按 Enter 繼續（假設已手動克隆）..."
fi

# 步驟 8: 檢查環境變數文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[7/10] 創建環境變數文件...${NC}"
    cat > .env << EOF
# PostgreSQL 密碼（請更改為強密碼）
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# OpenAI 設定（請填入您的 API Key）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here

# Session Secret
SESSION_SECRET=$(openssl rand -base64 32)

# 管理員帳號
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!

# Node 環境
NODE_ENV=production
EOF
    echo -e "${YELLOW}已創建 .env 文件，請編輯並填入 OpenAI API Key：${NC}"
    echo "nano $PROJECT_DIR/.env"
    read -p "編輯完成後按 Enter 繼續..."
else
    echo -e "${GREEN}[7/10] 環境變數文件已存在${NC}"
fi

# 步驟 9: 構建並啟動服務
echo -e "${GREEN}[8/10] 構建並啟動服務...${NC}"
docker-compose up -d --build

# 步驟 10: 等待服務就緒
echo -e "${GREEN}[9/10] 等待服務就緒...${NC}"
sleep 15

# 步驟 11: 初始化資料庫
echo -e "${GREEN}[10/10] 初始化資料庫...${NC}"
docker-compose exec -T app npm run init-db || echo -e "${YELLOW}資料庫初始化可能需要更多時間，請稍後手動執行：${NC} docker-compose exec app npm run init-db"

# 完成
echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "下一步："
echo "1. 檢查服務狀態: docker-compose ps"
echo "2. 查看日誌: docker-compose logs -f"
echo "3. 訪問應用: http://$(hostname -I | awk '{print $1}'):3000"
echo "4. 訪問後台: http://$(hostname -I | awk '{print $1}'):3000/admin"
echo ""
echo "如需配置 Nginx 和 SSL，請參考 DEPLOY_VULTR.md"



