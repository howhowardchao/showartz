import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSession } from '@/lib/auth';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// POST - Upload story image (admin only)
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

    // Validate file size (max 8MB)
    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 8MB limit.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `story_${timestamp}_${randomStr}.${extension}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'story');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/story/${filename}`;

    return NextResponse.json(
      {
        url: publicUrl,
        filename,
        size: file.size,
        type: file.type,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error uploading story image:', error);
    return NextResponse.json(
      { error: 'Failed to upload story image', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}


