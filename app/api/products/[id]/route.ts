import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const product = await getProductById(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const product = await updateProduct(id, body);

    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    console.log('[Delete Product] Attempting to delete product:', id);
    
    const success = await deleteProduct(id);

    if (!success) {
      console.log('[Delete Product] Product not found:', id);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('[Delete Product] Successfully deleted product:', id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Delete Product] Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

