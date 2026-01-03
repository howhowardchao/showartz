import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, createThread } from '@/lib/openai';
import { recommendProducts } from '@/lib/db';
import {
  getClientIP,
  canStartConversation,
  startConversation,
  isConversationActive,
  getCooldownRemaining,
  getRateLimitSettings,
} from '@/lib/chat-limiter';
import { getUserSession } from '@/app/api/auth/user/session/route';
import { Product } from '@/lib/types';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function POST(request: NextRequest) {
  try {
    const { message, threadId } = await request.json();
    console.log('[Search API] Received request:', { message: message?.substring(0, 50), threadId });

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 檢查用戶是否登入
    const userSession = getUserSession(request);
    const isMember = !!userSession && userSession.type === 'user';
    
    // 獲取標識符：會員使用 userId，訪客使用 IP
    const identifier = isMember ? userSession.userId : getClientIP(request);
    console.log('[Search API] User:', { isMember, identifier: identifier.substring(0, 10) + '...' });

    // 檢查對話限制（使用動態設定）
    if (!threadId) {
      // 新對話：檢查是否可以開始
      const canStart = await canStartConversation(identifier, isMember);
      if (!canStart.allowed) {
        // 獲取實際的冷卻期剩餘時間
        const cooldownRemaining = getCooldownRemaining(identifier, isMember);
        const limits = await getRateLimitSettings(isMember);
        const cooldownSeconds = Math.ceil(limits.cooldown_ms / 1000);
        const cooldownMinutes = Math.ceil(cooldownSeconds / 60);
        
        // 如果有剩餘時間，顯示剩餘時間；否則顯示完整的冷卻期
        let waitTime: string;
        if (cooldownRemaining !== null && cooldownRemaining > 0) {
          const remainingMinutes = Math.ceil(cooldownRemaining / 60);
          waitTime = remainingMinutes > 1 ? `${remainingMinutes} 分鐘` : `${cooldownRemaining} 秒`;
        } else {
          waitTime = cooldownMinutes > 1 ? `${cooldownMinutes} 分鐘` : `${cooldownSeconds} 秒`;
        }
        
        // 構建錯誤訊息
        let cooldownMsg = `抱歉，目前我的對話時間有限時，請您等候${waitTime}後再與我聊聊。`;
        
        // 如果用戶未登入，添加會員註冊建議
        if (!isMember) {
          cooldownMsg += `\n\n💡 提示：加入會員可以獲得更多的聊天時間！立即[註冊會員](/register)享受更好的服務體驗。`;
        }
        
        return NextResponse.json(
          {
            error: cooldownMsg,
          },
          { status: 429 } // 429 Too Many Requests
        );
      }
      // 可以開始新對話，記錄開始時間
      await startConversation(identifier, isMember);
    } else {
      // 繼續對話：檢查對話是否仍在時間限制內
      const active = await isConversationActive(identifier, isMember);
      if (!active.active && active.reason === 'timeout') {
        // 獲取實際的冷卻期剩餘時間
        const cooldownRemaining = getCooldownRemaining(identifier, isMember);
        const limits = await getRateLimitSettings(isMember);
        const cooldownSeconds = Math.ceil(limits.cooldown_ms / 1000);
        const cooldownMinutes = Math.ceil(cooldownSeconds / 60);
        
        // 如果有剩餘時間，顯示剩餘時間；否則顯示完整的冷卻期
        let waitTime: string;
        if (cooldownRemaining !== null && cooldownRemaining > 0) {
          const remainingMinutes = Math.ceil(cooldownRemaining / 60);
          waitTime = remainingMinutes > 1 ? `${remainingMinutes} 分鐘` : `${cooldownRemaining} 秒`;
        } else {
          waitTime = cooldownMinutes > 1 ? `${cooldownMinutes} 分鐘` : `${cooldownSeconds} 秒`;
        }
        
        // 構建錯誤訊息
        let cooldownMsg = `抱歉，目前我的對話時間有限時，請您等候${waitTime}後再與我聊聊。`;
        
        // 如果用戶未登入，添加會員註冊建議
        if (!isMember) {
          cooldownMsg += `\n\n💡 提示：加入會員可以獲得更多的聊天時間！立即[註冊會員](/register)享受更好的服務體驗。`;
        }
        
        return NextResponse.json(
          {
            error: cooldownMsg,
          },
          { status: 429 }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json(
        { error: 'OpenAI Assistant ID is not configured' },
        { status: 500 }
      );
    }

    let currentThreadId = threadId;

    // Create new thread if not provided
    if (!currentThreadId) {
      try {
        currentThreadId = await createThread();
      } catch (error: unknown) {
        console.error('Error creating thread:', error);
        return NextResponse.json(
          { 
            error: 'Failed to create thread',
            details: toErrorMessage(error)
          },
          { status: 500 }
        );
      }
    }

    if (!currentThreadId) {
      return NextResponse.json(
        { error: 'Failed to get thread ID' },
        { status: 500 }
      );
    }

    // Send message and get response
    let response: string;
    let functionCallingProducts: Product[] | undefined;
    try {
      console.log('[Search API] Sending message to OpenAI...');
      const result = await sendMessage(currentThreadId, message);
      response = result.response;
      functionCallingProducts = result.recommendedProducts;
      console.log('[Search API] Received response:', response?.substring(0, 100));
      if (functionCallingProducts && functionCallingProducts.length > 0) {
        console.log('[Search API] Function Calling returned', functionCallingProducts.length, 'recommended products');
      }
      
      // 移除 JSON metadata（如果存在）
      // 查找並移除 JSON 格式的 metadata（可能出現在回應的開頭、中間或結尾）
      let cleanedResponse = response;
      
      // 移除結尾的 JSON metadata（最常見的情況）- 更精確的匹配
      const jsonMetadataPatternEnd = /\s*\{[\s\S]*?"(?:stage|product|tarot)"[\s\S]*?\}\s*$/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPatternEnd, '').trim();
      
      // 移除開頭的 JSON metadata
      const jsonMetadataPatternStart = /^\s*\{[\s\S]*?"(?:stage|product|tarot)"[\s\S]*?\}\s*/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPatternStart, '').trim();
      
      // 移除中間的 JSON metadata（如果存在）- 更精確的匹配
      const jsonMetadataPatternMiddle = /\s*\{[\s\S]*?"(?:stage|product|tarot)"[\s\S]*?\}\s*/g;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPatternMiddle, ' ').trim();
      
      // 移除任何殘留的 JSON 格式內容（更徹底的清理）
      // 匹配任何看起來像 JSON 對象的內容（包含 "stage", "product", "tarot" 等關鍵字）
      const anyJsonPattern = /\s*\{[^}]*"(?:stage|product|tarot|need_recommend|budget|category|goal)"[^}]*\}\s*/g;
      cleanedResponse = cleanedResponse.replace(anyJsonPattern, '').trim();
      
      // 如果清理後的回應為空，使用原始回應
      response = cleanedResponse || response;
    } catch (error: unknown) {
      console.error('[Search API] Error sending message to OpenAI:', error);
      if (error instanceof Error) {
        console.error('[Search API] Error stack:', error.stack);
      }
      
      // 提供更友好的錯誤訊息
      let errorMessage = 'Failed to get response from assistant';
      let errorDetails = toErrorMessage(error);
      
      // 根據錯誤類型提供不同的訊息
      if (errorDetails.includes('timed out') || errorDetails.includes('timeout')) {
        errorMessage = '回應時間過長，請稍後再試';
        errorDetails = 'Assistant 回應超時，可能是因為處理時間過長。請稍後再試或簡化您的問題。';
      } else if (errorDetails.includes('Run failed')) {
        errorMessage = 'Assistant 處理失敗';
        errorDetails = 'Assistant 無法處理您的請求，請稍後再試。';
      } else if (errorDetails.includes('No assistant message found')) {
        errorMessage = '未收到回應';
        errorDetails = 'Assistant 未返回有效回應，請稍後再試。';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
        },
        { status: 500 }
      );
    }

    // 完全依賴 Function Calling 返回的商品
    // 如果 AI 需要推薦商品，應該通過 Function Calling 來實現
    // 這樣可以避免誤判和重複添加商品
    const recommendedProducts = functionCallingProducts || undefined;

    return NextResponse.json({
      response,
      threadId: currentThreadId,
      recommendedProducts,
    });
  } catch (error: unknown) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request',
        details: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

