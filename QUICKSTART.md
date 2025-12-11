# 快速開始指南

## 前置需求

1. Node.js 18+ 
2. PostgreSQL 14+ (或使用 Docker)
3. Docker 和 Docker Compose (用於部署)

## 本地開發設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 檔案並填入以下內容：

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_QT4umaEONjrbsYO2OvZayeeu
DATABASE_URL=postgresql://showartz:changeme@localhost:5432/showartz
SESSION_SECRET=your_random_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. 啟動資料庫

使用 Docker Compose 啟動 PostgreSQL：

```bash
docker-compose up -d postgres
```

或使用本地 PostgreSQL：

```bash
createdb showartz
```

### 4. 初始化資料庫

```bash
npm run init-db
```

這會：
- 建立資料表結構
- 建立管理員帳號（使用 `.env.local` 中的 ADMIN_USERNAME 和 ADMIN_PASSWORD）

### 5. 放置 LOGO

將你的 LOGO 圖片放在 `public/` 目錄下，檔名為 `showartzlogo.*`（支援 .png, .jpg, .jpeg, .svg, .webp）

### 6. 啟動開發伺服器

```bash
npm run dev
```

網站將在 http://localhost:3000 開啟

## 後台管理

1. 前往 http://localhost:3000/admin
2. 使用管理員帳號密碼登入（預設：admin / admin123，或在 `.env.local` 中設定）
3. 可以：
   - 新增、編輯、刪除 IG 影片
   - 新增、刪除空間照片
   - 設定影片分類和排序

## 新增 IG 影片

在後台管理中：
1. 點擊「新增影片」
2. 貼上 IG 影片連結（例如：https://www.instagram.com/reel/xxxxx/）
3. 選擇分類（最熱門、形象、商品、趣味）
4. 點擊「儲存」

## Docker 部署到 Vultr

詳細部署步驟請參考 `README.md`

## 注意事項

1. **LOG 位置**：請將 LOGO 圖片放在 `public/showartzlogo.*`
2. **資料庫密碼**：生產環境請務必更改預設密碼
3. **環境變數**：`.env.local` 不應提交到版本控制系統
4. **IG 影片**：目前 IG 影片會顯示連結，點擊後在 Instagram 開啟（因為 Instagram 的嵌入限制）

## 問題排除

### 資料庫連接失敗

檢查：
- PostgreSQL 是否正在運行
- `DATABASE_URL` 是否正確
- 資料庫用戶權限是否正確

### OpenAI API 錯誤

檢查：
- `OPENAI_API_KEY` 是否正確
- `OPENAI_ASSISTANT_ID` 是否正確
- API 額度是否足夠

### 後台無法登入

執行資料庫初始化：
```bash
npm run init-db
```

或檢查資料庫中的 `admin_users` 表是否存在管理員帳號。

