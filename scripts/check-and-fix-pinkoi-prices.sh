#!/bin/bash

# 檢查並修復 Pinkoi 商品價格問題
# 此腳本會檢查生產環境的代碼版本，並提供修復建議

PROJECT_DIR="/opt/showartz"

cd "$PROJECT_DIR" || {
    echo "❌ 錯誤: 無法進入專案目錄: $PROJECT_DIR"
    exit 1
}

echo "🔍 檢查 Pinkoi 價格修復狀態..."
echo ""

# 1. 檢查代碼版本
echo "📝 步驟 1/3: 檢查代碼版本"
LATEST_COMMIT=$(git log --oneline -1)
echo "最新提交: $LATEST_COMMIT"

# 檢查是否包含價格修復
if git log --oneline -10 | grep -q "價格\|price\|TWD"; then
    echo "✅ 代碼包含價格相關修復"
else
    echo "⚠️  未找到價格相關修復，可能需要更新代碼"
fi
echo ""

# 2. 檢查資料庫中的價格（示例：鯊魚背包）
echo "📊 步驟 2/3: 檢查資料庫中的商品價格"
echo "查詢包含 '鯊魚背包' 的商品價格："
docker-compose exec -T postgres psql -U postgres -d showartz -c "
SELECT name, price, pinkoi_product_id, updated_at 
FROM products 
WHERE pinkoi_product_id IS NOT NULL 
  AND name LIKE '%鯊魚背包%' 
ORDER BY updated_at DESC 
LIMIT 5;
" 2>/dev/null || echo "⚠️  無法查詢資料庫"
echo ""

# 3. 提供修復建議
echo "💡 步驟 3/3: 修復建議"
echo ""
echo "如果價格不正確，請執行以下操作："
echo "1. 登入後台: https://showartz.com/admin"
echo "2. 點擊 '同步 Pinkoi 商品' 按鈕"
echo "3. 等待同步完成"
echo ""
echo "或者，檢查容器日誌以查看同步過程："
echo "  docker-compose logs app --tail 200 | grep -i pinkoi"
echo ""

