# 502 Bad Gateway 問題分析與修復

## 問題分析

### 根本原因

網站隔一天後顯示 502 Bad Gateway 的主要原因是：

1. **未捕獲的異常導致應用崩潰**
   - 應用在處理外部 HTTP 請求（爬蟲腳本）時遇到連接超時
   - 錯誤：`Error: connect ETIMEDOUT 5.255.121.141:80` 和 `94.154.35.154:80`
   - 這些未捕獲的異常導致 Node.js 進程崩潰

2. **未處理的 Promise Rejection**
   - Puppeteer 的 `page.on('response')` 監聽器使用了 `async` 函數
   - 當異步操作失敗時，如果沒有正確處理，會產生未處理的 Promise rejection
   - 這會導致應用崩潰

3. **容器運行但應用無響應**
   - Docker 容器狀態顯示 "Up"，但應用進程已崩潰
   - 導致 Nginx 反向代理無法連接到後端應用

### 診斷結果

從伺服器日誌中發現：
- 容器狀態：`Up 16 hours`（容器運行中）
- 應用狀態：無法響應 HTTP 請求（curl 超時）
- 錯誤日誌：大量的 `uncaughtException` 和 `ETIMEDOUT` 錯誤

## 修復方案

### 1. 添加全局錯誤處理器 ✅

創建了 `instrumentation.ts`，添加了：
- `uncaughtException` 處理器：捕獲所有未捕獲的異常
- `unhandledRejection` 處理器：捕獲所有未處理的 Promise rejection
- `warning` 處理器：記錄警告信息

**效果**：防止未捕獲的異常導致應用立即崩潰，改為記錄錯誤並繼續運行。

### 2. 改進爬蟲腳本的錯誤處理 ✅

修復了 `lib/shopee-scraper.ts` 和 `lib/pinkoi-scraper.ts`：
- 將 Puppeteer `page.on('response')` 的 `async` 回調改為使用立即執行的 async 函數
- 添加多層錯誤捕獲，確保所有 Promise 都被正確處理
- 防止未處理的 Promise rejection 導致應用崩潰

**效果**：即使爬蟲遇到網絡錯誤，也不會導致應用崩潰。

### 3. 添加健康檢查端點 ✅

創建了 `app/api/health/route.ts`：
- 檢查資料庫連接狀態
- 返回應用健康狀態（uptime、內存使用等）
- 用於 Docker 健康檢查和監控

**效果**：可以主動監控應用狀態，及時發現問題。

### 4. 改進 Docker 配置 ✅

更新了 `docker-compose.yml`：
- 添加應用健康檢查（每 30 秒檢查一次）
- 添加日誌限制（每個文件 10MB，保留 3 個文件）
- 添加資源限制（內存限制 1GB）
- 移除過時的 `version` 字段

**效果**：
- Docker 可以自動檢測應用健康狀態
- 防止日誌文件佔滿磁盤
- 防止應用使用過多資源

### 5. 添加監控腳本 ✅

創建了 `scripts/monitor-and-restart.sh`：
- 每 5 分鐘檢查一次應用健康狀態
- 如果應用無響應，自動重啟容器
- 可以添加到 crontab 實現自動監控

**效果**：即使應用崩潰，也會自動恢復。

## 部署步驟

### 1. 提交並推送代碼

```bash
git add .
git commit -m "fix: 修復 502 錯誤 - 添加全局錯誤處理和健康檢查"
git push origin main
```

### 2. 在伺服器上拉取並部署

```bash
ssh root@45.63.123.237
cd /opt/showartz
git pull origin main
docker-compose down
docker-compose up -d --build
```

### 3. 驗證修復

```bash
# 檢查容器狀態
docker-compose ps

# 檢查健康狀態
curl http://localhost:3000/api/health

# 查看應用日誌
docker-compose logs app --tail=50
```

### 4. 設置自動監控（可選）

```bash
# 添加到 crontab（每 5 分鐘檢查一次）
crontab -e

# 添加這一行：
*/5 * * * * /opt/showartz/scripts/monitor-and-restart.sh >> /var/log/showartz-monitor.log 2>&1
```

## 預防措施

1. **定期檢查日誌**：查看是否有異常錯誤
2. **監控應用健康狀態**：使用 `/api/health` 端點
3. **設置資源警報**：監控內存和磁盤使用
4. **定期更新**：保持系統和依賴項更新

## 預期效果

修復後的預期效果：
- ✅ 應用不會因為未捕獲的異常而崩潰
- ✅ 爬蟲腳本的錯誤不會導致應用停止
- ✅ Docker 可以自動檢測應用健康狀態
- ✅ 監控腳本可以在應用崩潰時自動重啟
- ✅ 日誌不會無限制增長

## 相關文件

- `instrumentation.ts` - 全局錯誤處理器
- `app/api/health/route.ts` - 健康檢查端點
- `docker-compose.yml` - Docker 配置（已更新）
- `lib/shopee-scraper.ts` - Shopee 爬蟲（已修復）
- `lib/pinkoi-scraper.ts` - Pinkoi 爬蟲（已修復）
- `scripts/monitor-and-restart.sh` - 監控腳本

