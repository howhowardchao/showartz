import { NextRequest, NextResponse } from 'next/server';
import { getAllImages, createImage } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Get all images
export async function GET() {
  try {
    const images = await getAllImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// POST - Create new image (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, description, display_order } = await request.json();

    if (!image_url) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }

    const image = await createImage(image_url, description, display_order);
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}

