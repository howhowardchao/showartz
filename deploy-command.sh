#!/bin/bash
# 部署命令 - 請在終端機執行此腳本

echo "🚀 開始遠端部署 Showartz..."
echo ""
echo "請輸入 VPS 的 root 密碼（如果需要）"
echo ""

ssh root@45.63.123.237 'cd /opt/showartz && bash scripts/deploy-production.sh'

