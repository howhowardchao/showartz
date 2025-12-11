/**
 * 替代方案：使用不同的方法獲取 Shopee 商品
 * 
 * 方案 1: 使用 Shopee Open Platform API (需要申請)
 * 方案 2: 使用 RSS Feed (如果可用)
 * 方案 3: 使用 Sitemap
 * 方案 4: 手動從商品頁面提取
 */

import axios from 'axios';

/**
 * 方案 1: 嘗試使用 Shopee Open Platform API
 * 需要申請 API Key 和 Partner ID
 */
export async function fetchShopeeProductsViaOpenAPI(
  shopId: number,
  apiKey?: string,
  partnerId?: number
): Promise<any[]> {
  if (!apiKey || !partnerId) {
    console.log('[Open API] API credentials not provided');
    return [];
  }

  try {
    // Shopee Open Platform API 端點
    const endpoint = 'https://partner.shopeemobile.com/api/v2/product/get_item_list';
    
    const response = await axios.post(endpoint, {
      shop_id: shopId,
      pagination_offset: 0,
      pagination_entries_per_page: 100,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data?.response?.item || [];
  } catch (error) {
    console.error('[Open API] Error:', error);
    return [];
  }
}

/**
 * 方案 2: 從商品頁面 URL 列表手動提取
 * 如果知道商品 ID 列表，可以直接訪問商品頁面
 */
export async function fetchProductDetailsFromURLs(urls: string[]): Promise<any[]> {
  const products = [];
  
  for (const url of urls) {
    try {
      // 從 URL 提取商品 ID
      const match = url.match(/\/product\/(\d+)\/(\d+)/);
      if (match) {
        const shopId = parseInt(match[1]);
        const itemId = parseInt(match[2]);
        
        // 訪問商品頁面獲取詳細資訊
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });

        // 從 HTML 中提取商品資訊（需要解析）
        // 這裡只是示例，實際需要根據頁面結構調整
        products.push({
          item_id: itemId,
          shop_id: shopId,
          url: url,
        });
      }
    } catch (error) {
      console.error(`Error fetching product from ${url}:`, error);
    }
  }

  return products;
}

/**
 * 方案 3: 使用商品 ID 列表批量獲取
 * 如果知道商品 ID，可以直接構建商品頁面 URL
 */
export function generateProductURLs(shopId: number, itemIds: number[]): string[] {
  return itemIds.map(itemId => 
    `https://shopee.tw/product/${shopId}/${itemId}`
  );
}

/**
 * 方案 4: 從商店頁面的 HTML 中提取所有商品連結
 * 這是一個更簡單的方法，直接解析 HTML
 */
export function extractProductLinksFromHTML(html: string): string[] {
  const links: string[] = [];
  
  // 使用正則表達式提取所有商品連結
  const productLinkRegex = /https?:\/\/[^"'\s]+\/product\/\d+\/\d+/g;
  const matches = html.match(productLinkRegex);
  
  if (matches) {
    // 去重
    const uniqueLinks = [...new Set(matches)];
    links.push(...uniqueLinks);
  }
  
  return links;
}

