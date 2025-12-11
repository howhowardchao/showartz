import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function createAdmin() {
  const dbUrl = process.env.DATABASE_URL;
  const poolConfig = dbUrl 
    ? { connectionString: dbUrl }
    : {
        host: '/tmp',
        database: 'showartz',
      };
  
  const pool = new Pool(poolConfig);
  
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 檢查是否已存在
    const checkResult = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    
    if (checkResult.rows.length === 0) {
      await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', [username, passwordHash]);
      console.log(`✅ Admin user created: ${username} / ${password}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${username}`);
    }
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();

