#!/bin/bash

# 設置 SSL 證書（HTTPS）的腳本
# 使用方法：在 VPS 上執行此腳本

set -e

echo "🔒 開始設置 SSL 證書..."

# 檢查是否以 root 運行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 請以 root 用戶運行此腳本"
    exit 1
fi

# 步驟 1: 安裝 Nginx 和 Certbot
echo "📦 安裝 Nginx 和 Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# 步驟 2: 配置 Nginx 反向代理
echo "⚙️  配置 Nginx..."
cat > /etc/nginx/sites-available/showartz << 'EOF'
server {
    listen 80;
    server_name showartz.com www.showartz.com;

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
EOF

# 啟用配置
ln -sf /etc/nginx/sites-available/showartz /etc/nginx/sites-enabled/

# 移除默認配置（如果存在）
rm -f /etc/nginx/sites-enabled/default

# 測試配置
nginx -t

# 重載 Nginx
systemctl reload nginx

# 步驟 3: 配置防火牆
echo "🔥 配置防火牆..."
ufw allow 80/tcp
ufw allow 443/tcp

# 步驟 4: 獲取 SSL 證書
echo "🔐 獲取 SSL 證書..."
echo "請確保域名 showartz.com 和 www.showartz.com 的 DNS 記錄已正確指向此服務器"
read -p "按 Enter 繼續獲取 SSL 證書..."

certbot --nginx -d showartz.com -d www.showartz.com --non-interactive --agree-tos --email service@showartz.com || {
    echo "⚠️  獲取證書失敗，請手動執行："
    echo "   certbot --nginx -d showartz.com -d www.showartz.com"
}

# 步驟 5: 設置自動續期
echo "🔄 設置自動續期..."
systemctl enable certbot.timer

echo ""
echo "✅ SSL 設置完成！"
echo ""
echo "📝 注意事項："
echo "   1. 請確保域名 DNS 記錄正確指向此服務器"
echo "   2. 證書會在到期前自動續期"
echo "   3. 現在可以通過 https://showartz.com 訪問網站"


