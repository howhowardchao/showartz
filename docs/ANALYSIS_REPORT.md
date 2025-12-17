# 部署架構分析報告

## 1. 總體架構概覽
目前專案使用 Next.js (App Router) + PostgreSQL 的架構。
- **前端/後端**: Next.js 16 (Standalone output)
- **資料庫**: PostgreSQL 16
- **容器化**: Docker + Docker Compose
- **部署方式**: 支援本地開發 (Socket 連接) 與 Docker 部署 (TCP 連接)

## 2. 優點 (Pros)
- **Docker 設定完善**: `Dockerfile` 採用了 Multi-stage build，有效縮減映像檔大小，並使用非 root 使用者 (`nextjs`) 執行，符合安全最佳實踐。
- **Next.js 優化**: `next.config.ts` 設定了 `output: 'standalone'`，這是部署 Next.js 到 Docker 的標準且高效做法。
- **開發體驗**: `DEPLOYMENT_STATUS.md` 提供了詳細的本地開發指引，且腳本 (`scripts/*.mjs`) 支援本地 Socket 連接，提升開發效能。
- **資料持久化**: `docker-compose.yml` 正確設定了 `postgres_data` volume，確保資料庫重啟後資料不遺失。

## 3. 潛在問題與風險 (Potential Issues)

### 3.1 資料庫初始化 (Database Initialization)
- **問題**: `scripts/init-db.mjs` 是一個 Node.js 腳本，用於建立資料表。在 Docker 部署流程中，這個腳本**不會自動執行**。
- **影響**: 第一次啟動 `docker-compose up` 時，資料庫是空的，應用程式可能會因為找不到資料表而報錯。
- **建議**: 
    - **方案 A (手動)**: 部署後，從本地連線到 Docker 資料庫執行初始化 (需開放 5432 port)。
    - **方案 B (自動 - 推薦)**: 將初始化邏輯整合到容器啟動流程，或者使用 `docker-entrypoint-initdb.d` 掛載 SQL 腳本。

### 3.2 環境變數一致性
- **問題**: 本地開發依賴 `.env.local`，而 Docker Compose 依賴環境變數注入。
- **風險**: `OPENAI_API_KEY` 和 `OPENAI_ASSISTANT_ID` 需要確保在部署環境中正確設定，否則 AI 功能會失效。
- **細節**: `docker-compose.yml` 中 `DATABASE_URL` 是硬編碼的 (雖然使用了變數做密碼)，這在簡單部署沒問題，但若要部署到雲端 (如 AWS RDS) 則需要修改。

### 3.3 網路連接模式差異
- **觀察**: 本地開發使用 Unix Socket (`/tmp`)，Docker 使用 TCP (`postgres:5432`)。
- **風險**: 腳本 (`create-admin.mjs`) 有做 fallback 判斷，這很好。但需確保在不同環境下 `DATABASE_URL` 格式正確。

### 3.4 缺乏 CI/CD 流程
- **觀察**: 目前沒有發現 GitHub Actions 或其他 CI/CD 設定。
- **建議**: 建議加入自動化建置與測試流程，確保程式碼品質。

## 4. 具體建議 (Recommendations)

1. **自動化資料庫遷移**: 
   考慮將 `scripts/init-db.mjs` 的邏輯轉換為 SQL 檔案，並掛載到 Postgres 容器的 `/docker-entrypoint-initdb.d/` 目錄下，這樣容器第一次啟動時會自動建立資料表。

2. **統一環境變數管理**:
   建立一個 `.env.example` 範本，明確列出所有需要的環境變數。

3. **健康檢查 (Healthcheck)**:
   `docker-compose.yml` 中已經有 Postgres 的 healthcheck，這很好。建議也為 App 加入 healthcheck (例如呼叫 `/api/health` 或首頁)。

4. **日誌管理**:
   目前 Docker 輸出直接到 stdout，生產環境建議設定 logging driver (如 json-file with rotation) 以免日誌佔滿磁碟。

## 5. 結論
目前的部署架構**基本可用且結構良好**，特別是 Dockerfile 的寫法很標準。主要需要注意的是**資料庫的初次初始化**流程，以及確保生產環境的環境變數配置正確。
