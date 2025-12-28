import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAllVideos, createVideo } from '@/lib/db';
import { VideoCategory } from '@/lib/types';
import { getSession } from '@/lib/auth';

// GET - Get all videos (optional category filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as VideoCategory | null;
    const cacheKey = `videos-${category || 'all'}`;

    // 使用 Next.js 緩存（60 秒）
    const getCachedVideos = unstable_cache(
      async () => {
        return await getAllVideos(category || undefined);
      },
      [cacheKey],
      {
        revalidate: 60, // 60 秒緩存
        tags: ['videos']
      }
    );

    const videos = await getCachedVideos();
    return NextResponse.json(videos, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

// POST - Create new video (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ig_url, title, thumbnail_url, category, display_order } = await request.json();

    if (!ig_url || !category) {
      return NextResponse.json(
        { error: 'ig_url and category are required' },
        { status: 400 }
      );
    }

    const video = await createVideo(ig_url, category, title, display_order, thumbnail_url);
    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}

