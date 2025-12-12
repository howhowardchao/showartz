# 部署最新優化到正式站

## 📋 部署步驟

### 1. 連接到 VPS
```bash
ssh root@45.63.123.237
```

### 2. 進入專案目錄
```bash
cd /opt/showartz
```

### 3. 拉取最新代碼
```bash
git pull origin main
```

### 4. 停止現有容器
```bash
docker-compose down
```

### 5. 重新構建並啟動
```bash
docker-compose up -d --build
```

### 6. 檢查服務狀態
```bash
# 檢查容器狀態
docker-compose ps

# 檢查應用日誌（最後 50 行）
docker-compose logs app --tail=50

# 檢查是否有錯誤
docker-compose logs app | grep -i error
```

### 7. 驗證服務
```bash
# 測試本地連接
curl -I http://localhost:3000

# 檢查網站是否正常
curl -I https://showartz.com
```

## 🔍 本次更新內容

### 修復項目
- ✅ 修復 OpenAI API 調用參數順序（retrieve 和 submitToolOutputs）
- ✅ 添加資料庫連接池配置（最大連接數、超時設置）
- ✅ 優化生產環境日誌輸出（減少不必要的日誌）

### 新增文件
- `OPTIMIZATION_REPORT.md` - 完整的優化建議報告

## ⚠️ 注意事項

1. **部署時間**: 構建過程可能需要 1-2 分鐘
2. **服務中斷**: 部署期間會有短暫的服務中斷（約 10-30 秒）
3. **資料庫**: 資料庫不會受影響，因為使用 volume 持久化
4. **環境變數**: `.env` 文件不會被覆蓋，確保已正確配置

## 🐛 如果遇到問題

### 構建失敗
```bash
# 查看詳細構建日誌
docker-compose build --no-cache

# 檢查環境變數
cat .env
```

### 容器無法啟動
```bash
# 查看容器日誌
docker-compose logs app

# 檢查資料庫連接
docker-compose exec postgres psql -U showartz -d showartz -c "SELECT 1;"
```

### 回滾到上一個版本
```bash
# 回退到上一個 commit
git reset --hard HEAD~1
docker-compose up -d --build
```

## ✅ 部署完成檢查清單

- [ ] Git pull 成功
- [ ] Docker 構建成功
- [ ] 容器正常運行
- [ ] 網站可以訪問（https://showartz.com）
- [ ] 後台可以登入
- [ ] 聊天功能正常
- [ ] 商品同步功能正常

