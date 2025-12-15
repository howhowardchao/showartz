import axios from 'axios';

export interface ShopeeProduct {
  item_id: number;
  shop_id: number;
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
}

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * 嘗試直接呼叫蝦皮內部 API 獲取商品列表
 * 這需要分析實際的網路請求來找到正確的 API 端點
 */
export async function fetchShopeeProductsAPI(shopId: number): Promise<ShopeeProduct[]> {
  try {
    console.log(`[API Method] Trying to fetch products for shop ${shopId}...`);
    // 嘗試多個可能的 API 端點
    const possibleEndpoints = [
      `https://shopee.tw/api/v4/shop/get_all_shop_items?shopid=${shopId}&limit=100&offset=0`,
      `https://shopee.tw/api/v4/shop/search_items?shopid=${shopId}&limit=100&offset=0`,
      `https://shopee.tw/api/v2/shop/get_shop_detail?shopid=${shopId}`,
      `https://shopee.tw/api/v1/shop/get_all_shop_items?shopid=${shopId}&limit=100&offset=0`,
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`[API Method] Trying endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://shopee.tw/shop/${shopId}`,
            'Accept': 'application/json',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          },
          timeout: 10000,
        });

        console.log(`[API Method] Response status: ${response.status}`);
        // 嘗試解析回應
        const products = parseShopeeResponse(response.data);
        console.log(`[API Method] Parsed ${products.length} products from response`);
        if (products.length > 0) {
          return products;
        }
      } catch (error: unknown) {
        console.log(`[API Method] Endpoint failed: ${toErrorMessage(error)}`);
        // 繼續嘗試下一個端點
        continue;
      }
    }

    // 如果所有 API 端點都失敗，返回空陣列
    return [];
  } catch (error) {
    console.error('Error fetching Shopee products via API:', error);
    return [];
  }
}

/**
 * 使用 Puppeteer 爬取蝦皮商店頁面
 * 這是備選方案，當 API 無法使用時使用
 */
export async function scrapeShopeeProductsPuppeteer(shopId: number): Promise<ShopeeProduct[]> {
  try {
    // 動態導入 puppeteer（避免在沒有安裝時報錯）
    const puppeteer = await import('puppeteer').catch(() => null);
    
    if (!puppeteer) {
      console.warn('Puppeteer is not installed. Please install it: npm install puppeteer');
      return [];
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // 設定更真實的瀏覽器環境
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // 設定視窗大小
      await page.setViewport({ width: 1920, height: 1080 });
      
      // 設定額外的 headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      const products: ShopeeProduct[] = [];
      const apiResponses: string[] = [];

      // 監聽所有網路請求，記錄可能的 API 端點
      page.on('response', async (response) => {
        const url = response.url();
        
        // 記錄所有包含 shop 或 item 的請求
        if (url.includes('shop') || url.includes('item') || url.includes('product')) {
          apiResponses.push(url);
          console.log(`[Puppeteer] Found relevant request: ${url.substring(0, 100)}`);
        }
        
        // 檢查是否為商品相關的 API
        if (
          url.includes('shop/get_all_shop_items') ||
          url.includes('shop/search_items') ||
          url.includes('shopee.shop.get_all_shop_items') ||
          url.includes('shop/get_shop_detail') ||
          url.includes('v4/shop') ||
          url.includes('v2/shop') ||
          url.includes('api/v4/shop') ||
          url.includes('api/v2/shop')
        ) {
          try {
            const data = await response.json();
            console.log(`[Puppeteer] Found API response: ${url}`);
            const items = parseShopeeResponse(data);
            if (items.length > 0) {
              console.log(`[Puppeteer] Parsed ${items.length} products from API`);
              products.push(...items);
            } else {
              // 記錄回應結構以便調試
              console.log(`[Puppeteer] API response structure:`, JSON.stringify(data).substring(0, 500));
            }
          } catch {
            // 忽略非 JSON 回應
            console.log(`[Puppeteer] Response is not JSON: ${url}`);
          }
        }
      });

      // 訪問商店頁面
      console.log(`[Puppeteer] Navigating to https://shopee.tw/shop/${shopId}...`);
      await page.goto(`https://shopee.tw/shop/${shopId}`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // 等待商品載入
      console.log('[Puppeteer] Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // 等待頁面 JavaScript 執行完成
      console.log('[Puppeteer] Waiting for JavaScript to execute...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // 嘗試等待商品元素出現（使用更廣泛的選擇器）
      try {
        // 先嘗試等待任何可能包含商品的容器
        await page.waitForFunction(
          () => {
            const productLinks = document.querySelectorAll('a[href*="/product/"]').length;
            const dataItems = document.querySelectorAll('[data-sqe="item"]').length;
            const itemElements = document.querySelectorAll('[class*="item"]').length;
            const allLinks = document.querySelectorAll('a[href]').length;
            console.log(`[Page] Found: ${productLinks} product links, ${dataItems} data-sqe items, ${itemElements} item elements, ${allLinks} total links`);
            return productLinks > 0 || dataItems > 0 || itemElements > 10;
          },
          { timeout: 30000, polling: 1000 }
        );
        console.log('[Puppeteer] Product elements found');
      } catch {
        console.log('[Puppeteer] Product elements not found after waiting, will try to extract anyway...');
        // 再等待一下讓頁面完全載入
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
      
      // 檢查頁面上實際有多少連結
      const linkCount = await page.evaluate(() => {
        const allLinks = document.querySelectorAll('a[href]');
        const productLinks = document.querySelectorAll('a[href*="/product/"]');
        return { total: allLinks.length, products: productLinks.length };
      });
      console.log(`[Puppeteer] Page has ${linkCount.total} total links, ${linkCount.products} product links`);
      
      // 檢查頁面標題確認是否成功載入
      const pageTitle = await page.title();
      console.log(`[Puppeteer] Page title: ${pageTitle}`);
      
      // 檢查是否有錯誤頁面
      const errorText = await page.evaluate(() => {
        return document.body.textContent || '';
      });
      if (errorText.includes('404') || errorText.includes('找不到') || errorText.includes('Not Found')) {
        console.error('[Puppeteer] Page appears to be an error page');
        await browser.close();
        return [];
      }

      // 滾動頁面以載入更多商品（多次滾動確保載入）
      console.log('[Puppeteer] Scrolling to load products...');
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10;
      
      while (scrollAttempts < maxScrollAttempts) {
        // 滾動到底部
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        // 等待新內容載入
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 檢查頁面高度是否變化
        const currentHeight = await page.evaluate(() => document.body.scrollHeight);
        console.log(`[Puppeteer] Scroll ${scrollAttempts + 1}/${maxScrollAttempts}, height: ${currentHeight}`);
        
        if (currentHeight === previousHeight) {
          // 頁面高度沒有變化，可能已經載入完畢
          console.log('[Puppeteer] Page height unchanged, stopping scroll');
          break;
        }
        
        previousHeight = currentHeight;
        scrollAttempts++;
      }
      
      // 滾動回頂部
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 如果沒有從 API 獲取到商品，嘗試從頁面 DOM 提取
      if (products.length === 0) {
        console.log('No products from API, trying DOM extraction...');
        const domProducts = await page.evaluate((shopId) => {
          const items: Array<Record<string, unknown>> = [];
          console.log('[DOM Extract] Starting extraction...');
          
          // 先檢查頁面上實際有多少元素
          const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[href]');
          const productLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/product/"]');
          const allImages = document.querySelectorAll<HTMLImageElement>('img');
          console.log(`[DOM Extract] Page stats: ${allLinks.length} links, ${productLinks.length} product links, ${allImages.length} images`);
          
          // 方法 1: 查找包含商品資訊的 script 標籤（更廣泛的搜尋）
          const scripts = Array.from(document.querySelectorAll('script'));
          console.log(`[DOM Extract] Found ${scripts.length} script tags`);
          
          for (const script of scripts) {
            const text = script.textContent || '';
            // 尋找包含商品資料的 JSON（更廣泛的關鍵字）
            if (text.includes('itemid') || text.includes('item_id') || text.includes('shopid') || 
                text.includes('item_basic') || text.includes('items') || text.includes('product')) {
              try {
                // 嘗試多種 JSON 格式
                const patterns = [
                  /\{[\s\S]*"itemid"[\s\S]*\}/,
                  /\{[\s\S]*"items"[\s\S]*\}/,
                  /window\._SHOPEE_INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
                  /__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
                ];
                
                for (const pattern of patterns) {
                  const match = text.match(pattern);
                  if (match) {
                    try {
                      const jsonStr = match[1] || match[0];
                      const data = JSON.parse(jsonStr);
                      
                      // 嘗試多種資料結構
                      if (data.items && Array.isArray(data.items)) {
                        items.push(...data.items);
                        console.log(`[DOM Extract] Found ${data.items.length} items in data.items`);
                      } else if (data.data?.items && Array.isArray(data.data.items)) {
                        items.push(...data.data.items);
                        console.log(`[DOM Extract] Found ${data.data.items.length} items in data.data.items`);
                      } else if (Array.isArray(data)) {
                        items.push(...data);
                        console.log(`[DOM Extract] Found ${data.length} items in array`);
                      } else if (data.shop?.items) {
                        items.push(...data.shop.items);
                        console.log(`[DOM Extract] Found ${data.shop.items.length} items in shop.items`);
                      }
                    } catch {
                      // 繼續嘗試下一個模式
                    }
                  }
                }
              } catch {
                // 繼續嘗試其他方法
              }
            }
          }
          
          // 方法 2: 從商品卡片元素提取（更廣泛的選擇器）
          // 使用 Set 去重（在方法 2 開始時定義，讓所有子區塊都能訪問）
          const seenIds = new Set<number>();
          
          if (items.length === 0) {
            // 嘗試多種選擇器
            const selectors = [
              '[data-sqe="item"]',
              '.shopee-item-card',
              '[class*="product"]',
              '[class*="item"]',
              'a[href*="/product/"]',
              '[class*="shop-search-result-view-item"]',
              '[class*="shopee-search-item-result"]',
            ];
            
            let productCards: NodeListOf<Element> | null = null;
            for (const selector of selectors) {
              productCards = document.querySelectorAll(selector);
              if (productCards.length > 0) {
                console.log(`Found ${productCards.length} elements with selector: ${selector}`);
                break;
              }
            }
            
            if (!productCards || productCards.length === 0) {
              // 最後嘗試：查找所有包含 /product/ 的連結（更廣泛的搜尋）
              let allLinks: Element[] = Array.from(document.querySelectorAll('a[href*="/product/"]'));
              console.log(`[DOM Extract] Found ${allLinks.length} product links with /product/`);
              
              // 如果還是沒有，嘗試查找所有連結並過濾
              if (allLinks.length === 0) {
                const allAnchors = document.querySelectorAll('a[href]');
                console.log(`[DOM Extract] Checking ${allAnchors.length} total links...`);
                const filteredLinks = Array.from(allAnchors).filter((link) => {
                  const href = link.getAttribute('href') || link.href || '';
                  const isProduct = href.includes('product') || href.match(/\/\d+\/\d+/) || href.match(/\/i\.\d+\/\d+/);
                  if (isProduct) {
                    console.log(`[DOM Extract] Found potential product link: ${href}`);
                  }
                  return isProduct;
                });
                allLinks = filteredLinks;
                console.log(`[DOM Extract] Found ${allLinks.length} potential product links after filtering`);
                
                // 如果還是沒有，嘗試查找所有包含數字的連結（可能是商品 ID）
                if (allLinks.length === 0) {
                  const numericLinks = Array.from(allAnchors).filter((link) => {
                    const href = link.getAttribute('href') || link.href || '';
                    return /\/\d+\/\d+/.test(href) && href.includes(shopId.toString());
                  });
                  allLinks = numericLinks;
                  console.log(`[DOM Extract] Found ${allLinks.length} numeric links matching shop ID`);
                }
              }
              
              allLinks.forEach((link) => {
                try {
                  const href = link.getAttribute('href') || link.href || '';
                  // 嘗試多種 URL 格式
                  const match = href.match(/\/product\/(\d+)\/(\d+)/) || 
                               href.match(/\/i\.(\d+)\/(\d+)/) ||
                               href.match(/\/(\d+)\/(\d+)/);
                  
                  if (match) {
                    // 根據不同的匹配模式提取 ID
                    let itemId: number;
                    let shopIdFromUrl: number;
                    
                    if (match[2]) {
                      // 格式：/product/shopId/itemId 或 /i.shopId/itemId
                      itemId = parseInt(match[2]);
                      shopIdFromUrl = parseInt(match[1]);
                    } else {
                      // 格式：/shopId/itemId
                      itemId = parseInt(match[1]);
                      shopIdFromUrl = shopId; // 使用傳入的 shopId
                    }
                    
                    // 跳過重複的商品
                    if (seenIds.has(itemId)) {
                      return;
                    }
                    seenIds.add(itemId);
                    
                    // 向上查找父元素獲取名稱和價格
                    let parent = link.parentElement;
                    let name = '';
                    let price = '0';
                    let image = '';
                    
                    // 向上查找幾層父元素
                    for (let i = 0; i < 5 && parent; i++) {
                      const nameEl = parent.querySelector('[class*="name"], [class*="title"], [class*="item-name"]');
                      const priceEl = parent.querySelector('[class*="price"], [class*="item-price"]');
                      const imgEl = parent.querySelector('img');
                      
                      if (nameEl && !name) name = nameEl.textContent?.trim() || '';
                      if (priceEl && price === '0') price = priceEl.textContent?.trim() || '0';
                      if (imgEl && !image) image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
                      
                      if (name && price !== '0') break;
                      parent = parent.parentElement;
                    }
                    
                    // 如果還是沒有名稱，使用連結文字
                    if (!name) name = link.textContent?.trim() || `商品 ${itemId}`;
                    
                    // 處理圖片 URL
                    let fullImageUrl = image;
                    if (image && !image.startsWith('http')) {
                      // 如果是相對路徑或圖片 ID，構建完整 URL
                      if (image.startsWith('//')) {
                        fullImageUrl = `https:${image}`;
                      } else if (image.startsWith('/')) {
                        fullImageUrl = `https://shopee.tw${image}`;
                      } else if (!image.includes('.')) {
                        // 如果是圖片 ID，使用蝦皮的 CDN 格式
                        fullImageUrl = `https://cf.shopee.tw/file/${image}`;
                      }
                    }
                    
                    items.push({
                      itemid: itemId,
                      shopid: shopIdFromUrl || shopId,
                      name: name,
                      price: price,
                      image: fullImageUrl,
                      url: href.startsWith('http') ? href : `https://shopee.tw${href}`,
                    });
                  }
                } catch (e) {
                  console.error('Error extracting from link:', e);
                }
              });
            } else {
              // 使用找到的商品卡片
              productCards.forEach((card) => {
                try {
                  const link = card.querySelector('a[href*="/product/"]') || card.closest('a[href*="/product/"]') || card;
                  const href = link.getAttribute('href') || link.href;
                  if (href) {
                    const match = href.match(/\/product\/(\d+)\/(\d+)/);
                    if (match) {
                      const cardItemId = parseInt(match[2]);
                      const cardShopId = parseInt(match[1]);
                      
                      // 跳過重複的商品
                      if (seenIds.has(cardItemId)) {
                        return;
                      }
                      seenIds.add(cardItemId);
                      
                      const nameEl = card.querySelector('[class*="name"], [class*="title"], [class*="item-name"]') || link;
                      const priceEl = card.querySelector('[class*="price"], [class*="item-price"]');
                      const imgEl = card.querySelector('img');
                      
                      // 處理圖片 URL
                      let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
                      if (imageUrl && !imageUrl.startsWith('http')) {
                        if (imageUrl.startsWith('//')) {
                          imageUrl = `https:${imageUrl}`;
                        } else if (imageUrl.startsWith('/')) {
                          imageUrl = `https://shopee.tw${imageUrl}`;
                        } else if (!imageUrl.includes('.')) {
                          imageUrl = `https://cf.shopee.tw/file/${imageUrl}`;
                        }
                      }
                      
                      items.push({
                        itemid: cardItemId,
                        shopid: cardShopId || shopId,
                        name: nameEl?.textContent?.trim() || link.textContent?.trim() || `商品 ${cardItemId}`,
                        price: priceEl?.textContent?.trim() || '0',
                        image: imageUrl,
                        url: href.startsWith('http') ? href : `https://shopee.tw${href}`,
                      });
                    }
                  }
                } catch (e) {
                  console.error('Error extracting from card:', e);
                }
              });
            }
          }
          
          return items;
        }, shopId);
        
        // 轉換 DOM 提取的資料
        for (const item of domProducts) {
          try {
            const product: ShopeeProduct = {
              item_id: item.itemid || item.item_id || 0,
              shop_id: item.shopid || item.shop_id || shopId,
              name: item.name || item.item_name || item.title || '',
              description: item.description || item.desc || undefined,
              price: parseFloat(item.price?.toString().replace(/[^\d.]/g, '') || '0') || 0,
              original_price: item.original_price ? parseFloat(item.original_price.toString().replace(/[^\d.]/g, '')) : undefined,
              images: item.image ? [item.image.startsWith('http') ? item.image : (item.image.startsWith('//') ? `https:${item.image}` : (item.image.startsWith('/') ? `https://shopee.tw${item.image}` : `https://cf.shopee.tw/file/${item.image}`))] : (item.images || []).map((img: string) => img.startsWith('http') ? img : (img.startsWith('//') ? `https:${img}` : (img.startsWith('/') ? `https://shopee.tw${img}` : `https://cf.shopee.tw/file/${img}`))),
              url: item.url || `https://shopee.tw/product/${shopId}/${item.itemid || item.item_id}`,
              stock: item.stock || item.quantity || undefined,
              sales_count: item.sold || item.sold_count || item.historical_sold || undefined,
              rating: item.rating || item.rating_star || undefined,
              category: item.category_name || item.category || undefined,
            };
            
            if (product.item_id && product.name) {
              products.push(product);
            }
          } catch (error) {
            console.warn('Error converting DOM product:', error);
          }
        }
        
        console.log(`[Puppeteer] Extracted ${products.length} products from DOM`);
        
        // 去重（根據 item_id）
        const uniqueProducts = products.filter((product, index, self) =>
          index === self.findIndex(p => p.item_id === product.item_id)
        );
        console.log(`[Puppeteer] After deduplication: ${uniqueProducts.length} unique products`);
        return uniqueProducts;
      }

        // 記錄所有相關的 API 請求
        if (apiResponses.length > 0) {
          console.log(`[Puppeteer] Total relevant API requests found: ${apiResponses.length}`);
        }
        
        // 如果還是沒有商品，嘗試從 HTML 源碼中提取商品連結
        if (products.length === 0) {
          console.log('[Puppeteer] No products found, trying to extract from HTML source...');
          try {
            const html = await page.content();
            console.log(`[Puppeteer] HTML length: ${html.length}`);
            
            // 從 HTML 中提取所有商品連結
            const productLinkRegex = /https?:\/\/[^"'\s]+\/product\/(\d+)\/(\d+)/g;
            const matches = Array.from(html.matchAll(productLinkRegex));
            const uniqueLinks = [...new Set(matches.map(m => m[0]))];
            console.log(`[Puppeteer] Found ${uniqueLinks.length} unique product links in HTML`);
            
            // 從連結中提取商品 ID
            const productIds = new Set<number>();
            for (const link of uniqueLinks) {
              const match = link.match(/\/product\/(\d+)\/(\d+)/);
              if (match) {
                const itemId = parseInt(match[2]);
                productIds.add(itemId);
              }
            }
            
            console.log(`[Puppeteer] Extracted ${productIds.size} unique product IDs from HTML`);
            
            // 為每個商品 ID 創建基本商品資訊
            for (const itemId of productIds) {
              products.push({
                item_id: itemId,
                shop_id: shopId,
                name: `商品 ${itemId}`,
                price: 0,
                images: [],
                url: `https://shopee.tw/product/${shopId}/${itemId}`,
              });
            }
          } catch {
            console.log('[Puppeteer] Error extracting from HTML');
          }
        }
        
        // 如果還是沒有商品，嘗試直接呼叫商品列表 API
        if (products.length === 0) {
          console.log('[Puppeteer] No products found, trying direct API calls...');
          try {
            // 嘗試多個可能的 API 端點
            const apiEndpoints = [
              `https://shopee.tw/api/v4/shop/get_all_shop_items?shopid=${shopId}&limit=100&offset=0`,
              `https://shopee.tw/api/v2/shop/get_all_shop_items?shopid=${shopId}&limit=100&offset=0`,
            ];
            
            for (const endpoint of apiEndpoints) {
              try {
                console.log(`[Puppeteer] Trying direct API: ${endpoint}`);
                const response = await page.evaluate(async (url) => {
                  const res = await fetch(url, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                      'Referer': `https://shopee.tw/shop/${shopId}`,
                    },
                  });
                  return res.json();
                }, endpoint);
                
                const apiProducts = parseShopeeResponse(response);
                if (apiProducts.length > 0) {
                  console.log(`[Puppeteer] Got ${apiProducts.length} products from direct API call`);
                  products.push(...apiProducts);
                  break;
                }
              } catch {
                console.log('[Puppeteer] Direct API call failed');
              }
            }
          } catch {
            console.log('[Puppeteer] Error in direct API calls');
          }
        }
        
        await browser.close();
        return products;
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('Error scraping Shopee products with Puppeteer:', error);
    return [];
  }
}

/**
 * 主要入口函數：優先嘗試 API，失敗時降級到 Puppeteer
 */
export async function scrapeShopeeStore(shopId: number = 62981645): Promise<ShopeeProduct[]> {
  console.log(`[Shopee Scraper] Starting to scrape shop ${shopId}...`);
  
  // 優先嘗試直接呼叫 API
  let products = await fetchShopeeProductsAPI(shopId);
  console.log(`[Shopee Scraper] API method returned ${products.length} products`);

  // 如果 API 失敗，使用 Puppeteer
  if (products.length === 0) {
    console.log('[Shopee Scraper] API method failed, trying Puppeteer...');
    try {
      products = await scrapeShopeeProductsPuppeteer(shopId);
      console.log(`[Shopee Scraper] Puppeteer method returned ${products.length} products`);
    } catch (error: unknown) {
      console.error('[Shopee Scraper] Puppeteer error:', toErrorMessage(error));
    }
  }

  console.log(`[Shopee Scraper] Total products found: ${products.length}`);
  return products;
}

/**
 * 解析蝦皮 API 回應資料
 * 需要根據實際的 API 回應格式調整
 */
function parseShopeeResponse(data: unknown): ShopeeProduct[] {
  const products: ShopeeProduct[] = [];

  try {
    // 嘗試多種可能的資料結構
    let items: unknown[] = [];

    if ((data as { data?: { items?: unknown[] } }).data?.items) {
      items = (data as { data: { items: unknown[] } }).data.items;
    } else if ((data as { items?: unknown[] }).items) {
      items = (data as { items: unknown[] }).items;
    } else if (Array.isArray(data)) {
      items = data as unknown[];
    } else if ((data as { data?: unknown }).data && Array.isArray((data as { data: unknown }).data)) {
      items = (data as { data: unknown[] }).data;
    }

    for (const rawItem of items) {
      try {
        const item = rawItem as Record<string, unknown>;
        const product: ShopeeProduct = {
          item_id: (item.itemid as number) || (item.item_id as number) || (item.id as number) || 0,
          shop_id: (item.shopid as number) || (item.shop_id as number) || 62981645,
          name: (item.name as string) || (item.item_name as string) || (item.title as string) || '',
          description: (item.description as string) || (item.desc as string) || undefined,
          price: parseFloat(
            ((item.price as string) ||
             (item.price_min as string) ||
             (item.price_max as string) ||
             '0').toString()
          ) / 100000, // 蝦皮價格通常是分，需要除以 100000
          original_price: item.original_price ? parseFloat(String(item.original_price)) / 100000 : undefined,
          images: (item.images as string[]) || (item.image as string[]) || (item.images_list as string[]) || [],
          url: (item.url as string) || (item.item_url as string) || `https://shopee.tw/product/${(item.shopid as number) || 62981645}/${(item.itemid as number) || (item.item_id as number) || (item.id as number)}`,
          stock: (item.stock as number) || (item.quantity as number) || undefined,
          sales_count: (item.sold as number) || (item.sold_count as number) || (item.historical_sold as number) || undefined,
          rating: (item.rating as number) || (item.rating_star as number) || undefined,
          category: (item.category_name as string) || (item.category as string) || undefined,
        };

        // 驗證必要欄位
        if (product.item_id && product.name && product.price > 0) {
          products.push(product);
        }
      } catch (error) {
        console.warn('Error parsing product item:', error);
        continue;
      }
    }
  } catch (error) {
    console.error('Error parsing Shopee response:', error);
  }

  return products;
}


