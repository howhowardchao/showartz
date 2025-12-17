#!/usr/bin/expect -f

# 遠程部署腳本 - 使用 expect 處理 SSH 密碼
# 使用方法: VULTR_PASSWORD="your_password" expect scripts/deploy-remote.sh
# 或: export VULTR_PASSWORD="your_password" && expect scripts/deploy-remote.sh

set timeout 300
set server_ip "45.63.123.237"
set username "root"
set password [exec sh -c {echo $VULTR_PASSWORD}]
set project_dir "/opt/showartz"

if {$password == ""} {
    puts "❌ 錯誤: 請設置環境變數 VULTR_PASSWORD"
    puts "使用方法: VULTR_PASSWORD=\"your_password\" expect scripts/deploy-remote.sh"
    exit 1
}

puts "🚀 開始連接到 Vultr 伺服器..."
puts "📡 伺服器: $username@$server_ip"
puts ""

spawn ssh -o StrictHostKeyChecking=no $username@$server_ip

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "# " {
        puts "✅ 連接成功！"
    }
    timeout {
        puts "❌ 連接超時"
        exit 1
    }
}

# 執行部署命令
puts ""
puts "📥 拉取最新代碼..."
send "cd $project_dir && git pull origin main\r"
expect "# "

puts ""
puts "🛑 停止容器..."
send "docker-compose down\r"
expect "# "

puts ""
puts "🔨 重新構建並啟動（這需要幾分鐘）..."
send "docker-compose up -d --build\r"
expect "# "

puts ""
puts "⏳ 等待服務啟動（30秒）..."
send "sleep 30\r"
expect "# "

puts ""
puts "📊 檢查容器狀態..."
send "docker-compose ps\r"
expect "# "

puts ""
puts "📋 查看應用日誌（最後30行）..."
send "docker-compose logs app --tail=30\r"
expect "# "

puts ""
puts "🌐 測試連接..."
send "curl -I http://localhost:3000\r"
expect "# "

puts ""
puts "✅ 部署完成！"
puts ""
puts "💡 安全提醒："
puts "   1. 請立即更改伺服器密碼"
puts "   2. 考慮配置 SSH 密鑰認證"
puts "   3. 不要將密碼提交到 Git"
puts ""

send "exit\r"
expect eof

