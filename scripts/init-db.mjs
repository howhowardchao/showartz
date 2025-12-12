// Script to initialize database schema and create admin user
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

// Check if connecting to Docker internal postgres (no SSL needed)
const isDockerInternal = process.env.DATABASE_URL?.includes('@postgres:') || process.env.DATABASE_URL?.includes('host=postgres');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Docker internal connections don't need SSL
  ssl: isDockerInternal ? false : undefined,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ig_url TEXT NOT NULL,
        title TEXT,
        category VARCHAR(20) NOT NULL CHECK (category IN ('hot', 'image', 'product', 'fun')),
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
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
        shopee_item_id BIGINT UNIQUE NOT NULL,
        shopee_shop_id BIGINT NOT NULL DEFAULT 62981645,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        image_url TEXT,
        image_urls TEXT[],
        shopee_url TEXT NOT NULL,
        category TEXT,
        tags TEXT[],
        stock INTEGER DEFAULT 0,
        sales_count INTEGER DEFAULT 0,
        rating DECIMAL(3, 2),
        is_active BOOLEAN DEFAULT true,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
      CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(display_order);
      CREATE INDEX IF NOT EXISTS idx_images_order ON images(display_order);
      CREATE INDEX IF NOT EXISTS idx_products_shopee_item_id ON products(shopee_item_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
    `);

    console.log('✅ Database schema created');

    // Create admin user if it doesn't exist
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingUser = await client.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length === 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [username, passwordHash]
      );
      console.log(`✅ Admin user created: ${username} / ${password}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${username}`);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();

