#!/bin/bash

# 診斷 502 Bad Gateway 錯誤
# 使用方法: 在 VPS 上執行: bash scripts/diagnose-502.sh

echo "🔍 開始診斷 502 Bad Gateway 錯誤..."
echo ""

# 1. 檢查 Docker 容器狀態
echo "📊 步驟 1: 檢查 Docker 容器狀態..."
cd /opt/showartz 2>/dev/null || {
    echo "❌ 錯誤: 找不到 /opt/showartz 目錄"
    exit 1
}

docker-compose ps
echo ""

# 2. 檢查應用容器是否運行
echo "📋 步驟 2: 檢查應用容器日誌（最後 30 行）..."
docker-compose logs app --tail=30
echo ""

# 3. 檢查端口是否監聽
echo "🔌 步驟 3: 檢查端口 3000 是否監聽..."
if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✅ 端口 3000 正在監聽"
    netstat -tuln | grep ":3000"
else
    echo "❌ 端口 3000 未監聽"
fi
echo ""

# 4. 測試本地連接
echo "🌐 步驟 4: 測試本地連接..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ 本地連接成功"
else
    echo "❌ 本地連接失敗"
    echo "嘗試連接結果:"
    curl -v http://localhost:3000 2>&1 | head -20
fi
echo ""

# 5. 檢查 Nginx 配置
echo "⚙️  步驟 5: 檢查 Nginx 配置..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx 配置正確"
else
    echo "❌ Nginx 配置有錯誤:"
    nginx -t
fi
echo ""

# 6. 檢查 Nginx 錯誤日誌
echo "📝 步驟 6: 檢查 Nginx 錯誤日誌（最後 10 行）..."
if [ -f /var/log/nginx/error.log ]; then
    tail -10 /var/log/nginx/error.log
else
    echo "⚠️  找不到 Nginx 錯誤日誌"
fi
echo ""

# 7. 檢查環境變數
echo "🔐 步驟 7: 檢查關鍵環境變數..."
docker-compose exec -T app sh -c 'echo "DATABASE_URL: $DATABASE_URL" | head -c 50' 2>/dev/null || echo "❌ 無法檢查環境變數（容器可能未運行）"
echo ""

# 8. 提供修復建議
echo "💡 修復建議:"
echo ""
echo "如果容器未運行，執行:"
echo "  cd /opt/showartz"
echo "  docker-compose up -d"
echo ""
echo "如果容器運行但應用崩潰，執行:"
echo "  docker-compose logs app --tail=50"
echo "  docker-compose restart app"
echo ""
echo "如果端口未監聽，執行:"
echo "  docker-compose down"
echo "  docker-compose up -d --build"
echo ""
echo "如果 Nginx 配置有問題，執行:"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""


