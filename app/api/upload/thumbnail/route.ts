import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSession } from '@/lib/auth';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// POST - Upload thumbnail image (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `thumbnail_${timestamp}_${randomStr}.${extension}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'thumbnails');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 獲取完整 URL（生產環境）或相對路徑（開發環境）
    const getPublicUrl = (relativePath: string) => {
      if (process.env.NODE_ENV === 'production') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                       request.headers.get('host') ? `https://${request.headers.get('host')}` : 
                       'https://showartz.com';
        return `${siteUrl}${relativePath}`;
      }
      return relativePath;
    };

    const relativePath = `/uploads/thumbnails/${filename}`;
    const publicUrl = getPublicUrl(relativePath);
    
    return NextResponse.json({ 
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

