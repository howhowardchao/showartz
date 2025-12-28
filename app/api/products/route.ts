import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAllProducts, createProduct } from '@/lib/db';
import { getSession } from '@/lib/auth';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

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

    const filters = { category, tags, minPrice, maxPrice, limit, offset };
    const cacheKey = `products-${JSON.stringify(filters)}`;

    // 使用 Next.js 緩存（60 秒）
    const getCachedProducts = unstable_cache(
      async () => {
        return await getAllProducts(filters);
      },
      [cacheKey],
      {
        revalidate: 60, // 60 秒緩存
        tags: ['products']
      }
    );

    const products = await getCachedProducts();

    // 將價格欄位強制轉成數字並移除可能的貨幣符號，避免前端顯示成 `$`
    const normalized = products.map((p) => {
      const toNumber = (v: unknown) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const parsed = parseFloat(v.replace(/[^\d.-]/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      const price = toNumber(p.price);
      const original_price_raw = p.original_price;
      const original_price = original_price_raw === null || original_price_raw === undefined
        ? undefined
        : toNumber(original_price_raw);
      return {
        ...p,
        price,
        original_price,
      };
    });

    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
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
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}



