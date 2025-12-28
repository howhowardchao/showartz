# 系統優化報告

生成時間：2024年12月

## 📊 執行摘要

本報告分析了 showartz 系統的當前狀態，識別了多個優化機會，並按優先級分類。主要發現包括性能優化、代碼質量改進、安全性增強和可維護性提升等方面。

---

## 🔴 高優先級優化（建議立即處理）

### 1. 數據庫查詢優化 - Analytics Stats API

**位置**: `app/api/analytics/stats/route.ts`

**問題**:
- 執行多個獨立的數據庫查詢（8+ 個查詢）
- 使用字符串拼接 SQL（雖然是內部使用，但存在風險）
- 沒有使用參數化查詢處理 `timeFilter`
- 子查詢重複計算 `MIN(started_at)`

**優化建議**:
```typescript
// 優化前：多個獨立查詢
const visitorsResult = await client.query(`SELECT COUNT(DISTINCT visitor_id)...`);
const sessionsResult = await client.query(`SELECT COUNT(*)...`);
// ... 8+ 個查詢

// 優化後：合併查詢或使用 CTE
const statsResult = await client.query(`
  WITH time_range AS (
    SELECT 
      CASE 
        WHEN $1 = 'today' THEN CURRENT_DATE
        WHEN $1 = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN $1 = 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        ELSE CURRENT_DATE
      END as start_time
  ),
  session_stats AS (
    SELECT 
      COUNT(DISTINCT visitor_id) as total_visitors,
      COUNT(*) as total_sessions,
      AVG(duration_seconds) as avg_duration
    FROM sessions, time_range
    WHERE started_at >= time_range.start_time
  )
  SELECT * FROM session_stats;
`, [period]);
```

**預期效果**: 
- 查詢時間減少 60-80%
- 數據庫負載降低
- 響應時間改善

**修復難度**: 中等

---

### 2. 生產環境日誌管理

**位置**: 多個文件（`lib/` 目錄下 8 個文件，共 140+ 個 console 調用）

**問題**:
- 大量 `console.log` 在生產環境會影響性能
- 日誌文件可能過大
- 沒有日誌級別控制

**優化建議**:
```typescript
// 創建 lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args); // 錯誤始終記錄
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
};

// 或使用專業日誌庫（推薦）
// import pino from 'pino';
// export const logger = pino({
//   level: process.env.LOG_LEVEL || 'info',
//   ...(process.env.NODE_ENV === 'production' && {
//     transport: { target: 'pino-pretty' }
//   })
// });
```

**預期效果**:
- 生產環境日誌減少 80%+
- 性能提升 5-10%
- 日誌文件大小可控

**修復難度**: 簡單

---

### 3. 前端組件性能優化

**位置**: `components/admin/` 目錄下的管理組件

**問題**:
- 沒有使用 `React.memo` 防止不必要的重渲染
- 沒有使用 `useMemo` 和 `useCallback` 優化計算和函數
- 每次渲染都重新創建函數和對象

**優化建議**:
```typescript
// UserManager.tsx 優化示例
import { useMemo, useCallback } from 'react';

export default function UserManager() {
  // ... state declarations

  // 使用 useCallback 緩存函數
  const fetchUsers = useCallback(async () => {
    // ... fetch logic
  }, []);

  const handleUpdate = useCallback(async (id: string) => {
    // ... update logic
  }, [editData]);

  // 使用 useMemo 緩存計算結果
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filterStatus !== 'all' && user.status !== filterStatus) return false;
      if (filterMembership !== 'all' && user.membership_level !== filterMembership) return false;
      return true;
    });
  }, [users, filterStatus, filterMembership]);

  // ... rest of component
}
```

**預期效果**:
- 組件重渲染減少 30-50%
- 頁面響應速度提升
- 更好的用戶體驗

**修復難度**: 中等

---

## 🟡 中優先級優化（建議短期內處理）

### 4. API 響應緩存機制

**位置**: `app/api/products/route.ts`, `app/api/videos/route.ts` 等

**問題**:
- 商品列表、影片列表等數據沒有緩存
- 每次請求都查詢數據庫
- 對於不經常變更的數據，浪費資源

**優化建議**:
```typescript
// 使用 Next.js 的 revalidate 或 unstable_cache
import { unstable_cache } from 'next/cache';

export async function GET(request: NextRequest) {
  const getCachedProducts = unstable_cache(
    async () => {
      return await getAllProducts(filters);
    },
    ['products', JSON.stringify(filters)],
    {
      revalidate: 60, // 60秒緩存
      tags: ['products']
    }
  );

  const products = await getCachedProducts();
  return NextResponse.json(products);
}
```

**預期效果**:
- API 響應時間減少 70-90%（緩存命中時）
- 數據庫負載降低
- 更好的擴展性

**修復難度**: 簡單

---

### 5. 數據庫連接池優化

**位置**: `lib/db.ts`

**當前狀態**: ✅ 已配置連接池（max: 20）

**可優化點**:
- 添加連接池監控
- 優化連接參數
- 添加連接健康檢查

**優化建議**:
```typescript
// 添加連接池監控
poolInstance.on('connect', (client) => {
  console.log('[DB] New client connected');
});

poolInstance.on('remove', (client) => {
  console.log('[DB] Client removed from pool');
});

// 添加連接池統計
export function getPoolStats() {
  return {
    totalCount: poolInstance?.totalCount || 0,
    idleCount: poolInstance?.idleCount || 0,
    waitingCount: poolInstance?.waitingCount || 0,
  };
}
```

**修復難度**: 簡單

---

### 6. 錯誤處理統一化

**位置**: 多個 API 路由

**問題**:
- 錯誤響應格式不一致
- 有些返回 `error`，有些返回 `details`
- 錯誤代碼不統一

**優化建議**:
```typescript
// 創建 lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string
  ) {
    super(message);
  }

  toJSON() {
    return {
      error: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

// 統一錯誤處理中間件
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**修復難度**: 中等

---

### 7. 輸入驗證增強

**位置**: API 路由（特別是 POST/PUT 請求）

**問題**:
- 缺少統一的輸入驗證
- 驗證邏輯分散在各個路由中
- 沒有使用驗證庫

**優化建議**:
```typescript
// 使用 zod 進行輸入驗證
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  membership_level: z.enum(['regular', 'premium', 'vip']).optional(),
  email_verified: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateUserSchema.parse(body);
    // ... rest of logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

**修復難度**: 中等

---

## 🟢 低優先級優化（可選，長期改進）

### 8. 代碼重複消除

**位置**: `components/admin/` 目錄

**問題**:
- UserManager、ProductManager、VideoManager 等組件有相似的結構
- 重複的 CRUD 邏輯
- 重複的表格渲染邏輯

**優化建議**:
```typescript
// 創建通用管理組件
export function GenericManager<T>({
  fetchItems,
  updateItem,
  deleteItem,
  columns,
  // ...
}: GenericManagerProps<T>) {
  // 通用邏輯
}
```

**修復難度**: 高（需要重構）

---

### 9. 類型安全改進

**位置**: 多個文件

**問題**:
- 部分地方使用 `any` 類型
- 缺少嚴格的類型檢查

**優化建議**:
- 啟用更嚴格的 TypeScript 配置
- 移除所有 `any` 類型
- 使用類型守衛（type guards）

**修復難度**: 中等

---

### 10. 批量操作優化

**位置**: `lib/shopee-sync.ts`, `lib/pinkoi-sync.ts`

**問題**:
- 同步時逐個處理商品
- 可以批量插入/更新

**優化建議**:
```typescript
// 使用批量插入
await client.query(`
  INSERT INTO products (shopee_item_id, name, price, ...)
  SELECT * FROM UNNEST($1::bigint[], $2::text[], $3::decimal[], ...)
  ON CONFLICT (shopee_item_id) DO UPDATE SET ...
`, [itemIds, names, prices, ...]);
```

**修復難度**: 中等

---

## 📈 優化優先級總結

| 優先級 | 優化項目 | 影響範圍 | 修復難度 | 預期效果 |
|--------|---------|---------|---------|---------|
| 🔴 高 | Analytics 查詢優化 | 性能 | 中等 | 60-80% 性能提升 |
| 🔴 高 | 日誌管理 | 性能/可維護性 | 簡單 | 5-10% 性能提升 |
| 🔴 高 | 前端組件優化 | 用戶體驗 | 中等 | 30-50% 渲染優化 |
| 🟡 中 | API 緩存 | 性能/擴展性 | 簡單 | 70-90% 響應時間減少 |
| 🟡 中 | 錯誤處理統一 | 可維護性 | 中等 | 代碼質量提升 |
| 🟡 中 | 輸入驗證 | 安全性 | 中等 | 安全性提升 |
| 🟢 低 | 代碼重複消除 | 可維護性 | 高 | 代碼質量提升 |
| 🟢 低 | 類型安全 | 代碼質量 | 中等 | 開發體驗提升 |
| 🟢 低 | 批量操作 | 性能 | 中等 | 同步速度提升 |

---

## 🛠️ 建議的實施順序

### 第一階段（立即，1-2天）
1. ✅ 日誌管理優化（簡單，影響大）
2. ✅ API 緩存機制（簡單，性能提升明顯）

### 第二階段（短期，1週內）
3. ✅ Analytics 查詢優化（中等難度，性能提升大）
4. ✅ 前端組件性能優化（中等難度，用戶體驗提升）
5. ✅ 錯誤處理統一化（中等難度，可維護性提升）

### 第三階段（中期，2-4週）
6. ✅ 輸入驗證增強（中等難度，安全性提升）
7. ✅ 批量操作優化（中等難度，性能提升）

### 第四階段（長期，1-3個月）
8. ✅ 代碼重複消除（高難度，需要重構）
9. ✅ 類型安全改進（中等難度，持續改進）

---

## 📝 注意事項

1. **測試覆蓋**: 在實施優化前，確保有足夠的測試覆蓋
2. **漸進式改進**: 不要一次性實施所有優化，逐步進行
3. **監控**: 實施優化後，密切監控性能指標
4. **文檔**: 更新相關文檔，記錄優化決策

---

## 🔗 相關文檔

- [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md) - 之前的優化報告
- [ANALYSIS_REPORT.md](./ANALYSIS_REPORT.md) - 系統分析報告

---

**報告生成時間**: 2024年12月
**分析範圍**: 完整代碼庫
**建議優先級**: 基於影響範圍、修復難度和預期效果綜合評估

