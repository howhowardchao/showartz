# 部署狀態

## ✅ 已完成設定

### 1. 資料庫連接
- ✅ PostgreSQL 資料庫已建立（`showartz`）
- ✅ 資料表結構已建立（videos, images, admin_users）
- ✅ 管理員帳號已建立（帳號：`admin` / 密碼：`admin123`）
- ✅ 資料庫連接已修復（使用 socket 連接：`/tmp`）

### 2. 環境變數設定
- ✅ `.env.local` 檔案已建立
- ✅ OpenAI API Key 已設定
- ✅ OpenAI Assistant ID 已設定
- ✅ 資料庫連接字串已設定（使用 socket 連接）

### 3. 開發伺服器
- ✅ Next.js 開發伺服器運行在 http://localhost:3001
- ✅ 前端頁面可正常訪問
- ✅ API Routes 已建立

## ⚠️ 需要檢查

### OpenAI 搜尋功能
- API 連接測試成功（Node.js 直接測試）
- Next.js API route 可能需要重啟以載入環境變數
- 如果還有問題，請檢查：
  1. 開發伺服器是否已完全啟動
  2. `.env.local` 檔案是否正確
  3. OpenAI API Key 是否有效

## 📝 使用說明

### 訪問網站
- 首頁：http://localhost:3001
- 後台管理：http://localhost:3001/admin
  - 帳號：`admin`
  - 密碼：`admin123`

### 後台功能
1. **影片管理**
   - 新增 IG 影片連結
   - 設定分類（最熱門、形象、商品、趣味）
   - 編輯或刪除影片

2. **空間照片管理**
   - 新增照片 URL
   - 刪除照片

### OpenAI 搜尋
- 在首頁的「魔法搜尋助手」中輸入問題
- 系統會使用 OpenAI Assistant API 回答

## 🔧 故障排除

### 如果資料庫連接失敗
```bash
# 檢查 PostgreSQL 是否運行
brew services list | grep postgresql

# 檢查 socket 檔案
ls -la /tmp/.s.PGSQL.5432

# 測試資料庫連接
psql showartz -c "SELECT 1;"
```

### 如果 OpenAI 搜尋失敗
1. 檢查 `.env.local` 檔案中的 API Key 是否正確
2. 重啟開發伺服器：`pkill -f "next dev" && npm run dev`
3. 檢查 OpenAI API 額度

### 如果後台無法登入
1. 檢查管理員帳號是否存在：
   ```bash
   psql showartz -c "SELECT username FROM admin_users;"
   ```
2. 如果需要重新建立：
   ```bash
   node scripts/create-admin.mjs
   ```

## 📦 資料庫資訊

- 資料庫名稱：`showartz`
- 連接方式：Unix Socket（`/tmp`）
- 資料表：
  - `videos` - IG 影片資料
  - `images` - 空間照片資料
  - `admin_users` - 管理員帳號

## 🚀 下一步

1. 在後台新增一些測試影片
2. 測試 OpenAI 搜尋功能
3. 上傳空間照片
4. 測試響應式設計（手機、平板、桌面）

