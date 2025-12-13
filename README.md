# 藝棧 Showartz - 魔法商店網站

這是一個響應式的魔法商店網站，整合 OpenAI Assistant API 提供塔羅占卜與商品推薦服務，並展示 IG 短影片、商品資訊。

## 📌 版本資訊

**當前版本**: v1.0.0  
**最後更新**: 2025-12-13  
**部署狀態**: ✅ 已部署至生產環境 (https://showartz.com)

### 最新更新 (v1.0.0 - 2025-12-13)
- ✨ **故事頁面優化**：在預覽圖下方顯示前 120 字描述，提升用戶體驗
- 🎨 **Logo 更新**：調整為橫式設計（2001x500px），移除文字標籤，響應式高度（手機 34px / 桌面 42px）
- 📸 **上傳規格標示**：在後台管理介面標示建議的圖片尺寸與比例
- 🔄 **商品同步優化**：自動標記已下架商品為非活躍狀態
- 🐛 **修復**：解決 413 上傳錯誤、404 圖片載入問題、502 Bad Gateway 錯誤
- ⚙️ **部署優化**：配置 Nginx 直接服務上傳文件、優化資料庫連接池、改進生產環境日誌

## 📋 目錄

- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [系統架構](#系統架構)
- [開發規格](#開發規格)
- [開發過程](#開發過程)
- [環境設定](#環境設定)
- [本地開發](#本地開發)
- [API 文檔](#api-文檔)
- [資料庫結構](#資料庫結構)
- [部署說明](#部署說明)

## 功能特色

### 🎬 IG 影片展示
- 像 YouTube 一樣展示 Instagram 短影片
- 支援分類篩選：全部、最熱門、形象、商品、趣味
- 響應式網格佈局，適配各種螢幕尺寸
- 點擊播放全螢幕影片

### 🤖 AI 藝棧精靈 + 商品推薦
- **塔羅占卜功能**：提供感情、工作、金錢、家庭、自我成長等主題的塔羅指引
- **商品推薦**：根據塔羅結果智能推薦適合的商品
- **Function Calling**：整合 OpenAI Assistant API，支援動態商品搜尋與推薦
- **對話限時機制**：每次對話限時 180 秒，超時後需等待 5 分鐘冷卻期
- **IP 鎖定**：基於 IP 地址的限流機制，防止濫用
- **智能對話介面**：動態展開的聊天框，優化的用戶體驗

### 🛍️ 商品管理
- **Pinkoi 商品同步**：自動從 Pinkoi 商店同步商品資訊
- **商品展示**：支援分類、排序、分頁瀏覽
- **商品推薦**：AI 根據用戶需求推薦適合的商品
- **多平台支援**：支援 Pinkoi 和蝦皮商品連結

### 📸 空間展示
- 展示店內照片
- 點擊放大查看

### 🎨 魔法風格設計
- 深色神秘主題，帶有魔法元素和動畫效果
- 響應式設計，適配手機、平板、桌面
- 流暢的動畫過渡效果

### 🔐 後台管理
- 獨立後台系統
- 影片管理（新增、編輯、刪除、分類、縮圖上傳）
- 照片管理（故事圖片上傳）
- 商品管理（同步、編輯、刪除）
- **文件上傳規格**：
  - 縮圖：建議尺寸 640x1136 像素，比例約為 9:16（直式），最大 5MB
  - 故事圖片：建議比例 1:1（正方形）或 4:5（直式），最大 8MB
  - 支援格式：JPEG、PNG、WebP

### 📱 響應式導航
- 桌面版：置中導航連結
- 手機/平板版：右側漢堡選單

### 📄 Footer 版權區塊
- 版權聲明：自動顯示當前年份
- 聯絡信箱：service@showartz.com（可點擊發送郵件）
- 統一的魔法風格設計

## 技術棧

### 前端
- **框架**: Next.js 16.0.3 (App Router)
- **UI 庫**: React 19.2.0
- **樣式**: Tailwind CSS 4
- **圖標**: Lucide React
- **狀態管理**: React Hooks (useState, useEffect)

### 後端
- **API**: Next.js API Routes
- **資料庫**: PostgreSQL
- **ORM**: 原生 pg 驅動
- **認證**: 自定義 Session 管理 (Base64 Cookie)
- **密碼加密**: bcryptjs

### AI 整合
- **OpenAI Assistant API**: GPT-4 模型
- **Function Calling**: 商品搜尋與推薦功能
- **Thread 管理**: 對話上下文維護

### 資料爬取
- **Puppeteer**: 網頁爬蟲（Pinkoi 商品同步）
- **Axios**: HTTP 請求

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (可選)

## 系統架構

```
┌─────────────────────────────────────────┐
│           用戶瀏覽器 (Browser)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Next.js 應用 (Port 3001)        │
│  ┌──────────────┬──────────────────┐   │
│  │  前端頁面     │   API Routes     │   │
│  │  - 首頁      │  - /api/search   │   │
│  │  - 商品頁    │  - /api/products │   │
│  │  - 後台      │  - /api/pinkoi   │   │
│  └──────────────┴──────────────────┘   │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  OpenAI API  │
│  (Port 5432)  │  │  (External)  │
└──────────────┘  └──────────────┘
```

## 開發規格

### 1. 聊天限時機制 (`lib/chat-limiter.ts`)

**功能**：
- 每次對話限時 180 秒
- 超時後進入 300 秒（5 分鐘）冷卻期
- 基於 IP 地址的限流
- 自動清理過期狀態

**實作細節**：
- 使用內存 Map 存儲 IP 狀態（生產環境建議使用 Redis）
- 每 10 分鐘自動清理過期記錄
- 支援從多種 HTTP headers 獲取 IP（x-forwarded-for, x-real-ip, cf-connecting-ip）

**API 回應**：
- 429 狀態碼：限時/冷卻錯誤
- 錯誤訊息：「抱歉，目前我的對話時間有限時，請您等候5分鐘後再與我聊聊。」

### 2. OpenAI Assistant 整合

**Function Calling 工具**：
- `recommend_products`: 根據條件推薦商品
- `search_products_by_tags`: 根據標籤搜尋商品
- `get_all_products`: 取得所有商品列表

**提示詞管理**：
- 位置：`readme/showartz Tarot 顧問＋商品推薦助理提示詞`
- JSON Schema：`readme/showartz_product_tools_schema.json`
- 配置指南：`readme/OpenAI Assistant 配置指南.md`

### 3. 商品同步系統

**Pinkoi 同步** (`lib/pinkoi-sync.ts`):
- API 優先：嘗試使用 Pinkoi API 獲取商品
- 爬蟲備援：API 失敗時使用 Puppeteer 爬取
- 圖片處理：自動提取商品圖片 URL
- 資料驗證：檢查重複商品（基於 itemId）

**API 端點**：
- `POST /api/pinkoi/sync`: 手動觸發同步
- `GET /api/pinkoi/sync`: 查詢同步狀態

### 4. 響應式導航

**桌面版**：
- Logo 在左側
- 導航連結置中
- 右側空白區域平衡佈局

**手機/平板版**：
- Logo 在左側
- 右側漢堡選單按鈕
- 全螢幕下拉選單
- 自動關閉（路由改變時）

### 5. 首頁動態內容

**邏輯**：
- 預設顯示 IG 影片網格
- 當 AI 推薦商品時，自動切換顯示商品網格
- 離開聊天時恢復顯示影片網格

**組件**：
- `SearchAgent`: 聊天介面，支援動態展開
- `VideoGrid`: IG 影片網格
- `ProductGrid`: 商品網格

## 開發過程

### Phase 1: 基礎架構建立
1. ✅ Next.js 16 專案初始化
2. ✅ PostgreSQL 資料庫設計與初始化
3. ✅ 基礎頁面結構（首頁、商品、故事、關於）
4. ✅ 後台管理系統

### Phase 2: IG 影片功能
1. ✅ 影片資料表設計
2. ✅ 影片 CRUD API
3. ✅ 影片展示組件
4. ✅ 分類篩選功能
5. ✅ 全螢幕播放器

### Phase 3: OpenAI 整合
1. ✅ OpenAI Assistant API 整合
2. ✅ Function Calling 實作
3. ✅ 商品推薦邏輯
4. ✅ 對話上下文管理（Thread）
5. ✅ JSON metadata 清理

### Phase 4: 商品管理
1. ✅ 商品資料表設計
2. ✅ Pinkoi 爬蟲開發
3. ✅ 商品同步 API
4. ✅ 商品展示頁面
5. ✅ 商品推薦整合

### Phase 5: UI/UX 優化
1. ✅ 響應式導航（漢堡選單）
2. ✅ 聊天介面動態展開
3. ✅ 首頁內容動態切換
4. ✅ 間距與佈局調整
5. ✅ 歡迎詞與提示文字優化

### Phase 6: 限流機制
1. ✅ IP 追蹤系統
2. ✅ 對話限時機制（180 秒）
3. ✅ 冷卻期機制（300 秒）
4. ✅ 錯誤處理與用戶提示

### Phase 7: UI/UX 最終優化
1. ✅ 聊天室標題更新為「藝棧精靈」
2. ✅ Footer 組件實作（版權聲明 + 聯絡信箱）
3. ✅ 頁面標題與導航間距優化（故事、商品、關於頁面）
4. ✅ 搜尋工具寬度調整（響應式寬度優化）
5. ✅ 首頁內容區域間距調整
6. ✅ 分類按鈕間距優化
7. ✅ 服務項目與 Footer 間距調整

## 環境設定

### 必要環境變數

建立 `.env.local` 檔案：

```env
# OpenAI 設定
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id

# 資料庫設定
DATABASE_URL=postgresql://user:password@localhost:5432/showartz

# Session 設定
SESSION_SECRET=your_random_secret_here

# 管理員帳號
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

### 資料庫初始化

```bash
npm run init-db
```

這會：
- 建立所有必要的資料表
- 建立管理員帳號
- 設定初始資料結構

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動資料庫

使用 Docker：
```bash
docker-compose up -d postgres
```

或使用本地 PostgreSQL：
```bash
createdb showartz
```

### 3. 初始化資料庫

```bash
npm run init-db
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

網站將在 http://localhost:3001 開啟

### 5. 訪問後台

- 網址：http://localhost:3001/admin
- 預設帳號：admin
- 預設密碼：admin123（或在 `.env.local` 中設定）

## API 文檔

### 聊天 API

**POST /api/search**
- 功能：發送訊息給 AI 助手
- 請求體：
  ```json
  {
    "message": "用戶訊息",
    "threadId": "thread_id (可選)"
  }
  ```
- 回應：
  ```json
  {
    "response": "AI 回應",
    "threadId": "thread_id",
    "recommendedProducts": [...]
  }
  ```
- 錯誤：
  - 429: 限時/冷卻錯誤
  - 500: 伺服器錯誤

### 商品 API

**GET /api/products**
- 功能：取得所有商品列表
- 回應：商品陣列

**GET /api/products/[id]**
- 功能：取得單一商品
- 回應：商品物件

**POST /api/products/recommend**
- 功能：根據條件推薦商品
- 請求體：
  ```json
  {
    "budget": 1000,
    "category": "後背包",
    "tags": ["貓頭鷹", "黑色"],
    "goal": "情緒穩定",
    "limit": 5
  }
  ```

### Pinkoi 同步 API

**POST /api/pinkoi/sync**
- 功能：手動觸發商品同步
- 權限：需要管理員登入
- 回應：
  ```json
  {
    "success": true,
    "total": 10,
    "success": 10,
    "failed": 0
  }
  ```

**GET /api/pinkoi/sync**
- 功能：查詢同步狀態
- 回應：同步狀態資訊

## 資料庫結構

### videos 表
- `id`: UUID (主鍵)
- `ig_url`: Instagram 影片 URL
- `title`: 標題
- `category`: 分類 (hot, image, product, fun)
- `order_index`: 排序索引
- `created_at`: 建立時間
- `updated_at`: 更新時間

### images 表
- `id`: UUID (主鍵)
- `image_url`: 圖片 URL
- `description`: 描述
- `created_at`: 建立時間

### products 表
- `id`: UUID (主鍵)
- `item_id`: 商品 ID（Pinkoi/Shopee）
- `name`: 商品名稱
- `price`: 價格
- `original_price`: 原價
- `image_url`: 圖片 URL
- `description`: 描述
- `category`: 分類
- `tags`: 標籤（JSON 陣列）
- `pinkoi_url`: Pinkoi 連結
- `shopee_url`: 蝦皮連結
- `sales_count`: 銷售量
- `rating`: 評分
- `created_at`: 建立時間
- `updated_at`: 更新時間

### admin_users 表
- `id`: UUID (主鍵)
- `username`: 使用者名稱
- `password_hash`: 密碼雜湊
- `created_at`: 建立時間

## 部署說明

### Docker 部署

1. **建立環境變數檔案**
```bash
   cp .env.example .env.local
   # 編輯 .env.local
```

2. **確保上傳目錄存在並有正確權限**
```bash
   mkdir -p public/uploads/thumbnails public/uploads/story
   chmod -R 777 public/uploads  # 或使用 chown -R 1001:1001 public/uploads
```

3. **啟動服務**
```bash
docker-compose up -d --build
```

4. **初始化資料庫**（首次部署）
```bash
   docker-compose exec app npm run init-db
   # 或使用 API 端點
   curl -X POST http://localhost:3000/api/init
   ```

5. **同步商品**（可選）
   - 登入後台：https://showartz.com/admin
   - 點擊「同步 Pinkoi 商品」或「同步 Shopee 商品」

#### Docker Volume 配置

`docker-compose.yml` 中已配置 volume 映射，確保上傳的文件持久化：

```yaml
volumes:
  - ./public/uploads:/app/public/uploads
```

這確保：
- 上傳的文件保存在主機的 `public/uploads` 目錄
- 容器重啟後文件不會丟失
- Nginx 可以直接訪問這些文件

### Nginx 反向代理配置

#### 基本配置

編輯 `/etc/nginx/sites-available/showartz`：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name showartz.com www.showartz.com;
    return 301 https://$host$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl;
    server_name showartz.com www.showartz.com;

    # 增加客戶端請求體大小限制（10MB）- 用於文件上傳
    client_max_body_size 10M;

    # SSL 證書配置（由 Certbot 管理）
    ssl_certificate /etc/letsencrypt/live/showartz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/showartz.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 直接服務上傳的文件（繞過 Next.js standalone 模式限制）
    location /uploads/ {
        alias /opt/showartz/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 啟用站點

```bash
sudo ln -s /etc/nginx/sites-available/showartz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d showartz.com -d www.showartz.com
```

#### 重要配置說明

1. **`client_max_body_size 10M`**：允許上傳最大 10MB 的文件（解決 413 錯誤）
2. **`location /uploads/`**：直接服務上傳的文件，因為 Next.js standalone 模式不會自動服務運行時上傳的文件
3. **Docker Volume 映射**：`docker-compose.yml` 中已配置 `./public/uploads:/app/public/uploads`，確保文件持久化

## 專案結構

```
showartz251120/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # 認證相關
│   │   ├── products/        # 商品 API
│   │   ├── pinkoi/          # Pinkoi 同步
│   │   ├── search/          # 聊天 API
│   │   └── videos/          # 影片 API
│   ├── admin/               # 後台頁面
│   ├── space/               # 空間頁面
│   ├── products/            # 商品頁面
│   ├── about/               # 關於頁面
│   └── page.tsx             # 首頁
├── components/              # React 組件
│   ├── admin/               # 後台組件
│   ├── SearchAgent.tsx      # AI 聊天組件（藝棧精靈）
│   ├── VideoGrid.tsx        # 影片網格
│   ├── ProductGrid.tsx      # 商品網格
│   ├── Navigation.tsx       # 導航列
│   └── Footer.tsx           # Footer 版權區塊
├── lib/                      # 工具函數
│   ├── db.ts                # 資料庫操作
│   ├── openai.ts            # OpenAI 整合
│   ├── openai-functions.ts  # Function Calling
│   ├── chat-limiter.ts      # 聊天限流
│   ├── pinkoi-sync.ts       # Pinkoi 同步
│   └── auth.ts              # 認證工具
├── scripts/                  # 腳本
│   └── init-db.mjs          # 資料庫初始化
├── readme/                   # 文檔
│   ├── OpenAI Assistant 配置指南.md
│   ├── showartz Tarot 顧問＋商品推薦助理提示詞
│   └── showartz_product_tools_schema.json
├── public/                   # 靜態資源
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile               # Docker 映像檔
└── package.json             # 專案依賴
```

## 注意事項

1. **環境變數**：`.env.local` 不應提交到版本控制系統
2. **資料庫密碼**：生產環境請務必更改預設密碼
3. **OpenAI API Key**：請妥善保管，避免洩露
4. **IP 限流**：目前使用內存存儲，重啟後會重置。生產環境建議使用 Redis
5. **商品同步**：Pinkoi 同步可能需要較長時間，請耐心等待
6. **LOGO 設定**：請將 LOGO 圖片放在 `public/showartzlogo.*`

## 授權

版權所有 © 2024 藝棧 Showartz
