# 環境變數設定

請在專案根目錄建立 `.env.local` 檔案，內容如下：

```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_QT4umaEONjrbsYO2OvZayeeu

# Database Configuration (請根據你的資料庫設定調整)
DATABASE_URL=postgresql://showartz:changeme@localhost:5432/showartz

# Session Secret
SESSION_SECRET=showartz_magic_store_secret_key_2024

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 設定資料庫

如果還沒有資料庫，可以：

### 選項 1: 使用 Docker
```bash
docker-compose up -d postgres
```

### 選項 2: 使用本地 PostgreSQL
```bash
createdb showartz
psql showartz -c "CREATE USER showartz WITH PASSWORD 'changeme';"
psql showartz -c "GRANT ALL PRIVILEGES ON DATABASE showartz TO showartz;"
```

## 初始化資料庫

設定好環境變數後，執行：
```bash
npm run init-db
```

這會建立資料表結構和管理員帳號。
