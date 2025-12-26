#!/usr/bin/env node

/**
 * 直接觸發 Pinkoi 商品同步
 * 使用方法: 
 *   在容器內: docker-compose exec app node scripts/sync-pinkoi-products.mjs [storeId]
 *   或使用 ts-node: npx ts-node scripts/sync-pinkoi-products.mjs [storeId]
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入環境變數
config({ path: join(__dirname, '..', '.env') });
config({ path: join(__dirname, '..', '.env.local') });

// 動態導入 TypeScript 模組（需要在支持 TypeScript 的環境中運行）
// 在容器內，Next.js 會將 TypeScript 編譯，但我們需要直接導入源碼
// 使用 tsx 或 ts-node 來執行此腳本
let syncProductsFromPinkoi;
try {
  // 嘗試導入 TypeScript 源碼（需要 tsx 或 ts-node）
  // 在生產環境中，我們需要通過不同的方式
  const pinkoiSync = await import('../lib/pinkoi-sync.ts');
  syncProductsFromPinkoi = pinkoiSync.syncProductsFromPinkoi;
} catch (error) {
  // 如果導入失敗，提示用戶使用其他方法
  console.error('❌ 無法導入模組');
  console.error('提示: 此腳本需要在支持 TypeScript 的環境中執行');
  console.error('   使用 tsx: npx tsx scripts/sync-pinkoi-products.mjs');
  console.error('   或通過管理界面: https://showartz.com/admin');
  console.error('錯誤:', error.message);
  process.exit(1);
}

const storeId = process.argv[2] || 'showartz';

console.log(`開始同步 Pinkoi 商店: ${storeId}...\n`);

try {
  const result = await syncProductsFromPinkoi(storeId);
  
  console.log('\n=== 同步結果 ===');
  console.log(`總共找到: ${result.total} 個商品`);
  console.log(`成功同步: ${result.success} 個`);
  console.log(`失敗: ${result.failed} 個`);
  if (result.deactivated) {
    console.log(`已下架: ${result.deactivated} 個商品`);
  }
  
  if (result.errors && result.errors.length > 0) {
    console.log('\n=== 錯誤訊息 ===');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  process.exit(result.failed > 0 ? 1 : 0);
} catch (error) {
  console.error('\n同步失敗:', error);
  process.exit(1);
}

