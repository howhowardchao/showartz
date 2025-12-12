# Vultr 部署步驟 - IP: 45.63.123.237

## 📋 部署前準備

請確保您已經：
- [x] 創建 Vultr VPS（IP: 45.63.123.237）
- [ ] 可以 SSH 連接到 VPS
- [ ] 知道 root 密碼或已配置 SSH 金鑰

## 🚀 快速部署（推薦）

### 方法 1: 使用自動化腳本

1. **SSH 連接到 VPS**：
   ```bash
   ssh root@45.63.123.237
   ```

2. **下載並執行部署腳本**：
   ```bash
   # 下載腳本
   curl -o /tmp/deploy.sh https://raw.githubusercontent.com/howhowardchao/showartz/main/scripts/deploy-to-vultr.sh
   
   # 或直接執行（如果已克隆倉庫）
   cd /opt
   git clone https://github.com/howhowardchao/showartz.git
   cd showartz
   chmod +x scripts/deploy-to-vultr.sh
   ./scripts/deploy-to-vultr.sh
   ```

3. **配置環境變數**：
   腳本會提示您編輯 `.env` 文件，請填入：
   ```bash
   nano /opt/showartz/.env
   ```
   
   必須填入的值：
   - `OPENAI_API_KEY`: 您的 OpenAI API Key
   - `OPENAI_ASSISTANT_ID`: 您的 Assistant ID
   - `POSTGRES_PASSWORD`: 強密碼（建議更改）
   - `SESSION_SECRET`: 隨機字串（建議更改）

4. **完成部署**：
   腳本會自動完成剩餘步驟。

### 方法 2: 手動部署

#### 步驟 1: 連接到 VPS
```bash
ssh root@45.63.123.237
```

#### 步驟 2: 更新系統並安裝工具
```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw nano
```

#### 步驟 3: 安裝 Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
```

#### 步驟 4: 安裝 Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 步驟 5: 配置防火牆
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable
```

#### 步驟 6: 克隆專案
```bash
mkdir -p /opt/showartz
cd /opt/showartz
git clone https://github.com/howhowardchao/showartz.git .
```

#### 步驟 7: 創建環境變數文件
```bash
nano .env
```

貼上以下內容（**請修改 OpenAI 相關的值**）：
```env
POSTGRES_PASSWORD=Showartz2024!SecurePass
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here
SESSION_SECRET=Showartz2024SessionSecretKeyChangeThis
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!
NODE_ENV=production
```

#### 步驟 8: 啟動服務
```bash
docker-compose up -d --build
```

#### 步驟 9: 等待服務就緒並初始化資料庫
```bash
# 等待 20 秒
sleep 20

# 初始化資料庫
docker-compose exec app npm run init-db
```

#### 步驟 10: 驗證部署
```bash
# 檢查服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 測試訪問
curl http://localhost:3000
```

## ✅ 部署後檢查

1. **檢查服務狀態**：
   ```bash
   docker-compose ps
   ```
   應該看到 `showartz-app` 和 `showartz-postgres` 都在運行。

2. **訪問網站**：
   - 網站：http://45.63.123.237:3000
   - 後台：http://45.63.123.237:3000/admin
   - 帳號：Showartzadmin
   - 密碼：#@o09sfg!

3. **檢查日誌**（如有問題）：
   ```bash
   docker-compose logs app
   docker-compose logs postgres
   ```

## 🔧 常用管理命令

```bash
# 進入專案目錄
cd /opt/showartz

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
docker-compose logs -f app
docker-compose logs -f postgres

# 重啟服務
docker-compose restart
docker-compose restart app

# 停止服務
docker-compose down

# 更新應用
git pull
docker-compose up -d --build

# 進入容器
docker-compose exec app sh
docker-compose exec postgres psql -U showartz -d showartz
```

## 🐛 故障排除

### 問題 1: 服務無法啟動
```bash
# 檢查日誌
docker-compose logs app

# 檢查環境變數
docker-compose exec app env | grep -E "OPENAI|DATABASE"
```

### 問題 2: 資料庫連接失敗
```bash
# 檢查資料庫狀態
docker-compose ps postgres

# 檢查資料庫日誌
docker-compose logs postgres

# 測試連接
docker-compose exec postgres psql -U showartz -d showartz -c "SELECT 1;"
```

### 問題 3: 端口被佔用
```bash
# 檢查端口
netstat -tulpn | grep 3000

# 或修改 docker-compose.yml 中的端口映射
```

### 問題 4: 記憶體不足
如果遇到記憶體問題，可以：
- 增加 VPS 的 RAM
- 或重啟服務：`docker-compose restart`

## 📝 下一步

1. **同步商品**：
   - 訪問後台：http://45.63.123.237:3000/admin
   - 登入後點擊「同步 Pinkoi 商品」

2. **配置域名**（可選）：
   - 參考 `DEPLOY_VULTR.md` 中的 Nginx 配置步驟

3. **設置 SSL**（可選）：
   - 使用 Let's Encrypt 配置 HTTPS

## 🔐 安全建議

1. **更改預設密碼**：部署後立即更改所有預設密碼
2. **保護 .env 文件**：確保 `.env` 文件權限正確（600）
   ```bash
   chmod 600 /opt/showartz/.env
   ```
3. **定期備份**：設置資料庫自動備份
4. **更新系統**：定期更新系統和 Docker 映像


