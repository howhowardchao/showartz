/**
 * Pinkoi 商品爬蟲
 * 使用 Pinkoi 的公開 API 獲取商品列表
 */

import axios from 'axios';

export interface PinkoiProduct {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  url: string;
  stock?: number;
  sales_count?: number;
  rating?: number;
  category?: string;
  tags?: string[];
}

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

type PageLike = {
  goto: (url: string, options?: Record<string, unknown>) => Promise<unknown>;
  evaluate: (pageFunction: (...args: any[]) => any, ...args: any[]) => Promise<any>;
};

/**
 * 從 Pinkoi API 獲取商品列表
 */
export async function fetchPinkoiProducts(storeId: string = 'showartz'): Promise<PinkoiProduct[]> {
  try {
    console.log(`[Pinkoi Scraper] Fetching products for store: ${storeId}...`);
    
    const products: PinkoiProduct[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 10; // 限制最多爬取 10 頁，避免無限循環
    
    while (hasMore && page <= maxPages) {
      try {
        // Pinkoi 的商品列表 API
        const apiUrl = `https://www.pinkoi.com/apiv3/shop/search_product?front_busting=20230927&owner=${storeId}&page=${page}`;
        
        console.log(`[Pinkoi Scraper] Fetching page ${page}...`);
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://www.pinkoi.com/store/${storeId}`,
            'Accept': 'application/json',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          },
          timeout: 10000,
        });

        console.log(`[Pinkoi Scraper] Response status: ${response.status}`);
        
        const data = response.data as Record<string, unknown>;
        
        // 解析回應資料 - Pinkoi API 格式：{ products: [...], pagination: {...} }
        let items: unknown[] = [];
        
        if (Array.isArray((data as { products?: unknown }).products)) {
          items = (data as { products: unknown[] }).products;
        } else if (
          (data as { data?: { products?: unknown[] } }).data &&
          Array.isArray((data as { data?: { products?: unknown[] } }).data?.products)
        ) {
          items = (data as { data: { products: unknown[] } }).data.products;
        } else if (Array.isArray(data)) {
          items = data as unknown[];
        }
        
        console.log(`[Pinkoi Scraper] Found ${items.length} products on page ${page}`);
        
        if (items.length === 0) {
          hasMore = false;
          break;
        }
        
        // 轉換為標準格式
        for (const item of items as Array<Record<string, unknown>>) {
          try {
            // 解析價格格式：$$TWD$$1860$$ -> 1860
            let price = 0;
            const priceSource = item.price;
            if (typeof priceSource === 'string') {
              const priceMatch = priceSource.match(/\$\$[A-Z]+\$\$(\d+)\$\$/);
              price = priceMatch ? parseFloat(priceMatch[1]) : parseFloat(priceSource.replace(/[^\d.]/g, '')) || 0;
            } else if (typeof priceSource === 'number') {
              price = priceSource;
            }
            
            // 解析原價
            let originalPrice: number | undefined;
            const opriceSource = item.oprice;
            if (typeof opriceSource === 'string') {
              const opriceMatch = opriceSource.match(/\$\$[A-Z]+\$\$(\d+)\$\$/);
              originalPrice = opriceMatch ? parseFloat(opriceMatch[1]) : undefined;
            } else if (typeof opriceSource === 'number') {
              originalPrice = opriceSource;
            }
            
            // 構建商品 URL
            const productUrl = item.tid 
              ? `https://www.pinkoi.com/product/${item.tid}`
              : `https://www.pinkoi.com/product/${(item as { product_id?: unknown; id?: unknown }).product_id || (item as { id?: unknown }).id}`;
            
            // 構建圖片 URL - Pinkoi 的圖片格式：https://cdn01.pinkoi.com/product/[tid]/0/800x0.jpg
            // 主要來源使用 tid，其次 product_id，再次 id，避免重覆定義
            const productIdFromItem = (item.tid || (item as { product_id?: unknown }).product_id || (item as { id?: unknown }).id || '') as string;
            const images: string[] = [];
            
            // 嘗試從 item 中提取圖片（如果有的話）
            if (Array.isArray((item as { images?: unknown }).images)) {
              images.push(...((item as { images: string[] }).images.filter(img => !img.includes('space.gif'))));
            } else if (Array.isArray((item as { image_urls?: unknown }).image_urls)) {
              images.push(...((item as { image_urls: string[] }).image_urls.filter(img => !img.includes('space.gif'))));
            } else if (typeof (item as { image?: unknown }).image === 'string') {
              const imageUrl = (item as { image: string }).image;
              if (!imageUrl.includes('space.gif')) {
                images.push(imageUrl);
              }
            }
            
            // 如果沒有圖片，直接構建 Pinkoi 的標準圖片 URL
            if (images.length === 0 && productIdFromItem) {
              // Pinkoi 的圖片格式：https://cdn01.pinkoi.com/product/[tid]/0/800x0.jpg
              // 使用標準格式構建圖片 URL
              images.push(`https://cdn01.pinkoi.com/product/${productIdFromItem}/0/800x0.jpg`);
            }
            
            const product: PinkoiProduct = {
              product_id: productId,
              name: (item.title as string) || (item.name as string) || (item.product_name as string) || '',
              description: (item.description as string) || (item.desc as string) || (item.summary as string) || undefined,
              price: price,
              original_price: originalPrice,
              images: images,
              url: productUrl,
              stock: (item.stock as number) || (item.quantity as number) || (item.inventory as number) || undefined,
              sales_count: (item.sold_count as number) || (item.sold as number) || (item.sales_count as number) || undefined,
              rating: (item.review_info as { score?: number })?.score ? ((item.review_info as { score?: number }).score ?? 0) / 10 : undefined, // Pinkoi 評分是 0-50，轉換為 0-5
              category: (item.category_name as string) || ((item.category as unknown)?.toString() ?? undefined),
              tags: (item.tags as string[]) || (item.tag_list as string[]) || undefined,
            };
            
            // 驗證必要欄位
            if (product.product_id && product.name && product.price > 0) {
              products.push(product);
            }
          } catch (error) {
            console.warn(`[Pinkoi Scraper] Error parsing product item:`, error);
            continue;
          }
        }
        
        // 檢查是否還有更多頁面
        const pagination = (data as { pagination?: { next_page?: unknown; page?: unknown; page_count?: unknown } }).pagination;
        if (pagination && typeof pagination === 'object') {
          const nextPage = (pagination as { next_page?: unknown }).next_page;
          hasMore = nextPage !== null && nextPage !== undefined;
          const pageNo = (pagination as { page?: unknown }).page ?? '?';
          const pageCount = (pagination as { page_count?: unknown }).page_count ?? '?';
          console.log(`[Pinkoi Scraper] Pagination: page ${pageNo}/${pageCount}, hasMore: ${hasMore}`);
        } else if (items.length < 20) { // 假設每頁 20 個商品
          hasMore = false;
        }
        
        page++;
        
        // 避免請求過快
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: unknown) {
        console.error(`[Pinkoi Scraper] Error fetching page ${page}:`, toErrorMessage(error));
        hasMore = false;
        break;
      }
    }
    
    console.log(`[Pinkoi Scraper] Total products found: ${products.length}`);
    
    // 為所有商品獲取圖片（從商品列表頁面）
    if (products.length > 0) {
      console.log(`[Pinkoi Scraper] Fetching images for all products...`);
      await fetchProductImages(products, storeId);
    }
    
    return products;
    
  } catch (error) {
    console.error('[Pinkoi Scraper] Error fetching products:', error);
    return [];
  }
}

/**
 * 批量獲取商品圖片
 * 通過訪問商品列表頁面提取圖片（更高效）
 */
async function fetchProductImages(products: PinkoiProduct[], storeId: string): Promise<void> {
  try {
    const puppeteer = await import('puppeteer').catch(() => null);
    
    if (!puppeteer) {
      console.warn('[Pinkoi Scraper] Puppeteer not available, skipping image fetch');
      return;
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      console.log(`[Pinkoi Scraper] Fetching images from store page: ${storeId}`);
      
      await page.goto(`https://www.pinkoi.com/store/${storeId}`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      
      // 等待頁面載入
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 滾動頁面以載入所有商品（多次滾動確保載入完整）
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10;
      
      while (scrollAttempts < maxScrollAttempts) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const currentHeight = await page.evaluate(() => document.body.scrollHeight);
        if (currentHeight === previousHeight) {
          break;
        }
        previousHeight = currentHeight;
        scrollAttempts++;
      }
      
      // 提取所有商品的圖片
      const productImages = await page.evaluate(() => {
        const productMap: Record<string, string[]> = {};
        
        // 方法 1: 查找所有商品連結及其對應的圖片
        const productLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/product/"]');
        
        productLinks.forEach((link) => {
          const href = link.getAttribute('href') || link.href || '';
          const match = href.match(/\/product\/([^\/\?]+)/);
          if (match) {
            const productIdFromLink = match[1];
            
            // 向上查找父元素中的圖片（最多向上 5 層）
            let current: HTMLElement | null = link;
            for (let i = 0; i < 8 && current; i++) {
              const imgs = current.querySelectorAll<HTMLImageElement>('img');
              for (const img of Array.from(imgs)) {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
                if (src && (src.includes('cdn') || src.includes('pinkoi')) && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('banner') && !src.includes('space.gif')) {
                  let fullUrl = src;
                  if (!fullUrl.startsWith('http')) {
                    fullUrl = fullUrl.startsWith('//') ? `https:${fullUrl}` : `https://www.pinkoi.com${fullUrl}`;
                  }
                  
                  // 優化圖片 URL：使用 800x0 尺寸（Pinkoi 的標準格式）
                  fullUrl = fullUrl.replace(/\/\d+x\d+\.(jpg|png|webp|avif)/, '/800x0.$1');
                  // 如果沒有尺寸參數，添加一個
                  if (!fullUrl.match(/\/\d+x\d+\.(jpg|png|webp|avif)/)) {
                    fullUrl = fullUrl.replace(/\.(jpg|png|webp|avif)/, '/800x0.$1');
                  }
                  
                  if (!productMap[productIdFromLink]) {
                    productMap[productIdFromLink] = [];
                  }
                  if (!productMap[productIdFromLink].includes(fullUrl)) {
                    productMap[productIdFromLink].push(fullUrl);
                  }
                }
              }
              if (productMap[productId] && productMap[productId].length > 0) {
                break; // 找到圖片就停止
              }
              current = current.parentElement;
            }
          }
        });
        
        // 方法 2: 直接從所有圖片 URL 中提取商品 ID（更可靠的方法）
        const allImages = document.querySelectorAll<HTMLImageElement>('img');
        allImages.forEach((img) => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          if (src && src.includes('product') && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('banner') && !src.includes('space.gif')) {
            // 從圖片 URL 中提取商品 ID：/product/[productId]/...
            const match = src.match(/\/product\/([^\/]+)\//);
            if (match) {
              const productIdFromImg = match[1];
              let fullUrl = src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : `https://www.pinkoi.com${src}`);
              
              // 優化圖片 URL
              fullUrl = fullUrl.replace(/\/\d+x\d+\.(jpg|png|webp|avif)/, '/800x0.$1');
              if (!fullUrl.match(/\/\d+x\d+\.(jpg|png|webp|avif)/)) {
                fullUrl = fullUrl.replace(/\.(jpg|png|webp|avif)/, '/800x0.$1');
              }
              
              if (!productMap[productIdFromImg]) {
                productMap[productIdFromImg] = [];
              }
              if (!productMap[productIdFromImg].includes(fullUrl)) {
                productMap[productIdFromImg].push(fullUrl);
              }
            }
          }
        });
        
        return productMap;
      });
      
      // 將圖片分配給對應的商品（優先使用從頁面提取的圖片）
      let foundCount = 0;
      for (const product of products) {
        if (productImages[product.product_id] && productImages[product.product_id].length > 0) {
          // 使用從頁面提取的圖片，並過濾掉占位圖片
          product.images = productImages[product.product_id].filter(img => !img.includes('space.gif'));
          foundCount++;
          console.log(`[Pinkoi Scraper] Product ${product.product_id}: Using extracted image`);
        } else {
          // 如果沒有從頁面提取到圖片，確保使用構建的默認 URL
          if (!product.images || product.images.length === 0) {
            product.images = [`https://cdn01.pinkoi.com/product/${product.product_id}/0/800x0.jpg`];
            console.log(`[Pinkoi Scraper] Product ${product.product_id}: Using constructed image URL`);
          }
          foundCount++;
        }
      }
      
      console.log(`[Pinkoi Scraper] Images assigned to ${foundCount}/${products.length} products`);
      
      // 如果還有商品沒有圖片，嘗試訪問商品詳情頁面獲取
      const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
      if (productsWithoutImages.length > 0 && productsWithoutImages.length <= 30) {
        console.log(`[Pinkoi Scraper] Fetching images from product detail pages for ${productsWithoutImages.length} products...`);
        await fetchImagesFromDetailPages(productsWithoutImages, page);
      } else if (productsWithoutImages.length > 0) {
        console.log(`[Pinkoi Scraper] Too many products without images (${productsWithoutImages.length}), skipping detail page fetch`);
      }
      
      await browser.close();
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('[Pinkoi Scraper] Error in fetchProductImages:', error);
  }
}

/**
 * 從商品詳情頁面獲取圖片（用於沒有圖片的商品）
 */
async function fetchImagesFromDetailPages(products: PinkoiProduct[], page: PageLike): Promise<void> {
  for (const product of products) {
    try {
      await page.goto(product.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const images = await page.evaluate((productId: string) => {
        const imageUrls: string[] = [];
        
        // 方法 1: 從圖片元素提取
        const imgElements = document.querySelectorAll<HTMLImageElement>('img[src*="product"], img[data-src*="product"], img[src*="cdn"], img[data-src*="cdn"]');
        
        imgElements.forEach((img) => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          if (src && (src.includes('product') || src.includes('cdn')) && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('banner') && !src.includes('space.gif')) {
            let fullUrl = src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : `https://www.pinkoi.com${src}`);
            // 確保使用高解析度圖片
            fullUrl = fullUrl.replace(/\/\d+x\d+\.(jpg|png|webp|avif)/, '/800x0.$1');
            if (!imageUrls.includes(fullUrl)) {
              imageUrls.push(fullUrl);
            }
          }
        });
        
        // 方法 2: 如果沒有找到，直接構建 URL
        if (imageUrls.length === 0 && productId) {
          imageUrls.push(`https://cdn01.pinkoi.com/product/${productId}/0/800x0.jpg`);
        }
        
        return imageUrls.slice(0, 5);
      }, product.product_id);
      
      if (images.length > 0) {
        product.images = images;
        console.log(`[Pinkoi Scraper] Found ${images.length} images for product ${product.product_id} from detail page`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`[Pinkoi Scraper] Error fetching images for ${product.product_id}:`, error);
      // 如果訪問失敗，至少使用構建的默認 URL
      if (!product.images || product.images.length === 0) {
        product.images = [`https://cdn01.pinkoi.com/product/${product.product_id}/0/800x0.jpg`];
      }
    }
  }
}

/**
 * 使用 Puppeteer 作為備選方案（如果 API 失敗）
 */
export async function scrapePinkoiProductsPuppeteer(storeId: string = 'showartz'): Promise<PinkoiProduct[]> {
  try {
    const puppeteer = await import('puppeteer').catch(() => null);
    
    if (!puppeteer) {
      console.warn('[Pinkoi Scraper] Puppeteer is not installed');
      return [];
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      await page.setViewport({ width: 1920, height: 1080 });
      
      const products: PinkoiProduct[] = [];
      
      // 監聽 API 請求
      page.on('response', (response) => {
        // 使用立即執行的 async 函數來處理異步操作，確保錯誤被捕獲
        (async () => {
          try {
            const url = response.url();
            if (url.includes('apiv3/shop/search_product')) {
              try {
                const data = await response.json();
                const items = data.data?.products || data.products || [];
                
                for (const item of items) {
                  products.push({
                    product_id: item.product_id || item.id || '',
                    name: item.name || item.title || '',
                    price: parseFloat(item.price || '0') || 0,
                    images: item.images || [],
                    url: item.url || `https://www.pinkoi.com/product/${item.product_id}`,
                  });
                }
              } catch (error: unknown) {
                // 忽略 JSON 解析錯誤
                console.log(`[Pinkoi Scraper] Error parsing response: ${url}`, toErrorMessage(error));
              }
            }
          } catch (error: unknown) {
            // 捕獲所有錯誤，防止未處理的 Promise rejection
            console.error('[Pinkoi Scraper] Error in response handler:', toErrorMessage(error));
          }
        })().catch((error: unknown) => {
          // 額外的錯誤捕獲，確保不會有未處理的 Promise
          console.error('[Pinkoi Scraper] Unhandled error in response handler:', toErrorMessage(error));
        });
      });

      console.log(`[Pinkoi Scraper] Navigating to https://www.pinkoi.com/store/${storeId}...`);
      await page.goto(`https://www.pinkoi.com/store/${storeId}`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // 等待頁面載入
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 滾動頁面以載入更多商品
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      await browser.close();
      
      // 去重
      const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex(p => p.product_id === product.product_id)
      );
      
      console.log(`[Pinkoi Scraper] Puppeteer found ${uniqueProducts.length} products`);
      return uniqueProducts;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('[Pinkoi Scraper] Puppeteer error:', error);
    return [];
  }
}

/**
 * 主要入口函數
 */
export async function scrapePinkoiStore(storeId: string = 'showartz'): Promise<PinkoiProduct[]> {
  console.log(`[Pinkoi Scraper] Starting to scrape store: ${storeId}...`);
  
  // 優先使用 API
  let products = await fetchPinkoiProducts(storeId);
  
  // 如果 API 失敗，使用 Puppeteer
  if (products.length === 0) {
    console.log('[Pinkoi Scraper] API method failed, trying Puppeteer...');
    products = await scrapePinkoiProductsPuppeteer(storeId);
  }
  
  console.log(`[Pinkoi Scraper] Total products found: ${products.length}`);
  return products;
}

