# 502 Bad Gateway 修復指南

## 快速修復步驟

### 方法 1: 一鍵部署和修復（最推薦）⭐

這個腳本會自動拉取最新代碼、重新構建並修復問題：

```bash
# SSH 連接到伺服器
ssh your-server

# 進入專案目錄
cd /opt/showartz  # 或您的專案路徑

# 執行一鍵部署修復腳本
bash scripts/deploy-and-fix.sh
```

**優點**：
- 自動拉取最新代碼
- 自動檢查環境變數
- 智能等待服務啟動
- 完整的狀態報告

### 方法 2: 使用自動修復腳本

如果只需要修復當前代碼的問題：

```bash
# SSH 連接到伺服器
ssh your-server

# 進入專案目錄
cd /opt/showartz  # 或您的專案路徑

# 執行修復腳本
bash scripts/fix-502.sh
```

### 方法 2: 手動修復步驟

#### 步驟 1: 診斷問題

```bash
cd /opt/showartz
bash scripts/diagnose-502.sh
```

#### 步驟 2: 檢查容器狀態

```bash
docker-compose ps
```

如果容器未運行或狀態異常，繼續下一步。

#### 步驟 3: 查看應用日誌

```bash
# 查看最後 50 行日誌
docker-compose logs app --tail=50

# 持續查看日誌（實時）
docker-compose logs -f app
```

常見錯誤：
- **資料庫連接失敗**: 檢查 `DATABASE_URL` 環境變數
- **構建失敗**: 檢查 Node.js 版本和依賴
- **端口衝突**: 檢查是否有其他服務占用 3000 端口

#### 步驟 4: 重新構建並啟動

```bash
# 停止所有容器
docker-compose down

# 清理舊的構建（可選，如果有問題）
docker-compose build --no-cache

# 重新構建並啟動
docker-compose up -d --build

# 等待 15-30 秒讓服務啟動
sleep 20

# 檢查狀態
docker-compose ps
docker-compose logs app --tail=30
```

#### 步驟 5: 驗證服務

```bash
# 測試本地連接
curl -I http://localhost:3000

# 應該返回 200 或 301/302 狀態碼
```

#### 步驟 6: 檢查 Nginx

```bash
# 測試 Nginx 配置
sudo nginx -t

# 如果配置正確，重新載入
sudo systemctl reload nginx

# 檢查 Nginx 錯誤日誌
sudo tail -20 /var/log/nginx/error.log
```

## 針對本次系統更新的特殊處理

### 問題 1: 型別錯誤導致構建失敗

如果構建時出現 TypeScript 錯誤：

```bash
# 在本地先驗證
npm run lint
npm run build

# 如果本地通過，在伺服器上重新構建
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

### 問題 2: Next.js Image 配置問題

如果出現圖片載入錯誤，檢查 `next.config.ts`：

```bash
# 確認 next.config.ts 已正確配置
cat next.config.ts

# 應該包含 images.remotePatterns 配置
```

### 問題 3: 環境變數缺失

檢查關鍵環境變數：

```bash
# 檢查 .env 文件
cat .env | grep -E "OPENAI_API_KEY|DATABASE_URL|SESSION_SECRET"

# 確認所有必要變數都存在
```

必要環境變數：
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `SESSION_SECRET` (可選，有預設值)
- `POSTGRES_PASSWORD` (Docker Compose 使用)

### 問題 4: 端口衝突

```bash
# 檢查 3000 端口是否被占用
sudo netstat -tuln | grep 3000
sudo lsof -i :3000

# 如果有其他服務占用，修改 docker-compose.yml 中的端口映射
# 例如改為 3001:3000，然後更新 Nginx 配置
```

### 問題 5: 資料庫連接問題

```bash
# 檢查資料庫容器
docker-compose ps postgres

# 測試資料庫連接
docker-compose exec app sh -c 'node -e "require(\"pg\").Pool({connectionString: process.env.DATABASE_URL}).query(\"SELECT 1\").then(() => console.log(\"OK\")).catch(e => console.error(e))"'

# 如果失敗，檢查 DATABASE_URL 格式
docker-compose exec app printenv DATABASE_URL
```

## 完整重置流程（最後手段）

如果以上方法都無效，執行完整重置：

```bash
cd /opt/showartz

# 1. 停止所有容器
docker-compose down

# 2. 備份重要數據（可選）
docker-compose exec postgres pg_dump -U showartz showartz > backup_$(date +%Y%m%d).sql

# 3. 清理舊的構建和卷（注意：這會刪除未持久化的數據）
docker-compose down -v
docker system prune -f

# 4. 拉取最新代碼
git pull origin main

# 5. 確認環境變數
cat .env

# 6. 重新構建
docker-compose build --no-cache

# 7. 啟動服務
docker-compose up -d

# 8. 等待啟動
sleep 30

# 9. 檢查日誌
docker-compose logs app --tail=50

# 10. 初始化資料庫（如果需要）
docker-compose exec app npm run init-db
```

## 驗證清單

修復後，確認以下項目：

- [ ] Docker 容器運行正常 (`docker-compose ps`)
- [ ] 應用日誌無錯誤 (`docker-compose logs app`)
- [ ] 本地端口 3000 可訪問 (`curl http://localhost:3000`)
- [ ] Nginx 配置正確 (`sudo nginx -t`)
- [ ] Nginx 錯誤日誌無新錯誤 (`sudo tail /var/log/nginx/error.log`)
- [ ] 網站可正常訪問 (`curl -I https://showartz.com`)
- [ ] 後台可正常訪問 (`curl -I https://showartz.com/admin`)

## 常見錯誤訊息對照

| 錯誤訊息 | 可能原因 | 解決方案 |
|---------|---------|---------|
| `ECONNREFUSED` | 資料庫未啟動 | `docker-compose up -d postgres` |
| `EADDRINUSE` | 端口被占用 | 檢查並停止占用端口的服務 |
| `Module not found` | 依賴未安裝 | `docker-compose build --no-cache` |
| `TypeError: Cannot read property` | 代碼錯誤 | 檢查日誌，回滾到上一個版本 |
| `502 Bad Gateway` | 應用未啟動 | 查看應用日誌，重新啟動容器 |

## 聯繫支援

如果問題持續存在，請提供以下資訊：

1. 完整的應用日誌：`docker-compose logs app > app.log`
2. Nginx 錯誤日誌：`sudo tail -50 /var/log/nginx/error.log`
3. 容器狀態：`docker-compose ps`
4. 系統資源：`df -h` 和 `free -h`

