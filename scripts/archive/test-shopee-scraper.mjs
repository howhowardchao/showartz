// Test script for Shopee scraper
import { scrapeShopeeStore } from '../lib/shopee-scraper.js';

async function test() {
  console.log('Testing Shopee scraper...');
  try {
    const products = await scrapeShopeeStore(62981645);
    console.log(`\n✅ Found ${products.length} products:`);
    products.slice(0, 3).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   ID: ${p.item_id}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   URL: ${p.url}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

test();



