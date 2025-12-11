# OpenAI Assistant 配置指南

## 1. 基本設定

在 OpenAI Assistant 平台上創建或編輯 Assistant：

- **Name**: 藝棧 Tarot 顧問
- **Instructions**: 複製 `readme/showartz Tarot 顧問＋商品推薦助理提示詞` 文件的完整內容
- **Model**: `gpt-4o` 或 `gpt-4o-mini`（建議使用 `gpt-4o` 以獲得更好的 Function Calling 支援）

## 2. Function Calling 設定

### 步驟 1：添加 Tools（工具集）

在 OpenAI Assistant 平台上，你可以使用以下兩種方式之一：

#### 方式 A：使用完整的工具集 JSON Schema（推薦）

直接複製 `readme/showartz_product_tools_schema.json` 文件的完整內容，在 Assistant 設定頁面的 "Tools" 區塊中導入。

這個工具集包含三個函數：
- `recommend_products`：根據條件推薦商品
- `search_products_by_tags`：根據標籤搜尋商品
- `get_all_products`：取得所有商品列表

#### 方式 B：手動添加個別函數

如果你想手動添加，可以在 Assistant 設定頁面的 "Functions" 區塊，添加以下三個函數：

#### Function 1: `recommend_products`

```json
{
  "name": "recommend_products",
  "description": "根據用戶的需求、預算、目標等條件推薦適合的商品。當用戶需要商品推薦時使用此功能。",
  "parameters": {
    "type": "object",
    "properties": {
      "budget": {
        "type": "number",
        "description": "用戶的預算範圍（台幣），例如 1000、5000 等"
      },
      "category": {
        "type": "string",
        "description": "商品分類，例如：後背包、側背包、腰包、零錢包、手提包、托特包、手機包、兩用包等"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "商品標籤，例如：[\"貓頭鷹\", \"熊貓\", \"恐龍\", \"老虎\", \"鯊魚\", \"兔子\", \"黑色\", \"灰色\", \"迷彩\", \"金線\", \"皮草\", \"尼龍\", \"XS\", \"S\", \"M\", \"L\", \"XL\"]"
      },
      "goal": {
        "type": "string",
        "description": "用戶想要達成的目標或改善的部分，例如：情緒穩定、專注力、行動力、人際關係、自我覺察、工作效率、生活品質等"
      },
      "limit": {
        "type": "number",
        "description": "最多返回的商品數量，預設為 5",
        "default": 5
      }
    },
    "required": []
  }
}
```

#### Function 2: `search_products_by_tags`

```json
{
  "name": "search_products_by_tags",
  "description": "根據商品標籤搜尋商品，例如搜尋特定動物、顏色、尺寸等",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "商品標籤列表，例如：[\"貓頭鷹\", \"黑色\", \"M\"]",
        "required": true
      }
    },
    "required": ["tags"]
  }
}
```

#### Function 3: `get_all_products`

```json
{
  "name": "get_all_products",
  "description": "取得所有可用的商品列表，用於了解目前有哪些商品可以推薦",
  "parameters": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "number",
        "description": "最多返回的商品數量",
        "default": 20
      }
    },
    "required": []
  }
}
```

### 步驟 2：確認後端 Function Calling 處理

**重要**：我們的後端已經實作了 Function Calling 的處理邏輯。

在 `lib/openai.ts` 的 `sendMessage` 函數中，我們會：

1. 檢測 Assistant 的 `requires_action` 狀態
2. 解析 Function Calling 請求
3. 調用 `lib/openai-functions.ts` 中的 `executeFunction` 執行對應的函數
4. 將結果返回給 Assistant
5. Assistant 根據結果生成最終回應

**確認事項**：
- ✅ 函數名稱必須與 JSON Schema 中的 `name` 完全一致
- ✅ 參數類型必須匹配（`limit` 在 schema 中是 `integer`，後端會自動轉換）
- ✅ 所有函數都已在 `lib/openai-functions.ts` 中實作

## 3. 環境變數設定

確保 `.env.local` 中有以下設定：

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

## 4. 測試 Function Calling

測試步驟：

1. 啟動後端服務器
2. 在聊天界面中與 Assistant 對話
3. 進入商品推薦階段
4. 提供條件（例如：「我想要一個黑色的貓頭鷹後背包，預算 3000 元」）
5. 檢查後端日誌，確認 Function Calling 是否被正確調用
6. 檢查 Assistant 的回應是否包含實際的商品推薦

## 5. 商品標籤和分類

目前資料庫中的商品已經自動添加了標籤和分類。標籤包括：

- **動物**：貓頭鷹、熊貓、恐龍、老虎、鯊魚、兔子、殺人鯨、倉鴞、海象
- **顏色**：黑色、灰色、綠色、藍色、紅色、粉色、紫色、黃色、白色、咖啡色、迷彩
- **尺寸**：XS、S、M、L、XL
- **類型**：後背包、側背包、腰包、零錢包、手提包、托特包、手機包、兩用包
- **材質**：金線、皮草、尼龍、羊毛、鉚釘
- **系列**：SCHOOL系列、正版

分類包括：後背包、側背包、腰包、零錢包、手提包、托特包、斜背包、手機包、兩用包、文具、其他

## 6. 疑難排解

### 問題：Function Calling 沒有被調用

**解決方案**：
1. 檢查 Assistant ID 是否正確設定
2. 檢查 `lib/openai.ts` 中的 `sendMessage` 函數是否正確處理 `requires_action` 狀態
3. 檢查後端日誌，查看是否有錯誤訊息

### 問題：商品推薦不準確

**解決方案**：
1. 確認商品標籤是否正確（可以執行 `scripts/add-product-tags.mjs` 重新生成標籤）
2. 檢查 Function Calling 的參數是否正確傳遞
3. 調整提示詞，讓 Assistant 更清楚如何使用 Function Calling

### 問題：Assistant 回應太慢

**解決方案**：
1. Function Calling 需要額外的 API 調用，這是正常的
2. 可以考慮使用 `gpt-4o-mini` 來加快回應速度（但可能降低準確度）
3. 優化 Function Calling 的執行時間（例如：減少查詢的商品數量）

