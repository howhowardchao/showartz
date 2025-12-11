import { NextRequest, NextResponse } from 'next/server';
import { syncProductsFromShopee, getSyncStatus } from '@/lib/shopee-sync';
import { getSession } from '@/lib/auth';

// POST - Manual sync trigger (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') 
      ? parseInt(searchParams.get('shopId')!) 
      : 62981645;

    console.log(`[Sync API] Starting sync for shop ${shopId}...`);
    
    // 收集詳細日誌
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // 暫時攔截 console 輸出以收集日誌
    console.log = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      logs.push(`[LOG] ${msg}`);
      originalLog(...args);
    };
    console.error = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      logs.push(`[ERROR] ${msg}`);
      originalError(...args);
    };
    console.warn = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      logs.push(`[WARN] ${msg}`);
      originalWarn(...args);
    };
    
    try {
      const result = await syncProductsFromShopee(shopId);
      console.log(`[Sync API] Sync completed:`, result);
      
      // 恢復原始 console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      return NextResponse.json({
        ...result,
        message: result.total === 0 
          ? '未找到商品，可能是爬蟲無法訪問蝦皮頁面或頁面結構已變更。請檢查服務器日誌。'
          : `成功同步 ${result.success} 個商品`,
        logs: logs.slice(-50), // 返回最後 50 條日誌
      });
    } catch (error: any) {
      // 恢復原始 console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      throw error;
    }
  } catch (error: any) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync products',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// GET - Get sync status
export async function GET() {
  try {
    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

