# 快速修復 502 錯誤 - 直接執行命令

## 方法 1: 一鍵執行（推薦）

直接在伺服器上複製並執行以下命令：

```bash
cd /opt/showartz && git pull origin main && docker-compose down && docker-compose up -d --build && sleep 30 && docker-compose ps && docker-compose logs app --tail=30 && curl -I http://localhost:3000
```

## 方法 2: 分步執行（更安全）

```bash
# 1. 進入專案目錄
cd /opt/showartz

# 2. 拉取最新代碼
git pull origin main

# 3. 停止容器
docker-compose down

# 4. 重新構建並啟動
docker-compose up -d --build

# 5. 等待服務啟動（30秒）
sleep 30

# 6. 檢查狀態
docker-compose ps

# 7. 查看日誌
docker-compose logs app --tail=50

# 8. 測試連接
curl -I http://localhost:3000
```

## 如果還有問題

```bash
# 查看完整錯誤日誌
docker-compose logs app --tail=100

# 檢查資料庫
docker-compose logs postgres --tail=30

# 重啟應用容器
docker-compose restart app

# 檢查端口
netstat -tuln | grep 3000
# 或
ss -tuln | grep 3000
```

## 驗證修復成功

執行後應該看到：
- ✅ 容器狀態顯示 "Up"
- ✅ curl 返回 HTTP 200/301/302
- ✅ 日誌中沒有錯誤訊息

