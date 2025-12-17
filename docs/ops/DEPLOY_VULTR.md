# Vultr 部署指南

本指南將協助您將 Showartz 專案部署到 Vultr VPS。

## 📋 前置需求

1. Vultr 帳號
2. 已創建的 VPS 實例（建議配置：2GB RAM 以上，Ubuntu 22.04 LTS）
3. SSH 存取權限
4. 域名（可選，用於 SSL）

## 🚀 部署步驟

### 步驟 1: 創建 Vultr VPS 實例

1. 登入 Vultr 控制台：https://my.vultr.com
2. 點擊「Deploy Server」
3. 選擇配置：
   - **Server Type**: Cloud Compute
   - **CPU & Storage**: 至少 2GB RAM
   - **Location**: 選擇最接近您的位置
   - **Operating System**: Ubuntu 22.04 LTS
   - **Server Hostname**: showartz（可自訂）
4. 點擊「Deploy Now」
5. 等待實例創建完成（約 1-2 分鐘）
6. 記錄下 IP 地址和 root 密碼

### 步驟 2: 連接到 VPS

使用 SSH 連接到您的 VPS：

```bash
ssh root@your-vps-ip
```

首次連接時會要求確認，輸入 `yes`。

### 步驟 3: 更新系統並安裝必要工具

```bash
# 更新系統
apt update && apt upgrade -y

# 安裝必要工具
apt install -y curl wget git ufw
```

### 步驟 4: 安裝 Docker 和 Docker Compose

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 將當前用戶加入 docker 群組（如果使用非 root 用戶）
usermod -aG docker $USER

# 安裝 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 驗證安裝
docker --version
docker-compose --version
```

### 步驟 5: 配置防火牆

```bash
# 允許 SSH
ufw allow 22/tcp

# 允許 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 啟用防火牆
ufw enable

# 檢查狀態
ufw status
```

### 步驟 6: 克隆專案

```bash
# 創建專案目錄
mkdir -p /opt/showartz
cd /opt/showartz

# 克隆倉庫
git clone https://github.com/howhowardchao/showartz.git .

# 或使用 SSH（如果已配置）
# git clone git@github.com:howhowardchao/showartz.git .
```

### 步驟 7: 配置環境變數

```bash
# 創建 .env 文件
nano .env
```

在 `.env` 文件中填入以下內容：

```env
# PostgreSQL 密碼（請更改為強密碼）
POSTGRES_PASSWORD=your_strong_password_here

# OpenAI 設定
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id

# Session Secret（請更改為隨機字串）
SESSION_SECRET=your_random_secret_here

# 管理員帳號
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!

# Node 環境
NODE_ENV=production
```

按 `Ctrl+X`，然後 `Y`，最後 `Enter` 儲存。

### 步驟 8: 啟動服務

```bash
# 構建並啟動容器
docker-compose up -d --build

# 查看日誌
docker-compose logs -f
```

等待構建完成（首次可能需要 5-10 分鐘）。

### 步驟 9: 初始化資料庫

```bash
# 等待資料庫就緒
sleep 10

# 初始化資料庫
docker-compose exec app npm run init-db
```

### 步驟 10: 驗證部署

```bash
# 檢查容器狀態
docker-compose ps

# 檢查應用日誌
docker-compose logs app

# 測試應用（應該返回 200）
curl http://localhost:3000
```

在瀏覽器中訪問：`http://your-vps-ip:3000`

## 🔒 配置 Nginx 反向代理（推薦）

### 安裝 Nginx

```bash
apt install -y nginx
```

### 創建 Nginx 配置

```bash
nano /etc/nginx/sites-available/showartz
```

貼上以下內容（將 `your-domain.com` 替換為您的域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 啟用站點

```bash
# 創建符號連結
ln -s /etc/nginx/sites-available/showartz /etc/nginx/sites-enabled/

# 測試配置
nginx -t

# 重載 Nginx
systemctl reload nginx
```

### 配置 SSL（使用 Let's Encrypt）

```bash
# 安裝 Certbot
apt install -y certbot python3-certbot-nginx

# 獲取 SSL 證書
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自動續期測試
certbot renew --dry-run
```

## 🔧 常用管理命令

### 查看日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看應用日誌
docker-compose logs -f app

# 查看資料庫日誌
docker-compose logs -f postgres
```

### 重啟服務

```bash
# 重啟所有服務
docker-compose restart

# 重啟應用
docker-compose restart app
```

### 更新應用

```bash
cd /opt/showartz

# 拉取最新代碼
git pull

# 重新構建並啟動
docker-compose up -d --build

# 重新初始化資料庫（如果需要）
docker-compose exec app npm run init-db
```

### 備份資料庫

```bash
# 創建備份
docker-compose exec postgres pg_dump -U showartz showartz > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢復備份
docker-compose exec -T postgres psql -U showartz showartz < backup_file.sql
```

### 停止服務

```bash
docker-compose down
```

### 完全移除（包括資料）

```bash
docker-compose down -v
```

## 🐛 故障排除

### 應用無法啟動

```bash
# 檢查容器狀態
docker-compose ps

# 查看詳細日誌
docker-compose logs app

# 檢查環境變數
docker-compose exec app env | grep -E "OPENAI|DATABASE|SESSION"
```

### 資料庫連接失敗

```bash
# 檢查資料庫容器
docker-compose ps postgres

# 檢查資料庫日誌
docker-compose logs postgres

# 測試資料庫連接
docker-compose exec app node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1', (err, res) => console.log(err || 'OK'))"
```

### 端口被佔用

```bash
# 檢查端口使用情況
netstat -tulpn | grep :3000

# 或使用 ss
ss -tulpn | grep :3000
```

### 記憶體不足

如果遇到記憶體不足的問題，可以：

1. 增加 VPS 的 RAM
2. 或調整 Docker 的資源限制

## 📝 後續步驟

1. **同步商品**：
   - 訪問後台：`http://your-domain.com/admin`
   - 使用管理員帳號登入
   - 點擊「同步 Pinkoi 商品」

2. **配置域名 DNS**：
   - 在域名註冊商處添加 A 記錄
   - 指向您的 VPS IP 地址

3. **設置自動備份**（可選）：
   - 使用 cron 定期備份資料庫
   - 或使用 Vultr 的備份功能

## 🔐 安全建議

1. **更改預設密碼**：確保所有預設密碼都已更改
2. **使用強密碼**：資料庫和管理員密碼應使用強密碼
3. **定期更新**：定期更新系統和 Docker 映像
4. **限制 SSH 訪問**：考慮使用 SSH 金鑰而非密碼
5. **啟用防火牆**：確保防火牆已正確配置
6. **定期備份**：設置自動備份機制

## 📞 需要幫助？

如果遇到問題，請檢查：
1. 容器日誌：`docker-compose logs`
2. 系統日誌：`journalctl -u docker`
3. Nginx 日誌：`/var/log/nginx/error.log`



