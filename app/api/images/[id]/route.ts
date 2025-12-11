import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE - Delete image (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteImage(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

