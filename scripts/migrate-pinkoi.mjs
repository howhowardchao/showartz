// 遷移腳本：添加 Pinkoi 支持到 products 表
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '/tmp',
  database: 'showartz',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('開始遷移資料庫以支持 Pinkoi...');
    
    // 檢查是否已經有 pinkoi_product_id 欄位
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'pinkoi_product_id'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Pinkoi 欄位已存在，跳過遷移');
      return;
    }
    
    // 1. 先移除 NOT NULL 約束（如果存在）
    console.log('步驟 1: 更新 shopee_item_id 和 shopee_url 為可選...');
    await client.query(`
      ALTER TABLE products 
      ALTER COLUMN shopee_item_id DROP NOT NULL,
      ALTER COLUMN shopee_shop_id DROP NOT NULL,
      ALTER COLUMN shopee_url DROP NOT NULL
    `);
    
    // 2. 添加 Pinkoi 欄位
    console.log('步驟 2: 添加 Pinkoi 欄位...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS pinkoi_product_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS pinkoi_url TEXT
    `);
    
    // 3. 添加約束：至少要有 shopee_item_id 或 pinkoi_product_id 之一
    console.log('步驟 3: 添加約束...');
    try {
      await client.query(`
        ALTER TABLE products 
        ADD CONSTRAINT products_source_check 
        CHECK ((shopee_item_id IS NOT NULL) OR (pinkoi_product_id IS NOT NULL))
      `);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('約束已存在，跳過');
      } else {
        throw e;
      }
    }
    
    // 4. 創建索引
    console.log('步驟 4: 創建索引...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_pinkoi_product_id ON products(pinkoi_product_id)
    `);
    
    console.log('✅ 遷移完成！');
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);






