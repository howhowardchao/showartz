import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Get all products (optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const products = await getAllProducts({
      category,
      tags,
      minPrice,
      maxPrice,
      limit,
      offset,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shopee_item_id,
      shopee_shop_id,
      name,
      description,
      price,
      original_price,
      image_url,
      image_urls,
      shopee_url,
      category,
      tags,
      stock,
      sales_count,
      rating,
    } = body;

    if (!shopee_item_id || !name || !price || !shopee_url) {
      return NextResponse.json(
        { error: 'shopee_item_id, name, price, and shopee_url are required' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      shopee_item_id,
      shopee_shop_id: shopee_shop_id || 62981645,
      name,
      description,
      price,
      original_price,
      image_url,
      image_urls,
      shopee_url,
      category,
      tags,
      stock,
      sales_count,
      rating,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error?.message },
      { status: 500 }
    );
  }
}

