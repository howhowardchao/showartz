import { scrapeShopeeStore, ShopeeProduct } from './shopee-scraper';
import { upsertProductFromShopee, getAllProducts, getShopeeProductIds, deactivateShopeeProducts } from './db';

export interface SyncResult {
  success: number;
  failed: number;
  total: number;
  deactivated?: number; // 已下架的商品數量
  errors?: string[];
}

// 定時同步任務
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

/**
 * 同步蝦皮商品到資料庫
 */
export async function syncProductsFromShopee(shopId: number = 62981645): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    total: 0,
    errors: [],
  };

  try {
    console.log(`Starting sync for shop ${shopId}...`);
    
    // 從蝦皮獲取商品
    const products = await scrapeShopeeStore(shopId);
    result.total = products.length;

    if (products.length === 0) {
      console.warn('No products found from Shopee');
      return result;
    }

    console.log(`Found ${products.length} products, syncing to database...`);

    // 獲取本次同步的商品 ID 列表
    const syncedItemIds = products.map(p => p.item_id);

    // 將每個商品同步到資料庫
    for (const product of products) {
      try {
        await upsertProductFromShopee({
          shopee_item_id: product.item_id,
          shopee_shop_id: product.shop_id,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          image_url: product.images?.[0]?.startsWith('http') ? product.images[0] : undefined,
          image_urls: product.images?.filter(img => img && img.startsWith('http')) || undefined,
          shopee_url: product.url,
          category: product.category,
          tags: [], // 標籤可以後續手動添加或通過 AI 分析生成
          stock: product.stock || 0,
          sales_count: product.sales_count || 0,
          rating: product.rating,
        });
        result.success++;
      } catch (error: any) {
        result.failed++;
        const errorMsg = `Failed to sync product ${product.item_id}: ${error?.message || String(error)}`;
        result.errors?.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // 處理已下架的商品：找出資料庫中有但本次同步沒有的商品
    try {
      const dbItemIds = await getShopeeProductIds(shopId);
      const missingItemIds = dbItemIds.filter(id => !syncedItemIds.includes(id));
      
      if (missingItemIds.length > 0) {
        const deactivatedCount = await deactivateShopeeProducts(shopId, missingItemIds);
        result.deactivated = deactivatedCount;
        console.log(`Marked ${deactivatedCount} Shopee products as inactive (removed from store)`);
        if (result.errors) {
          result.errors.push(`已下架 ${deactivatedCount} 個商品（商店中已移除）`);
        }
      }
    } catch (error: any) {
      console.error('Error deactivating missing products:', error);
      if (result.errors) {
        result.errors.push(`處理已下架商品時發生錯誤: ${error?.message || String(error)}`);
      }
    }

    console.log(`Sync completed: ${result.success} success, ${result.failed} failed`);
    return result;
  } catch (error: any) {
    console.error('Error syncing products from Shopee:', error);
    result.errors?.push(`Sync failed: ${error?.message || String(error)}`);
    return result;
  }
}

/**
 * 獲取同步狀態（最後同步時間、商品數量等）
 */
export async function getSyncStatus() {
  try {
    const products = await getAllProducts({ isActive: true });
    const lastSyncedProducts = products
      .filter(p => p.last_synced_at)
      .sort((a, b) => {
        const timeA = a.last_synced_at ? new Date(a.last_synced_at).getTime() : 0;
        const timeB = b.last_synced_at ? new Date(b.last_synced_at).getTime() : 0;
        return timeB - timeA;
      });

    const lastSyncTime = lastSyncedProducts[0]?.last_synced_at || null;

    return {
      totalProducts: products.length,
      lastSyncTime,
      productsSynced: lastSyncedProducts.length,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      totalProducts: 0,
      lastSyncTime: null,
      productsSynced: 0,
    };
  }
}

/**
 * 啟動定時同步任務
 * @param shopId 商店 ID
 * @param intervalMs 同步間隔（毫秒），預設 30 分鐘
 */
export function startAutoSync(shopId: number = 62981645, intervalMs?: number) {
  // 如果已經有同步任務在運行，先停止
  stopAutoSync();

  const interval = intervalMs || parseInt(process.env.SHOPEE_SYNC_INTERVAL || '1800000', 10);
  
  console.log(`Starting auto sync for shop ${shopId} with interval ${interval}ms (${interval / 60000} minutes)`);

  // 立即執行一次同步
  syncProductsFromShopee(shopId).catch(error => {
    console.error('Initial sync failed:', error);
  });

  // 設定定時同步
  syncInterval = setInterval(async () => {
    if (isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    isSyncing = true;
    try {
      console.log(`[${new Date().toISOString()}] Starting scheduled sync...`);
      const result = await syncProductsFromShopee(shopId);
      console.log(`[${new Date().toISOString()}] Sync completed: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduled sync failed:`, error);
    } finally {
      isSyncing = false;
    }
  }, interval);
}

/**
 * 停止定時同步任務
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto sync stopped');
  }
}

/**
 * 檢查定時同步是否正在運行
 */
export function isAutoSyncRunning(): boolean {
  return syncInterval !== null;
}

