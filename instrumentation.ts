/**
 * Next.js Instrumentation Hook
 * 用於添加全局錯誤處理，防止未捕獲的異常導致應用崩潰
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 處理未捕獲的異常
    process.on('uncaughtException', (error: Error) => {
      console.error('[Uncaught Exception]', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString(),
      });
      
      // 不要立即退出，記錄錯誤並繼續運行
      // 只有在嚴重錯誤時才考慮退出
      if (error.message.includes('FATAL') || error.message.includes('CRITICAL')) {
        console.error('[Fatal Error] Application will exit');
        process.exit(1);
      }
    });

    // 處理未處理的 Promise rejection
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      const errorMessage = reason instanceof Error 
        ? reason.message 
        : String(reason);
      const errorStack = reason instanceof Error 
        ? reason.stack 
        : 'No stack trace';
      
      console.error('[Unhandled Rejection]', {
        reason: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      });
      
      // 不要讓未處理的 Promise rejection 導致應用崩潰
      // 記錄錯誤即可
    });

    // 處理警告
    process.on('warning', (warning: Error) => {
      console.warn('[Process Warning]', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        timestamp: new Date().toISOString(),
      });
    });

    console.log('[Instrumentation] Global error handlers registered');
  }
}

