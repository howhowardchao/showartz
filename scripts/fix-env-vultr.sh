#!/bin/bash

# 修復 VPS 上的環境變數配置
# 使用方法：在 VPS 上執行此腳本

set -e

echo "🔍 檢查 .env 文件..."

cd /opt/showartz || {
    echo "❌ 錯誤：找不到 /opt/showartz 目錄"
    exit 1
}

# 檢查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在！"
    echo ""
    echo "📝 創建 .env 文件..."
    cat > .env << 'EOF'
# PostgreSQL 密碼
POSTGRES_PASSWORD=Showartz2024!SecurePass

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-T7SJmjxMr1szrf7uyJ0K69Z7l9UkhpVC5JNau_qgJPjH8rM2SkVH0jvOZ7Ydz360nzhR$
OPENAI_ASSISTANT_ID=asst_p7Bi3ZHDpPvRY9YmDwDlgfyu

# Session Secret
SESSION_SECRET=showartz_magic_store_secret_key_2024

# Admin Credentials
ADMIN_USERNAME=Showartzadmin
ADMIN_PASSWORD=#@o09sfg!

# Node Environment
NODE_ENV=production
EOF
    echo "✅ .env 文件已創建"
else
    echo "✅ .env 文件存在"
    echo ""
    echo "📋 當前 .env 文件內容："
    echo "---"
    cat .env
    echo "---"
    echo ""
    echo "⚠️  請確認 OPENAI_API_KEY 和 OPENAI_ASSISTANT_ID 是否正確"
fi

echo ""
echo "🔄 重啟服務以應用環境變數..."
docker-compose down
docker-compose up -d

echo ""
echo "⏳ 等待服務啟動..."
sleep 5

echo ""
echo "📊 檢查容器狀態..."
docker-compose ps

echo ""
echo "🔍 驗證環境變數..."
docker-compose exec -T app env | grep -E "OPENAI|DATABASE" || echo "⚠️  無法檢查環境變數"

echo ""
echo "✅ 完成！請檢查上面的環境變數是否正確。"


