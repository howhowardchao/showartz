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

const pool = new Pool(poolConfig);

// Initialize database schema
export async function initDatabase() {
  const client = await pool.connect();
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
    `);
  } finally {
    client.release();
  }
}

// Video operations
export async function getAllVideos(category?: VideoCategory): Promise<Video[]> {
  let query = 'SELECT * FROM videos';
  const params: any[] = [];

  if (category) {
    query += ' WHERE category = $1';
    params.push(category);
  }

  query += ' ORDER BY display_order ASC, created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getVideoById(id: string): Promise<Video | null> {
  const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createVideo(
  igUrl: string,
  category: VideoCategory,
  title?: string,
  displayOrder?: number,
  thumbnailUrl?: string
): Promise<Video> {
  const maxOrderResult = await pool.query(
    'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM videos WHERE category = $1',
    [category]
  );
  const nextOrder = displayOrder ?? maxOrderResult.rows[0].next_order;

  const result = await pool.query(
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
  const values: any[] = [];
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

  const result = await pool.query(
    `UPDATE videos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteVideo(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM videos WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Image operations
export async function getAllImages(): Promise<Image[]> {
  const result = await pool.query(
    'SELECT * FROM images ORDER BY display_order ASC, created_at DESC'
  );
  return result.rows;
}

export async function createImage(
  imageUrl: string,
  description?: string,
  displayOrder?: number
): Promise<Image> {
  const maxOrderResult = await pool.query(
    'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM images'
  );
  const nextOrder = displayOrder ?? maxOrderResult.rows[0].next_order;

  const result = await pool.query(
    `INSERT INTO images (image_url, description, display_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [imageUrl, description || null, nextOrder]
  );
  return result.rows[0];
}

export async function deleteImage(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM images WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// Admin operations
export async function getAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function createAdminUser(username: string, passwordHash: string): Promise<AdminUser> {
  const result = await pool.query(
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
  const params: any[] = [];
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

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getProductByShopeeId(shopeeItemId: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE shopee_item_id = $1', [shopeeItemId]);
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
  const result = await pool.query(
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
  const result = await pool.query('SELECT * FROM products WHERE pinkoi_product_id = $1', [pinkoiProductId]);
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
  const result = await pool.query(
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
  const result = await pool.query(
    'SELECT * FROM products WHERE tags && $1 AND is_active = true ORDER BY sales_count DESC',
    [tags]
  );
  return result.rows;
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
  const result = await pool.query(
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
  const values: any[] = [];
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

  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * 獲取指定商店的所有 Shopee 商品 ID
 */
export async function getShopeeProductIds(shopId: number): Promise<number[]> {
  const result = await pool.query(
    'SELECT shopee_item_id FROM products WHERE shopee_shop_id = $1 AND shopee_item_id IS NOT NULL',
    [shopId]
  );
  return result.rows.map(row => row.shopee_item_id).filter((id): id is number => id !== null);
}

/**
 * 獲取指定商店的所有 Pinkoi 商品 ID
 */
export async function getPinkoiProductIds(): Promise<string[]> {
  const result = await pool.query(
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
  const result = await pool.query(
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
  const result = await pool.query(
    `UPDATE products 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE pinkoi_product_id = ANY($1::text[])`,
    [productIds]
  );
  return result.rowCount ?? 0;
}

export default pool;

