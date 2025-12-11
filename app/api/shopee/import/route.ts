import { NextRequest, NextResponse } from 'next/server';
import { upsertProductFromShopee } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * 手動批量導入商品
 * 接受商品列表 JSON
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const products = Array.isArray(body) ? body : [body];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const product of products) {
      try {
        await upsertProductFromShopee({
          shopee_item_id: product.shopee_item_id || product.item_id,
          shopee_shop_id: product.shopee_shop_id || product.shop_id || 62981645,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url || product.image,
          image_urls: product.image_urls || product.images,
          shopee_url: product.shopee_url || product.url,
          category: product.category,
          tags: product.tags || [],
          stock: product.stock || 0,
          sales_count: product.sales_count || product.sold || 0,
          rating: product.rating,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`商品 ${product.name || product.shopee_item_id}: ${error?.message || String(error)}`);
      }
    }

    return NextResponse.json({
      ...results,
      message: `成功導入 ${results.success} 個商品，失敗 ${results.failed} 個`,
    });
  } catch (error: any) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import products',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

