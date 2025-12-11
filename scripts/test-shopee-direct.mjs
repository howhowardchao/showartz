// Direct test of Shopee page access
import puppeteer from 'puppeteer';

async function test() {
  console.log('Testing direct access to Shopee shop page...');
  const browser = await puppeteer.launch({
    headless: true, // 無頭模式
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to shop page...');
    await page.goto('https://shopee.tw/shop/62981645', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 滾動頁面觸發載入
    console.log('Scrolling to load products...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 檢查頁面內容
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // 查找所有可能的商品連結和元素
    const pageInfo = await page.evaluate(() => {
      const info = {
        allLinks: document.querySelectorAll('a').length,
        productLinks: document.querySelectorAll('a[href*="/product/"]').length,
        allHrefs: Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href')).filter(Boolean).slice(0, 20),
        bodyText: document.body.textContent?.substring(0, 500) || '',
        scripts: document.querySelectorAll('script').length,
      };
      return info;
    });

    console.log(`\nPage info:`);
    console.log(`- Total links: ${pageInfo.allLinks}`);
    console.log(`- Product links: ${pageInfo.productLinks}`);
    console.log(`- Scripts: ${pageInfo.scripts}`);
    console.log(`\nFirst 20 hrefs:`);
    pageInfo.allHrefs.forEach((href, i) => {
      console.log(`${i + 1}. ${href}`);
    });

    // 查找所有商品連結
    const productLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/product/"]'));
      return links.map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
      })).slice(0, 10);
    });

    console.log(`\nFound ${productLinks.length} product links:`);
    productLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.text || 'No text'} - ${link.href}`);
    });
    
    // 嘗試查找其他可能的商品元素
    const otherElements = await page.evaluate(() => {
      return {
        items: document.querySelectorAll('[data-sqe="item"]').length,
        cards: document.querySelectorAll('[class*="item"]').length,
        images: document.querySelectorAll('img').length,
        allLinks: document.querySelectorAll('a').length,
      };
    });
    console.log(`\nOther elements:`, otherElements);
    
    // 檢查 window 物件中是否有商品資料
    const windowData = await page.evaluate(() => {
      const data = {};
      try {
        // 檢查常見的資料變數
        const vars = ['__INITIAL_STATE__', '__NEXT_DATA__', 'window._SHOPEE_INITIAL_STATE__', 'shopData', 'productData'];
        for (const varName of vars) {
          try {
            const value = eval(varName);
            if (value) data[varName] = 'exists';
          } catch (e) {
            // 變數不存在
          }
        }
      } catch (e) {
        // 忽略錯誤
      }
      return data;
    });
    console.log(`\nWindow data:`, windowData);

    // 截圖以便查看
    await page.screenshot({ path: 'shopee-page.png', fullPage: true });
    console.log('\nScreenshot saved to shopee-page.png');

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
}

test();

