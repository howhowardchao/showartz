/**
 * Pinkoi 商品同步到資料庫
 */

import { scrapePinkoiStore, PinkoiProduct } from './pinkoi-scraper';
import { upsertProductFromPinkoi, getPinkoiProductIds, deactivatePinkoiProducts } from './db';

export interface SyncResult {
  success: number;
  failed: number;
  total: number;
  deactivated?: number; // 已下架的商品數量
  errors?: string[];
}

/**
 * 同步 Pinkoi 商品到資料庫
 */
export async function syncProductsFromPinkoi(storeId: string = 'showartz'): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    total: 0,
    errors: [],
  };

  try {
    console.log(`Starting Pinkoi sync for store ${storeId}...`);
    
    // 從 Pinkoi 獲取商品
    const products = await scrapePinkoiStore(storeId);
    result.total = products.length;

    if (products.length === 0) {
      console.warn('No products found from Pinkoi');
      return result;
    }

    console.log(`Found ${products.length} products, syncing to database...`);

    // 獲取本次同步的商品 ID 列表
    const syncedProductIds = products.map(p => p.product_id);

    // 將每個商品同步到資料庫
    for (const product of products) {
      try {
        await upsertProductFromPinkoi({
          pinkoi_product_id: product.product_id,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          image_url: product.images?.[0]?.startsWith('http') ? product.images[0] : undefined,
          image_urls: product.images?.filter(img => img && img.startsWith('http')) || undefined,
          pinkoi_url: product.url,
          category: product.category,
          tags: product.tags || [],
          stock: product.stock || 0,
          sales_count: product.sales_count || 0,
          rating: product.rating,
        });
        result.success++;
      } catch (error: any) {
        result.failed++;
        const errorMsg = `Failed to sync product ${product.product_id}: ${error?.message || String(error)}`;
        result.errors?.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // 處理已下架的商品：找出資料庫中有但本次同步沒有的商品
    try {
      const dbProductIds = await getPinkoiProductIds();
      const missingProductIds = dbProductIds.filter(id => !syncedProductIds.includes(id));
      
      if (missingProductIds.length > 0) {
        const deactivatedCount = await deactivatePinkoiProducts(missingProductIds);
        result.deactivated = deactivatedCount;
        console.log(`Marked ${deactivatedCount} Pinkoi products as inactive (removed from store)`);
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

    console.log(`Pinkoi sync completed: ${result.success} success, ${result.failed} failed`);
    return result;
  } catch (error: any) {
    console.error('Error syncing products from Pinkoi:', error);
    result.errors?.push(error?.message || String(error));
    return result;
  }
}

/**
 * 獲取同步狀態
 */
export async function getSyncStatus() {
  // 可以添加更複雜的狀態追蹤邏輯
  return {
    isSyncing: false,
    lastSyncTime: null,
  };
}

