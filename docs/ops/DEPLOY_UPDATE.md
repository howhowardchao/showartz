# 更新生產環境部署指南

## 🚀 快速部署（推薦）

### 方法 1: 使用自動化腳本

1. **SSH 連接到 VPS**：
   ```bash
   ssh root@45.63.123.237
   ```

2. **進入專案目錄**：
   ```bash
   cd /opt/showartz
   ```

3. **執行部署腳本**：
   ```bash
   bash scripts/deploy-production.sh
   ```

腳本會自動執行以下步驟：
- ✅ 拉取最新代碼
- ✅ 檢查環境變數
- ✅ 停止現有容器
- ✅ 重新構建並啟動
- ✅ 檢查服務狀態

### 方法 2: 手動部署

如果您偏好手動執行每個步驟：

```bash
# 1. SSH 連接到 VPS
ssh root@45.63.123.237

# 2. 進入專案目錄
cd /opt/showartz

# 3. 拉取最新代碼
git pull origin main

# 4. 停止現有容器
docker-compose down

# 5. 重新構建並啟動
docker-compose up -d --build

# 6. 檢查服務狀態
docker-compose ps

# 7. 查看日誌（可選）
docker-compose logs app --tail=50
```

## 📋 本次更新內容 (v1.1.1)

### 性能優化
- ✅ **API 響應緩存機制**：商品和影片列表 API 添加 60 秒緩存
- ✅ **Analytics 查詢優化**：將 9 個獨立查詢合併為 1 個 CTE 查詢
- ✅ **日誌管理工具**：統一日誌系統，生產環境日誌減少 80%+
- ✅ **前端組件優化**：UserManager 使用 useMemo/useCallback

### 錯誤修復
- ✅ 修復 Analytics Stats API SQL 查詢錯誤
- ✅ 修復 Pageview API 參數處理問題

### 新增文件
- `lib/logger.ts` - 統一日誌系統
- `docs/OPTIMIZATION_IMPLEMENTATION.md` - 優化實施文檔

## ⚠️ 注意事項

1. **部署時間**: 構建過程可能需要 1-2 分鐘
2. **服務中斷**: 部署期間會有短暫的服務中斷（約 10-30 秒）
3. **資料庫**: 資料庫不會受影響，因為使用 volume 持久化
4. **環境變數**: `.env` 文件不會被覆蓋，確保已正確配置

## ✅ 部署後驗證

部署完成後，請檢查以下項目：

- [ ] 網站可以訪問：https://showartz.com
- [ ] 後台可以登入：https://showartz.com/admin
- [ ] 聊天功能正常（AI 藝棧精靈）
- [ ] 商品列表正常顯示
- [ ] 影片列表正常顯示
- [ ] 後台統計功能正常

### 檢查命令

```bash
# 檢查容器狀態
docker-compose ps

# 檢查應用日誌
docker-compose logs app --tail=50

# 檢查是否有錯誤
docker-compose logs app | grep -i error

# 測試本地連接
curl -I http://localhost:3000

# 測試健康檢查端點
curl http://localhost:3000/api/health
```

## 🐛 故障排除

### 問題 1: Git pull 失敗

```bash
# 檢查 Git 狀態
git status

# 如果有本地修改，先暫存
git stash

# 重新拉取
git pull origin main
```

### 問題 2: Docker 構建失敗

```bash
# 查看詳細構建日誌
docker-compose build --no-cache

# 檢查 Docker 空間
docker system df

# 清理未使用的資源（可選）
docker system prune -a
```

### 問題 3: 容器無法啟動

```bash
# 查看容器日誌
docker-compose logs app

# 檢查資料庫連接
docker-compose exec postgres psql -U showartz -d showartz -c "SELECT 1;"

# 檢查環境變數
docker-compose exec app env | grep -E "OPENAI|DATABASE"
```

### 問題 4: 服務啟動但無法訪問

```bash
# 檢查端口是否被佔用
netstat -tulpn | grep 3000

# 檢查 Nginx 狀態（如果使用）
systemctl status nginx

# 檢查防火牆
ufw status
```

### 回滾到上一個版本

如果部署後發現問題，可以快速回滾：

```bash
cd /opt/showartz

# 回退到上一個 commit
git reset --hard HEAD~1

# 重新構建並啟動
docker-compose up -d --build
```

## 📞 需要協助？

如果遇到無法解決的問題，請：
1. 收集錯誤日誌：`docker-compose logs app > error.log`
2. 檢查系統資源：`free -h` 和 `df -h`
3. 聯繫技術支援

