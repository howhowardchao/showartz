#!/bin/bash

# 檢查 VPS 上的環境變數配置
# 使用方法：在 VPS 上執行此腳本

echo "🔍 檢查環境變數配置..."
echo ""

cd /opt/showartz || {
    echo "❌ 錯誤：找不到 /opt/showartz 目錄"
    exit 1
}

# 檢查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在！"
    echo ""
    echo "請創建 .env 文件並填入以下內容："
    echo ""
    echo "POSTGRES_PASSWORD=your_strong_password_here"
    echo "OPENAI_API_KEY=your_openai_api_key"
    echo "OPENAI_ASSISTANT_ID=your_assistant_id"
    echo "SESSION_SECRET=your_random_secret_here"
    echo "ADMIN_USERNAME=Showartzadmin"
    echo "ADMIN_PASSWORD=#@o09sfg!"
    echo "NODE_ENV=production"
    echo ""
    exit 1
fi

echo "✅ .env 文件存在"
echo ""

# 檢查必要的環境變數
echo "📋 檢查環境變數（不顯示敏感值）："
echo ""

source .env

check_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name: 未設置"
        return 1
    else
        # 只顯示前幾個字符
        local preview="${var_value:0:10}..."
        echo "✅ $var_name: 已設置 ($preview)"
        return 0
    fi
}

all_ok=true

check_var "OPENAI_API_KEY" || all_ok=false
check_var "OPENAI_ASSISTANT_ID" || all_ok=false
check_var "POSTGRES_PASSWORD" || all_ok=false
check_var "SESSION_SECRET" || all_ok=false
check_var "ADMIN_USERNAME" || all_ok=false
check_var "ADMIN_PASSWORD" || all_ok=false

echo ""
echo "📊 容器中的環境變數："
echo ""
docker-compose exec -T app env | grep -E "OPENAI|DATABASE|SESSION" || echo "⚠️  無法檢查容器環境變數（容器可能未運行）"

echo ""
echo "📋 應用日誌（最後 30 行）："
echo ""
docker-compose logs --tail=30 app

echo ""
if [ "$all_ok" = true ]; then
    echo "✅ 所有必要的環境變數都已設置"
else
    echo "❌ 有環境變數未設置，請編輯 .env 文件："
    echo "   nano /opt/showartz/.env"
    echo ""
    echo "編輯完成後，重啟服務："
    echo "   docker-compose restart app"
fi


