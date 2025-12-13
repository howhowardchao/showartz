import { NextRequest, NextResponse } from 'next/server';
import { syncProductsFromPinkoi, getSyncStatus } from '@/lib/pinkoi-sync';
import { getSession } from '@/lib/auth';

// POST - Manual sync trigger (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'showartz';

    console.log(`[Pinkoi Sync API] Starting sync for store ${storeId}...`);
    
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
      const result = await syncProductsFromPinkoi(storeId);
      console.log(`[Pinkoi Sync API] Sync completed:`, result);
      
      // 恢復原始 console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      return NextResponse.json({
        ...result,
        message: result.total === 0 
          ? '未找到商品，請檢查商店 ID 是否正確。'
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
    console.error('Error syncing Pinkoi products:', error);
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



