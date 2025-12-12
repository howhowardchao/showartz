# 程式碼優化報告

## 🔍 發現的問題與優化建議

### 🔴 高優先級（需要立即修復）

#### 1. OpenAI API 調用參數順序錯誤
**位置**: `lib/openai.ts`
- **第 106 行**: `retrieve` 調用參數順序不正確
- **第 154 行**: `submitToolOutputs` 調用參數順序不正確

**問題**:
```typescript
// 當前（錯誤）
let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
run = await openai.beta.threads.runs.submitToolOutputs(run.id, {
  thread_id: threadId,
  tool_outputs: toolOutputs,
});

// 應該改為
let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
  tool_outputs: toolOutputs,
});
```

**影響**: 可能導致 Function Calling 功能異常

---

### 🟡 中優先級（建議修復）

#### 2. 生產環境日誌過多
**位置**: 多個文件（`lib/shopee-scraper.ts`, `lib/pinkoi-scraper.ts`, `lib/openai.ts` 等）

**問題**: 大量 `console.log` 在生產環境會影響性能並產生大量日誌

**建議**:
- 使用日誌級別控制（如 `winston` 或 `pino`）
- 或至少添加環境變數檢查：`if (process.env.NODE_ENV === 'development')`

**影響**: 性能下降、日誌文件過大

---

#### 3. 聊天限流器使用內存存儲
**位置**: `lib/chat-limiter.ts`

**問題**: 使用 `Map` 存儲 IP 狀態，在多實例部署時無法共享狀態

**建議**:
- 生產環境使用 Redis 存儲
- 或至少添加文檔說明當前限制

**影響**: 無法在多實例環境中正確限流

---

#### 4. 資料庫連接池配置
**位置**: `lib/db.ts`

**問題**: 沒有設置連接池大小限制

**建議**:
```typescript
const pool = new Pool({
  ...getDatabaseConfig(),
  max: 20, // 最大連接數
  idleTimeoutMillis: 30000, // 空閒連接超時
  connectionTimeoutMillis: 2000, // 連接超時
});
```

**影響**: 可能導致資料庫連接過多

---

#### 5. 錯誤處理不一致
**位置**: 多個 API 路由

**問題**: 錯誤訊息格式不一致，有些返回 `error`，有些返回 `details`

**建議**: 統一錯誤回應格式

---

### 🟢 低優先級（可選優化）

#### 6. 類型安全改進
**位置**: 多個文件

**問題**: 部分地方使用 `any` 類型

**建議**: 使用更嚴格的類型定義

---

#### 7. 同步邏輯優化
**位置**: `lib/shopee-sync.ts`, `lib/pinkoi-sync.ts`

**問題**: 同步時逐個處理商品，可以批量處理

**建議**: 使用批量插入/更新（PostgreSQL 的 `UNNEST` 或批量操作）

**影響**: 大量商品時性能較差

---

#### 8. 重複代碼
**位置**: `lib/shopee-sync.ts` 和 `lib/pinkoi-sync.ts`

**問題**: 兩個文件的同步邏輯非常相似

**建議**: 提取共同邏輯到共用函數

---

#### 9. 缺少輸入驗證
**位置**: API 路由

**問題**: 部分 API 缺少輸入驗證（如長度限制、格式驗證）

**建議**: 使用 `zod` 或類似庫進行輸入驗證

---

#### 10. 缺少 API 速率限制
**位置**: API 路由（除了 `/api/search`）

**問題**: 其他 API 端點沒有速率限制

**建議**: 添加全局速率限制中間件

---

## 📊 優化優先級總結

| 優先級 | 問題 | 影響 | 修復難度 |
|--------|------|------|----------|
| 🔴 高 | OpenAI API 參數順序 | 功能異常 | 簡單 |
| 🟡 中 | 生產環境日誌 | 性能 | 中等 |
| 🟡 中 | 內存限流器 | 擴展性 | 中等 |
| 🟡 中 | 連接池配置 | 穩定性 | 簡單 |
| 🟡 中 | 錯誤處理 | 可維護性 | 簡單 |
| 🟢 低 | 類型安全 | 代碼質量 | 中等 |
| 🟢 低 | 批量操作 | 性能 | 中等 |
| 🟢 低 | 代碼重複 | 可維護性 | 中等 |

---

## 🛠️ 建議的修復順序

1. **立即修復**: OpenAI API 參數順序（高優先級）
2. **短期**: 生產環境日誌控制、連接池配置、錯誤處理統一
3. **中期**: 限流器改為 Redis、批量操作優化
4. **長期**: 類型安全改進、代碼重構、輸入驗證

---

## ✅ 已做好的部分

1. ✅ SQL 注入防護：所有查詢都使用參數化查詢
2. ✅ 環境變數管理：正確使用 `.env` 文件
3. ✅ Docker 配置：多階段構建、非 root 用戶
4. ✅ 資料庫索引：關鍵欄位都有索引
5. ✅ 錯誤處理：大部分地方都有 try-catch
6. ✅ 類型定義：有完整的 TypeScript 類型定義

