#!/bin/bash

# Showartz 部署到 Vultr 腳本
# IP: 45.63.123.237

set -e

echo "🚀 開始部署 Showartz 到 Vultr (45.63.123.237)..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/showartz"
VPS_IP="45.63.123.237"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Showartz 部署腳本${NC}"
echo -e "${BLUE}  VPS IP: ${VPS_IP}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 請使用 root 權限執行此腳本${NC}"
    echo "使用: sudo bash $0"
    exit 1
fi

# 步驟 1: 更新系統
echo -e "${GREEN}[1/8] 更新系統套件...${NC}"
apt update && apt upgrade -y

# 步驟 2: 安裝必要工具
echo -e "${GREEN}[2/8] 安裝必要工具...${NC}"
apt install -y curl wget git ufw nano

# 步驟 3: 安裝 Docker
echo -e "${GREEN}[3/8] 安裝 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker 安裝完成${NC}"
else
    echo -e "${YELLOW}ℹ️  Docker 已安裝${NC}"
fi

# 步驟 4: 安裝 Docker Compose
echo -e "${GREEN}[4/8] 安裝 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose 安裝完成${NC}"
else
    echo -e "${YELLOW}ℹ️  Docker Compose 已安裝${NC}"
fi

# 驗證安裝
docker --version
docker-compose --version

# 步驟 5: 配置防火牆
echo -e "${GREEN}[5/8] 配置防火牆...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable
echo -e "${GREEN}✅ 防火牆配置完成${NC}"

# 步驟 6: 創建專案目錄並克隆倉庫
echo -e "${GREEN}[6/8] 克隆專案...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

if [ -d ".git" ]; then
    echo -e "${YELLOW}ℹ️  專案已存在，更新中...${NC}"
    git pull
else
    echo -e "${GREEN}正在克隆倉庫...${NC}"
    git clone https://github.com/howhowardchao/showartz.git .
fi

# 步驟 7: 配置環境變數
echo -e "${GREEN}[7/8] 配置環境變數...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}創建 .env 文件...${NC}"
    cat > .env << 'ENVEOF'
# PostgreSQL 密碼（請更改為強密碼）
POSTGRES_PASSWORD=Showartz2024!SecurePass

# OpenAI 設定（請填入您的 API Key）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here

# Session Secret
SESSION_SECRET=Showartz2024SessionSecretKeyChangeThis

# 管理員帳號
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!

# Node 環境
NODE_ENV=production
ENVEOF
    echo -e "${YELLOW}⚠️  已創建 .env 文件，請編輯並填入 OpenAI API Key：${NC}"
    echo ""
    echo "執行: nano $PROJECT_DIR/.env"
    echo ""
    read -p "編輯完成後按 Enter 繼續..."
else
    echo -e "${YELLOW}ℹ️  .env 文件已存在${NC}"
    echo -e "${YELLOW}請確認已填入正確的 OpenAI API Key${NC}"
    read -p "確認後按 Enter 繼續..."
fi

# 步驟 8: 構建並啟動服務
echo -e "${GREEN}[8/8] 構建並啟動服務...${NC}"
echo -e "${YELLOW}這可能需要 5-10 分鐘，請耐心等待...${NC}"
docker-compose up -d --build

# 等待服務就緒
echo -e "${GREEN}等待服務啟動...${NC}"
sleep 20

# 檢查服務狀態
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "服務狀態："
docker-compose ps
echo ""

# 初始化資料庫
echo -e "${GREEN}初始化資料庫...${NC}"
docker-compose exec -T app npm run init-db || {
    echo -e "${YELLOW}資料庫初始化可能需要更多時間${NC}"
    echo "請稍後手動執行: docker-compose exec app npm run init-db"
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "訪問資訊："
echo "  🌐 網站: http://${VPS_IP}:3000"
echo "  🔐 後台: http://${VPS_IP}:3000/admin"
echo "    帳號: Showartzadmin"
echo "    密碼: #@o09sfg!"
echo ""
echo "常用命令："
echo "  查看日誌: docker-compose logs -f"
echo "  重啟服務: docker-compose restart"
echo "  停止服務: docker-compose down"
echo "  查看狀態: docker-compose ps"
echo ""

