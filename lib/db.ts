import { Pool } from 'pg';
import { Video, Image, AdminUser, VideoCategory, Product } from './types';

// Parse DATABASE_URL or use default socket connection
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  // If DATABASE_URL is empty or not set, use default socket connection
  if (!dbUrl || dbUrl.trim() === '') {
    // Default to local socket connection (PostgreSQL uses /tmp on macOS)
    return {
      host: '/tmp',
      database: 'showartz',
    };
  }
  
  // Check if connecting to Docker internal postgres (no SSL needed)
  const isDockerInternal = dbUrl.includes('@postgres:') || dbUrl.includes('host=postgres');
  
  // If it's a full connection string, use it
  if (dbUrl.startsWith('postgresql://')) {
    return {
      connectionString: dbUrl,
      // Docker internal connections don't need SSL
      ssl: isDockerInternal ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
    };
  }
  
  // Otherwise parse as connection string
  return {
    connectionString: dbUrl,
    // Docker internal connections don't need SSL
    ssl: isDockerInternal ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
  };
};

const poolConfig = {
  ...getDatabaseConfig(),
  max: 20, // 最大連接數
  idleTimeoutMillis: 30000, // 空閒連接超時（30秒）
  connectionTimeoutMillis: 2000, // 連接超時（2秒）
};

// Lazy initialization: 只有在實際使用時才創建 Pool，避免啟動時阻塞
let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool(poolConfig);
    // 添加錯誤處理，避免未處理的錯誤導致應用崩潰
    poolInstance.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
    });
  }
  return poolInstance;
}

// Initialize database schema
export async function initDatabase() {
  const client = await getPool().connect();
  try {
    // Create videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ig_url TEXT NOT NULL,
        title TEXT,
        thumbnail_url TEXT,
        category VARCHAR(20) NOT NULL CHECK (category IN ('hot', 'image', 'product', 'fun')),
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add thumbnail_url column if table already exists
    await client.query(`
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
    `);

    // Create images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_url TEXT NOT NULL,
        description TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shopee_item_id BIGINT UNIQUE,
        shopee_shop_id BIGINT DEFAULT 62981645,
        pinkoi_product_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        image_url TEXT,
        image_urls TEXT[],
        shopee_url TEXT,
        pinkoi_url TEXT,
        category TEXT,
        tags TEXT[],
        stock INTEGER DEFAULT 0,
        sales_count INTEGER DEFAULT 0,
        rating DECIMAL(3, 2),
        is_active BOOLEAN DEFAULT true,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT products_source_check CHECK (
          (shopee_item_id IS NOT NULL) OR (pinkoi_product_id IS NOT NULL)
        )
      );
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        nickname TEXT,
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active',
        membership_level VARCHAR(20) DEFAULT 'regular',
        total_points INTEGER DEFAULT 0,
        total_spent DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);

    // Create addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT DEFAULT 'TW',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create analytics tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id TEXT UNIQUE NOT NULL,
        first_visit_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_visit_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id TEXT NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        page_count INTEGER NOT NULL DEFAULT 0,
        referrer TEXT,
        user_agent TEXT,
        ip_address TEXT,
        device_type VARCHAR(20),
        screen_width INTEGER,
        screen_height INTEGER,
        language VARCHAR(10),
        country VARCHAR(2),
        city TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        page_path TEXT NOT NULL,
        page_title TEXT,
        entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        exited_at TIMESTAMP,
        duration_seconds INTEGER,
        scroll_depth INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT,
        visitor_id TEXT,
        event_type VARCHAR(50) NOT NULL,
        event_name TEXT NOT NULL,
        event_data JSONB,
        page_path TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
      CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(display_order);
      CREATE INDEX IF NOT EXISTS idx_images_order ON images(display_order);
      CREATE INDEX IF NOT EXISTS idx_products_shopee_item_id ON products(shopee_item_id);
      CREATE INDEX IF NOT EXISTS idx_products_pinkoi_product_id ON products(pinkoi_product_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON sessions(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_page_views_entered_at ON page_views(entered_at);
      CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
    `);
  } finally {
    client.release();
  }
}

// Video operations
export async function getAllVideos(category?: VideoCategory): Promise<Video[]> {
  let query = 'SELECT * FROM videos';
  const params: (VideoCategory)[] = [];

  if (category) {
    query += ' WHERE category = $1';
    params.push(category);
  }

  query += ' ORDER BY display_order ASC, created_at DESC';

  const result = await getPool().query(query, params);
  return result.rows;
}

export async function getVideoById(id: string): Promise<Video | null> {
  const result = await getPool().query('SELECT * FROM videos WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createVideo(
  igUrl: string,
  category: VideoCategory,
  title?: string,
  displayOrder?: number,
  thumbnailUrl?: string
): Promise<Video> {
  const maxOrderResult = await getPool().query(
    'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM videos WHERE category = $1',
    [category]
  );
  const nextOrder = displayOrder ?? maxOrderResult.rows[0].next_order;

  const result = await getPool().query(
    `INSERT INTO videos (ig_url, title, thumbnail_url, category, display_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [igUrl, title || null, thumbnailUrl || null, category, nextOrder]
  );
  return result.rows[0];
}

export async function updateVideo(
  id: string,
  updates: Partial<Pick<Video, 'ig_url' | 'title' | 'thumbnail_url' | 'category' | 'display_order'>>
): Promise<Video> {
  const fields: string[] = [];
  const values: (string | number | VideoCategory | null)[] = [];
  let paramIndex = 1;

  if (updates.ig_url !== undefined) {
    fields.push(`ig_url = $${paramIndex++}`);
    values.push(updates.ig_url);
  }
  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.thumbnail_url !== undefined) {
    fields.push(`thumbnail_url = $${paramIndex++}`);
    values.push(updates.thumbnail_url);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(updates.category);
  }
  if (updates.display_order !== undefined) {
    fields.push(`display_order = $${paramIndex++}`);
    values.push(updates.display_order);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await getPool().query(
    `UPDATE videos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteVideo(id: string): Promise<boolean> {
  const result = await getPool().query('DELETE FROM videos WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Image operations
export async function getAllImages(): Promise<Image[]> {
  const result = await getPool().query(
    'SELECT * FROM images ORDER BY display_order ASC, created_at DESC'
  );
  return result.rows;
}

export async function createImage(
  imageUrl: string,
  description?: string,
  displayOrder?: number
): Promise<Image> {
  const maxOrderResult = await getPool().query(
    'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM images'
  );
  const nextOrder = displayOrder ?? maxOrderResult.rows[0].next_order;

  const result = await getPool().query(
    `INSERT INTO images (image_url, description, display_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [imageUrl, description || null, nextOrder]
  );
  return result.rows[0];
}

export async function deleteImage(id: string): Promise<boolean> {
  const result = await getPool().query('DELETE FROM images WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Admin operations
export async function getAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const result = await getPool().query('SELECT * FROM admin_users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function createAdminUser(username: string, passwordHash: string): Promise<AdminUser> {
  const result = await getPool().query(
    'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING *',
    [username, passwordHash]
  );
  return result.rows[0];
}

// Product operations
export async function getAllProducts(filters?: {
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: (string | number | boolean | string[] | number[] | null)[] = [];
  let paramIndex = 1;

  if (filters?.isActive !== undefined) {
    query += ` AND is_active = $${paramIndex++}`;
    params.push(filters.isActive);
  } else {
    query += ' AND is_active = true';
  }

  if (filters?.category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(filters.category);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query += ` AND tags && $${paramIndex++}`;
    params.push(filters.tags);
  }

  if (filters?.minPrice !== undefined) {
    query += ` AND price >= $${paramIndex++}`;
    params.push(filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query += ` AND price <= $${paramIndex++}`;
    params.push(filters.maxPrice);
  }

  query += ' ORDER BY sales_count DESC, created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);
  }

  const result = await getPool().query(query, params);
  return result.rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await getPool().query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getProductByShopeeId(shopeeItemId: number): Promise<Product | null> {
  const result = await getPool().query('SELECT * FROM products WHERE shopee_item_id = $1', [shopeeItemId]);
  return result.rows[0] || null;
}

export async function upsertProductFromShopee(productData: {
  shopee_item_id: number;
  shopee_shop_id: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  image_urls?: string[];
  shopee_url: string;
  category?: string;
  tags?: string[];
  stock?: number;
  sales_count?: number;
  rating?: number;
}): Promise<Product> {
  const result = await getPool().query(
    `INSERT INTO products (
      shopee_item_id, shopee_shop_id, name, description, price, original_price,
      image_url, image_urls, shopee_url, category, tags, stock, sales_count, rating, last_synced_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
    ON CONFLICT (shopee_item_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      image_url = EXCLUDED.image_url,
      image_urls = EXCLUDED.image_urls,
      shopee_url = EXCLUDED.shopee_url,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      stock = EXCLUDED.stock,
      sales_count = EXCLUDED.sales_count,
      rating = EXCLUDED.rating,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      productData.shopee_item_id,
      productData.shopee_shop_id,
      productData.name,
      productData.description || null,
      productData.price,
      productData.original_price || null,
      productData.image_url || null,
      productData.image_urls || null,
      productData.shopee_url,
      productData.category || null,
      productData.tags || null,
      productData.stock || 0,
      productData.sales_count || 0,
      productData.rating || null,
    ]
  );
  return result.rows[0];
}

export async function getProductByPinkoiId(pinkoiProductId: string): Promise<Product | null> {
  const result = await getPool().query('SELECT * FROM products WHERE pinkoi_product_id = $1', [pinkoiProductId]);
  return result.rows[0] || null;
}

export async function upsertProductFromPinkoi(productData: {
  pinkoi_product_id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  image_urls?: string[];
  pinkoi_url: string;
  category?: string;
  tags?: string[];
  stock?: number;
  sales_count?: number;
  rating?: number;
}): Promise<Product> {
  const result = await getPool().query(
    `INSERT INTO products (
      pinkoi_product_id, name, description, price, original_price,
      image_url, image_urls, pinkoi_url, category, tags, stock, sales_count, rating, last_synced_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    ON CONFLICT (pinkoi_product_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      image_url = EXCLUDED.image_url,
      image_urls = EXCLUDED.image_urls,
      pinkoi_url = EXCLUDED.pinkoi_url,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      stock = EXCLUDED.stock,
      sales_count = EXCLUDED.sales_count,
      rating = EXCLUDED.rating,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      productData.pinkoi_product_id,
      productData.name,
      productData.description || null,
      productData.price,
      productData.original_price || null,
      productData.image_url || null,
      productData.image_urls || null,
      productData.pinkoi_url,
      productData.category || null,
      productData.tags || null,
      productData.stock || 0,
      productData.sales_count || 0,
      productData.rating || null,
    ]
  );
  return result.rows[0];
}

export async function searchProductsByTags(tags: string[]): Promise<Product[]> {
  if (tags.length === 0) {
    return getAllProducts();
  }
  try {
    console.log('[DB] searchProductsByTags called with tags:', tags);
    const result = await getPool().query(
      'SELECT * FROM products WHERE tags && $1 AND is_active = true ORDER BY sales_count DESC',
      [tags]
    );
    console.log('[DB] searchProductsByTags found', result.rows.length, 'products');
    return result.rows;
  } catch (error: unknown) {
    console.error('[DB] Error in searchProductsByTags:', error);
    throw error;
  }
}

export async function recommendProducts(criteria: {
  budget?: number;
  category?: string;
  tags?: string[];
  goal?: string;
}): Promise<Product[]> {
  const filters: Parameters<typeof getAllProducts>[0] = {
    isActive: true,
    limit: 10,
  };

  if (criteria.budget) {
    filters.maxPrice = criteria.budget;
  }

  if (criteria.category) {
    filters.category = criteria.category;
  }

  if (criteria.tags && criteria.tags.length > 0) {
    filters.tags = criteria.tags;
  }

  return getAllProducts(filters);
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const result = await getPool().query(
    `INSERT INTO products (
      shopee_item_id, shopee_shop_id, name, description, price, original_price,
      image_url, image_urls, shopee_url, category, tags, stock, sales_count, rating
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      productData.shopee_item_id,
      productData.shopee_shop_id || 62981645,
      productData.name,
      productData.description || null,
      productData.price,
      productData.original_price || null,
      productData.image_url || null,
      productData.image_urls || null,
      productData.shopee_url,
      productData.category || null,
      productData.tags || null,
      productData.stock || 0,
      productData.sales_count || 0,
      productData.rating || null,
    ]
  );
  return result.rows[0];
}

export async function updateProduct(
  id: string,
  updates: Partial<Pick<Product, 'name' | 'description' | 'price' | 'original_price' | 'image_url' | 'image_urls' | 'shopee_url' | 'category' | 'tags' | 'stock' | 'sales_count' | 'rating' | 'is_active'>>
): Promise<Product> {
  const fields: string[] = [];
  const values: (string | number | boolean | string[] | number[] | null)[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.price !== undefined) {
    fields.push(`price = $${paramIndex++}`);
    values.push(updates.price);
  }
  if (updates.original_price !== undefined) {
    fields.push(`original_price = $${paramIndex++}`);
    values.push(updates.original_price);
  }
  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url);
  }
  if (updates.image_urls !== undefined) {
    fields.push(`image_urls = $${paramIndex++}`);
    values.push(updates.image_urls);
  }
  if (updates.shopee_url !== undefined) {
    fields.push(`shopee_url = $${paramIndex++}`);
    values.push(updates.shopee_url);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(updates.category);
  }
  if (updates.tags !== undefined) {
    fields.push(`tags = $${paramIndex++}`);
    values.push(updates.tags);
  }
  if (updates.stock !== undefined) {
    fields.push(`stock = $${paramIndex++}`);
    values.push(updates.stock);
  }
  if (updates.sales_count !== undefined) {
    fields.push(`sales_count = $${paramIndex++}`);
    values.push(updates.sales_count);
  }
  if (updates.rating !== undefined) {
    fields.push(`rating = $${paramIndex++}`);
    values.push(updates.rating);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.is_active);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await getPool().query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await getPool().query('DELETE FROM products WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * 獲取指定商店的所有 Shopee 商品 ID
 */
export async function getShopeeProductIds(shopId: number): Promise<number[]> {
  const result = await getPool().query(
    'SELECT shopee_item_id FROM products WHERE shopee_shop_id = $1 AND shopee_item_id IS NOT NULL',
    [shopId]
  );
  return result.rows.map(row => row.shopee_item_id).filter((id): id is number => id !== null);
}

/**
 * 獲取指定商店的所有 Pinkoi 商品 ID
 */
export async function getPinkoiProductIds(): Promise<string[]> {
  const result = await getPool().query(
    'SELECT pinkoi_product_id FROM products WHERE pinkoi_product_id IS NOT NULL',
    []
  );
  return result.rows.map(row => row.pinkoi_product_id).filter((id): id is string => id !== null && id !== '');
}

/**
 * 標記指定 Shopee 商品為下架
 */
export async function deactivateShopeeProducts(shopId: number, itemIds: number[]): Promise<number> {
  if (itemIds.length === 0) {
    return 0;
  }
  const result = await getPool().query(
    `UPDATE products 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE shopee_shop_id = $1 AND shopee_item_id = ANY($2::bigint[])`,
    [shopId, itemIds]
  );
  return result.rowCount ?? 0;
}

/**
 * 標記指定 Pinkoi 商品為下架
 */
export async function deactivatePinkoiProducts(productIds: string[]): Promise<number> {
  if (productIds.length === 0) {
    return 0;
  }
  const result = await getPool().query(
    `UPDATE products 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE pinkoi_product_id = ANY($1::text[])`,
    [productIds]
  );
  return result.rowCount ?? 0;
}

/**
 * 清除占位圖片（如 space.gif），避免前端顯示假圖
 */
export async function clearPlaceholderImages(): Promise<number> {
  const result = await getPool().query(
    `
    UPDATE products
    SET image_url = NULL,
        image_urls = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE image_url LIKE '%space.gif%'
       OR EXISTS (
         SELECT 1 FROM unnest(COALESCE(image_urls, ARRAY[]::text[])) u
         WHERE u LIKE '%space.gif%'
       )
    `
  );
  return result.rowCount ?? 0;
}

/**
 * 將沒有圖片的商品標記為下架（is_active = false）
 */
export async function deactivateProductsWithoutImages(): Promise<number> {
  const result = await getPool().query(
    `
    UPDATE products
    SET is_active = false,
        updated_at = CURRENT_TIMESTAMP
    WHERE (image_url IS NULL OR image_url = '')
      AND (image_urls IS NULL OR array_length(image_urls, 1) = 0)
    `
  );
  return result.rowCount ?? 0;
}

/**
 * 執行資料庫操作，如果表格不存在則自動初始化
 * @param operation 要執行的資料庫操作函數
 * @param context 上下文名稱（用於日誌）
 * @returns 操作結果
 */
export async function executeWithAutoInit<T>(
  operation: () => Promise<T>,
  context: string = 'Database'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // 檢查是否為表格不存在的錯誤
    if (
      error instanceof Error &&
      (error.message.includes('relation') || error.message.includes('does not exist'))
    ) {
      console.log(`[${context}] 檢測到資料庫表格不存在，嘗試自動初始化...`);
      try {
        await initDatabase();
        console.log(`[${context}] 資料庫初始化成功，重試操作...`);
        // 初始化成功後，重試操作
        return await operation();
      } catch (initError) {
        console.error(`[${context}] 資料庫初始化失敗:`, initError);
        throw new Error('資料庫初始化失敗，請聯繫管理員');
      }
    }
    // 其他錯誤直接拋出
    throw error;
  }
}

// User operations
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  email_verified: boolean;
  status: string;
  membership_level: string;
  total_points: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await getPool().query('SELECT * FROM users WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  // 不返回密碼雜湊
  const { password_hash, ...user } = result.rows[0];
  return user as User;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  nickname?: string
): Promise<User> {
  const result = await getPool().query(
    `INSERT INTO users (email, password_hash, name, nickname)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, nickname, avatar_url, email_verified, status, 
               membership_level, total_points, total_spent, created_at, updated_at, last_login_at`,
    [email, passwordHash, name, nickname || null]
  );
  return result.rows[0];
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await getPool().query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'nickname' | 'avatar_url'>>
): Promise<User> {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.nickname !== undefined) {
    fields.push(`nickname = $${paramIndex++}`);
    values.push(updates.nickname || null);
  }
  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatar_url || null);
  }

  if (fields.length === 0) {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await getPool().query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} 
     RETURNING id, email, name, nickname, avatar_url, email_verified, status, 
               membership_level, total_points, total_spent, created_at, updated_at, last_login_at`,
    values
  );
  return result.rows[0];
}

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const result = await getPool().query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createAddress(
  userId: string,
  address: Omit<Address, 'id' | 'user_id' | 'created_at'>
): Promise<Address> {
  // 如果設為預設地址，先取消其他預設地址
  if (address.is_default) {
    await getPool().query(
      'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
      [userId]
    );
  }

  const result = await getPool().query(
    `INSERT INTO addresses (user_id, name, phone, address_line1, address_line2, city, postal_code, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      address.name,
      address.phone,
      address.address_line1,
      address.address_line2 || null,
      address.city,
      address.postal_code,
      address.country || 'TW',
      address.is_default || false,
    ]
  );
  return result.rows[0];
}

export async function updateAddress(
  addressId: string,
  userId: string,
  updates: Partial<Omit<Address, 'id' | 'user_id' | 'created_at'>>
): Promise<Address> {
  // 如果設為預設地址，先取消其他預設地址
  if (updates.is_default) {
    await getPool().query(
      'UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND id != $2',
      [userId, addressId]
    );
  }

  const fields: string[] = [];
  const values: (string | boolean | null)[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.address_line1 !== undefined) {
    fields.push(`address_line1 = $${paramIndex++}`);
    values.push(updates.address_line1);
  }
  if (updates.address_line2 !== undefined) {
    fields.push(`address_line2 = $${paramIndex++}`);
    values.push(updates.address_line2 || null);
  }
  if (updates.city !== undefined) {
    fields.push(`city = $${paramIndex++}`);
    values.push(updates.city);
  }
  if (updates.postal_code !== undefined) {
    fields.push(`postal_code = $${paramIndex++}`);
    values.push(updates.postal_code);
  }
  if (updates.country !== undefined) {
    fields.push(`country = $${paramIndex++}`);
    values.push(updates.country);
  }
  if (updates.is_default !== undefined) {
    fields.push(`is_default = $${paramIndex++}`);
    values.push(updates.is_default);
  }

  values.push(addressId);

  const result = await getPool().query(
    `UPDATE addresses SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = (SELECT user_id FROM addresses WHERE id = $${paramIndex} LIMIT 1)
     RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
  const result = await getPool().query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

// Admin user management functions
export async function getAllUsers(): Promise<User[]> {
  const result = await getPool().query(
    `SELECT id, email, name, nickname, avatar_url, email_verified, status, 
            membership_level, total_points, total_spent, created_at, updated_at, last_login_at
     FROM users 
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function updateUserStatus(
  userId: string,
  updates: Partial<Pick<User, 'status' | 'membership_level' | 'email_verified'>>
): Promise<User> {
  const fields: string[] = [];
  const values: (string | boolean)[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.membership_level !== undefined) {
    fields.push(`membership_level = $${paramIndex++}`);
    values.push(updates.membership_level);
  }
  if (updates.email_verified !== undefined) {
    fields.push(`email_verified = $${paramIndex++}`);
    values.push(updates.email_verified);
  }

  if (fields.length === 0) {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await getPool().query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} 
     RETURNING id, email, name, nickname, avatar_url, email_verified, status, 
               membership_level, total_points, total_spent, created_at, updated_at, last_login_at`,
    values
  );
  return result.rows[0];
}

export async function deleteUser(userId: string): Promise<boolean> {
  // 先刪除相關的地址記錄
  await getPool().query('DELETE FROM addresses WHERE user_id = $1', [userId]);
  // 再刪除用戶
  const result = await getPool().query('DELETE FROM users WHERE id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}

// 為 default 匯出提供現成的 Pool 實例，符合原本 pool.query 的使用方式
const pool = getPool();

export default pool;

