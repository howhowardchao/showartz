import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { createAdminUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Initialize database schema
    await initDatabase();

    // Create default admin user if doesn't exist
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    try {
      const passwordHash = await hashPassword(password);
      await createAdminUser(username, passwordHash);
    } catch (error) {
      // User might already exist, that's okay
      console.log('Admin user might already exist', error);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully',
      admin: {
        username,
        password: 'Check .env.local for password',
      },
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}

