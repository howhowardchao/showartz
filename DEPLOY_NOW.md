# 🚀 立即部署指南

## 方法 1: 使用遠端部署腳本（推薦）

在本地執行以下命令，腳本會自動連接到 VPS 並執行部署：

```bash
bash scripts/deploy-remote.sh
```

或指定 IP 和用戶：

```bash
bash scripts/deploy-remote.sh 45.63.123.237 root
```

## 方法 2: 直接 SSH 執行（最簡單）

複製以下命令，在終端機執行：

```bash
ssh root@45.63.123.237 'cd /opt/showartz && bash scripts/deploy-production.sh'
```

## 方法 3: 手動步驟

1. **SSH 連接到 VPS**：
   ```bash
   ssh root@45.63.123.237
   ```

2. **執行部署腳本**：
   ```bash
   cd /opt/showartz
   bash scripts/deploy-production.sh
   ```

## 📋 部署腳本會自動執行：

1. ✅ 拉取最新代碼（從 GitHub）
2. ✅ 檢查環境變數文件
3. ✅ 停止現有容器
4. ✅ 重新構建並啟動容器
5. ✅ 等待服務就緒
6. ✅ 檢查服務狀態
7. ✅ 顯示應用日誌

## ⚠️ 注意事項

- 部署時間約 1-2 分鐘
- 部署期間會有短暫服務中斷（約 10-30 秒）
- 資料庫不會受影響

## ✅ 部署後檢查

部署完成後，請訪問：
- 網站：https://showartz.com
- 後台：https://showartz.com/admin

