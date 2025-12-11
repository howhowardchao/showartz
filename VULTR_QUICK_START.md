# Vultr 快速部署指南

## 🚀 快速開始（5 分鐘）

### 1. 創建 Vultr VPS
- 登入：https://my.vultr.com
- 選擇：Ubuntu 22.04 LTS，至少 2GB RAM
- 記錄 IP 地址和 root 密碼

### 2. 連接到 VPS
```bash
ssh root@your-vps-ip
```

### 3. 執行自動部署腳本
```bash
# 下載並執行部署腳本
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/howhowardchao/showartz/main/scripts/deploy-vultr.sh
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

或手動執行：

```bash
# 克隆倉庫
cd /opt
git clone https://github.com/howhowardchao/showartz.git
cd showartz

# 執行部署腳本
chmod +x scripts/deploy-vultr.sh
./scripts/deploy-vultr.sh
```

### 4. 配置環境變數
腳本會自動創建 `.env` 文件，您需要編輯它：

```bash
nano /opt/showartz/.env
```

填入以下內容（**重要**：請更改這些值）：

```env
POSTGRES_PASSWORD=your_strong_password_here
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id
SESSION_SECRET=your_random_secret_here
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!
NODE_ENV=production
```

### 5. 啟動服務
```bash
cd /opt/showartz
docker-compose up -d --build
```

### 6. 初始化資料庫
```bash
# 等待 15 秒讓資料庫就緒
sleep 15

# 初始化資料庫
docker-compose exec app npm run init-db
```

### 7. 訪問應用
- 網站：http://your-vps-ip:3000
- 後台：http://your-vps-ip:3000/admin
  - 帳號：Showartzadmin
  - 密碼：#@o09sfg!

## 📋 部署檢查清單

- [ ] VPS 已創建並運行
- [ ] SSH 連接成功
- [ ] Docker 和 Docker Compose 已安裝
- [ ] 專案已克隆到 `/opt/showartz`
- [ ] `.env` 文件已配置（包含所有必要的環境變數）
- [ ] 服務已啟動（`docker-compose ps` 顯示所有容器運行中）
- [ ] 資料庫已初始化
- [ ] 可以訪問網站（http://your-vps-ip:3000）
- [ ] 可以登入後台
- [ ] 防火牆已配置（端口 22, 80, 443 開放）

## 🔧 常用命令

```bash
# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 更新應用
cd /opt/showartz
git pull
docker-compose up -d --build
```

## 🌐 配置域名（可選）

如果您有域名，可以配置 Nginx 反向代理和 SSL：

```bash
# 安裝 Nginx
apt install -y nginx certbot python3-certbot-nginx

# 創建配置（替換 your-domain.com）
cat > /etc/nginx/sites-available/showartz << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 啟用站點
ln -s /etc/nginx/sites-available/showartz /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 配置 SSL
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## ⚠️ 重要提醒

1. **更改預設密碼**：部署後請立即更改所有預設密碼
2. **保護 API Key**：確保 `.env` 文件不被公開
3. **定期備份**：設置資料庫自動備份
4. **監控資源**：定期檢查 VPS 的 CPU 和記憶體使用情況

## 🆘 遇到問題？

1. 檢查日誌：`docker-compose logs -f`
2. 檢查容器狀態：`docker-compose ps`
3. 檢查端口：`netstat -tulpn | grep 3000`
4. 查看詳細指南：`DEPLOY_VULTR.md`

