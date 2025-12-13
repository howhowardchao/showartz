# 創建新的 OpenAI Assistant

如果現有的 Assistant ID 無法使用（404 錯誤），請按照以下步驟創建新的 Assistant：

## 步驟 1：登入 OpenAI Platform

訪問：https://platform.openai.com/assistants

## 步驟 2：創建新 Assistant

1. 點擊 "Create" 或 "+" 按鈕
2. 填寫以下信息：
   - **Name**: `藝棧 Tarot 顧問`
   - **Instructions**: 複製 `readme/showartz Tarot 顧問＋商品推薦助理提示詞` 文件的完整內容
   - **Model**: 選擇 `gpt-4o` 或 `gpt-4o-mini`（建議使用 `gpt-4o`）

## 步驟 3：添加 Tools (Function Calling)

1. 在 "Tools" 區塊，點擊 "Add tool" → "Function"
2. 選擇 "Import from JSON" 或手動添加
3. 導入 `readme/showartz_product_tools_schema.json` 文件內容

或者手動添加三個函數：

### Function 1: recommend_products
```json
{
  "name": "recommend_products",
  "description": "根據用戶的預算、分類、標籤與目標，推薦適合的商品。",
  "parameters": {
    "type": "object",
    "properties": {
      "budget": {
        "type": "number",
        "description": "用戶的預算上限（台幣）。"
      },
      "category": {
        "type": "string",
        "description": "商品分類，例如：後背包、側背包、腰包、零錢包等。"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "商品標籤例如：[\"貓頭鷹\", \"黑色\", \"M\", \"尼龍\"]。"
      },
      "goal": {
        "type": "string",
        "description": "用戶想改善的目標，例如：情緒穩定、自我覺察、行動力等。"
      },
      "limit": {
        "type": "integer",
        "description": "最多返回的商品數量，預設為 5。",
        "default": 5
      }
    },
    "required": []
  }
}
```

### Function 2: search_products_by_tags
```json
{
  "name": "search_products_by_tags",
  "description": "根據商品標籤搜尋商品，例如搜尋特定動物、顏色、尺寸等。",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "商品標籤列表，例如：[\"貓頭鷹\", \"黑色\", \"M\"]。"
      }
    },
    "required": ["tags"]
  }
}
```

### Function 3: get_all_products
```json
{
  "name": "get_all_products",
  "description": "取得所有可用的商品列表，用於了解目前有哪些商品可供推薦。",
  "parameters": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "integer",
        "description": "最多返回的商品數量，預設為 20。",
        "default": 20
      }
    },
    "required": []
  }
}
```

## 步驟 4：保存並獲取 Assistant ID

1. 點擊 "Save" 保存 Assistant
2. 在 Assistant 詳情頁面，複製 Assistant ID（格式：`asst_xxxxx`）
3. 更新 `.env.local` 文件：
   ```env
   OPENAI_ASSISTANT_ID=asst_你的新ID
   ```

## 步驟 5：測試配置

1. 重啟後端服務器
2. 訪問 `http://localhost:3001/api/test-openai` 驗證配置
3. 應該看到 `assistantTest: true`

## 注意事項

- 確保使用支持 Function Calling 的模型（`gpt-4o`、`gpt-4o-mini`、`gpt-4-turbo` 等）
- Function Calling 需要 OpenAI API 的付費帳號
- 確保 API Key 有足夠的權限訪問 Assistant API



