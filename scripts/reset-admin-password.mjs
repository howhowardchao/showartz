// 重置管理員密碼腳本
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

async function resetPassword() {
  const username = process.env.ADMIN_USERNAME || 'Showartzadmin';
  const password = process.env.ADMIN_PASSWORD || '#@o09sfg!';
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 更新或創建管理員帳號
    await pool.query(
      `INSERT INTO admin_users (username, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $2`,
      [username, passwordHash]
    );
    
    console.log(`✅ 管理員密碼已重置: ${username} / ${password}`);
    console.log('✅ 現在可以使用此帳密登入後台');
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetPassword();


