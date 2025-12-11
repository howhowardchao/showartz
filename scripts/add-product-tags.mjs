// 為商品添加標籤和分類
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '/tmp',
  database: 'showartz',
});

// 從商品名稱中提取標籤
function extractTags(name) {
  const tags = [];
  const nameLower = name.toLowerCase();
  
  // 動物標籤
  if (nameLower.includes('貓頭鷹') || nameLower.includes('owl')) tags.push('貓頭鷹');
  if (nameLower.includes('熊貓') || nameLower.includes('panda')) tags.push('熊貓');
  if (nameLower.includes('恐龍') || nameLower.includes('dinosaur')) tags.push('恐龍');
  if (nameLower.includes('老虎') || nameLower.includes('tiger')) tags.push('老虎');
  if (nameLower.includes('鯊魚') || nameLower.includes('shark')) tags.push('鯊魚');
  if (nameLower.includes('兔子') || nameLower.includes('rabbit')) tags.push('兔子');
  if (nameLower.includes('殺人鯨') || nameLower.includes('orca')) tags.push('殺人鯨');
  if (nameLower.includes('倉鴞')) tags.push('倉鴞');
  if (nameLower.includes('海象')) tags.push('海象');
  
  // 顏色標籤
  if (nameLower.includes('黑') || nameLower.includes('black')) tags.push('黑色');
  if (nameLower.includes('灰') || nameLower.includes('gray') || nameLower.includes('grey')) tags.push('灰色');
  if (nameLower.includes('綠') || nameLower.includes('green')) tags.push('綠色');
  if (nameLower.includes('藍') || nameLower.includes('blue')) tags.push('藍色');
  if (nameLower.includes('紅') || nameLower.includes('red')) tags.push('紅色');
  if (nameLower.includes('粉') || nameLower.includes('pink')) tags.push('粉色');
  if (nameLower.includes('紫') || nameLower.includes('purple')) tags.push('紫色');
  if (nameLower.includes('黃') || nameLower.includes('yellow')) tags.push('黃色');
  if (nameLower.includes('白') || nameLower.includes('white')) tags.push('白色');
  if (nameLower.includes('咖啡') || nameLower.includes('brown')) tags.push('咖啡色');
  if (nameLower.includes('迷彩')) tags.push('迷彩');
  
  // 尺寸標籤
  if (nameLower.match(/xs\b|超小/i)) tags.push('XS');
  if (nameLower.match(/\bs\b|小/i) && !nameLower.includes('xs')) tags.push('S');
  if (nameLower.match(/\bm\b|中/i)) tags.push('M');
  if (nameLower.match(/\bl\b|大/i) && !nameLower.includes('xl')) tags.push('L');
  if (nameLower.match(/xl\b|超大/i)) tags.push('XL');
  
  // 類型標籤
  if (nameLower.includes('後背包') || nameLower.includes('backpack')) {
    tags.push('後背包');
    tags.push('背包');
  }
  if (nameLower.includes('側背包') || nameLower.includes('shoulder')) {
    tags.push('側背包');
    tags.push('背包');
  }
  if (nameLower.includes('腰包') || nameLower.includes('waist')) {
    tags.push('腰包');
    tags.push('小包');
  }
  if (nameLower.includes('零錢包') || nameLower.includes('coin')) {
    tags.push('零錢包');
    tags.push('小包');
  }
  if (nameLower.includes('手提包') || nameLower.includes('handbag')) {
    tags.push('手提包');
    tags.push('包');
  }
  if (nameLower.includes('托特包') || nameLower.includes('tote')) {
    tags.push('托特包');
    tags.push('包');
  }
  if (nameLower.includes('斜背包')) {
    tags.push('斜背包');
    tags.push('包');
  }
  if (nameLower.includes('手機包')) {
    tags.push('手機包');
    tags.push('小包');
  }
  if (nameLower.includes('兩用包')) {
    tags.push('兩用包');
    tags.push('包');
  }
  
  // 材質標籤
  if (nameLower.includes('金線')) tags.push('金線');
  if (nameLower.includes('皮草') || nameLower.includes('fur')) tags.push('皮草');
  if (nameLower.includes('尼龍') || nameLower.includes('nylon')) tags.push('尼龍');
  if (nameLower.includes('羊毛')) tags.push('羊毛');
  if (nameLower.includes('鉚釘')) tags.push('鉚釘');
  
  // 特殊標籤
  if (nameLower.includes('school') || nameLower.includes('學校')) tags.push('SCHOOL系列');
  if (nameLower.includes('正版')) tags.push('正版');
  if (nameLower.includes('獨家')) tags.push('獨家販售');
  if (nameLower.includes('可客製')) tags.push('可客製');
  
  return tags;
}

// 從商品名稱中提取分類
function extractCategory(name) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('後背包') || nameLower.includes('backpack')) return '後背包';
  if (nameLower.includes('側背包') || nameLower.includes('shoulder')) return '側背包';
  if (nameLower.includes('腰包') || nameLower.includes('waist')) return '腰包';
  if (nameLower.includes('零錢包') || nameLower.includes('coin')) return '零錢包';
  if (nameLower.includes('手提包') || nameLower.includes('handbag')) return '手提包';
  if (nameLower.includes('托特包') || nameLower.includes('tote')) return '托特包';
  if (nameLower.includes('斜背包')) return '斜背包';
  if (nameLower.includes('手機包')) return '手機包';
  if (nameLower.includes('兩用包')) return '兩用包';
  if (nameLower.includes('紙膠帶')) return '文具';
  
  return '其他';
}

async function addTags() {
  const client = await pool.connect();
  try {
    console.log('開始為商品添加標籤和分類...');
    
    const result = await client.query('SELECT id, name, tags, category FROM products');
    let updated = 0;
    
    for (const product of result.rows) {
      const tags = extractTags(product.name);
      const category = extractCategory(product.name);
      
      // 如果標籤或分類有變化，更新資料庫
      const currentTags = product.tags || [];
      const tagsChanged = JSON.stringify([...currentTags].sort()) !== JSON.stringify([...tags].sort());
      const categoryChanged = product.category !== category;
      
      if (tagsChanged || categoryChanged) {
        await client.query(
          'UPDATE products SET tags = $1, category = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [tags, category, product.id]
        );
        updated++;
        console.log(`更新商品: ${product.name.substring(0, 30)}...`);
        console.log(`  標籤: ${tags.join(', ')}`);
        console.log(`  分類: ${category}`);
      }
    }
    
    console.log(`✅ 完成！更新了 ${updated} 個商品`);
    
  } catch (error) {
    console.error('❌ 錯誤:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTags().catch(console.error);

