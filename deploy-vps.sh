#!/usr/bin/expect -f

set timeout 300
set password "Dn4_eFf2SHA!!Kh8"

spawn ssh -o StrictHostKeyChecking=no root@45.63.123.237 "cd /opt/showartz && git pull origin main && docker-compose down && docker-compose up -d --build"

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}

wait

