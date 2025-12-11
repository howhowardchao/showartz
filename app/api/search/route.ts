import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, createThread } from '@/lib/openai';
import { recommendProducts } from '@/lib/db';
import {
  getClientIP,
  canStartConversation,
  startConversation,
  isConversationActive,
  getCooldownRemaining,
} from '@/lib/chat-limiter';

export async function POST(request: NextRequest) {
  try {
    const { message, threadId } = await request.json();
    console.log('[Search API] Received request:', { message: message?.substring(0, 50), threadId });

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 獲取客戶端 IP
    const clientIP = getClientIP(request);
    console.log('[Search API] Client IP:', clientIP);

    // 檢查對話限制
    if (!threadId) {
      // 新對話：檢查是否可以開始
      const canStart = canStartConversation(clientIP);
      if (!canStart.allowed) {
        return NextResponse.json(
          {
            error: '抱歉，目前我的對話時間有限時，請您等候5分鐘後再與我聊聊。',
          },
          { status: 429 } // 429 Too Many Requests
        );
      }
      // 可以開始新對話，記錄開始時間
      startConversation(clientIP);
    } else {
      // 繼續對話：檢查對話是否仍在時間限制內
      const active = isConversationActive(clientIP);
      if (!active.active && active.reason === 'timeout') {
        return NextResponse.json(
          {
            error: '抱歉，目前我的對話時間有限時，請您等候5分鐘後再與我聊聊。',
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
      } catch (error: any) {
        console.error('Error creating thread:', error);
        return NextResponse.json(
          { 
            error: 'Failed to create thread',
            details: error?.message || String(error)
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
    try {
      console.log('[Search API] Sending message to OpenAI...');
      response = await sendMessage(currentThreadId, message);
      console.log('[Search API] Received response:', response?.substring(0, 100));
      
      // 移除 JSON metadata（如果存在）
      // 查找並移除 JSON 格式的 metadata（可能出現在回應的開頭、中間或結尾）
      let cleanedResponse = response;
      
      // 移除結尾的 JSON metadata（最常見的情況）
      const jsonMetadataPattern = /\s*\{[\s\S]*?"stage"[\s\S]*?\}\s*$/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPattern, '').trim();
      
      // 移除開頭的 JSON metadata
      const jsonMetadataPatternStart = /^\s*\{[\s\S]*?"stage"[\s\S]*?\}\s*/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPatternStart, '').trim();
      
      // 移除中間的 JSON metadata（如果存在）
      const jsonMetadataPatternMiddle = /\s*\{[\s\S]*?"stage"[\s\S]*?\}\s*/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPatternMiddle, ' ').trim();
      
      // 如果清理後的回應為空，使用原始回應
      response = cleanedResponse || response;
    } catch (error: any) {
      console.error('[Search API] Error sending message to OpenAI:', error);
      console.error('[Search API] Error stack:', error?.stack);
      return NextResponse.json(
        { 
          error: 'Failed to get response from assistant',
          details: error?.message || String(error)
        },
        { status: 500 }
      );
    }

    // 檢查回應中是否包含商品推薦需求
    // 只在明確需要推薦商品時才返回商品列表
    let recommendedProducts = null;
    
    // 更精確的判斷：檢查是否在推薦階段
    // 1. 檢查是否有明確的推薦意圖（不是簡單的關鍵字匹配）
    // 2. 檢查是否提到了具體的商品類型或需求
    const hasExplicitRecommendation = 
      (response.includes('推薦') && (response.includes('商品') || response.includes('產品'))) ||
      (response.includes('適合') && (response.includes('商品') || response.includes('產品'))) ||
      (response.includes('建議') && (response.includes('商品') || response.includes('產品'))) ||
      response.includes('🔮') || // 提示詞中使用的推薦標記
      response.includes('商品名稱'); // 推薦格式中的標記
    
    // 排除問候和一般性建議
    const isNotGreeting = !response.includes('你好') && !response.includes('問候');
    const hasProductContext = response.includes('背包') || 
                              response.includes('零錢包') || 
                              response.includes('腰包') ||
                              response.includes('貓頭鷹') ||
                              response.includes('熊貓') ||
                              response.includes('預算') ||
                              response.includes('價格');

    // 只在明確需要推薦且有商品上下文時才返回商品
    if (hasExplicitRecommendation && isNotGreeting && hasProductContext) {
      try {
        console.log('[Search API] Detected product recommendation request, fetching products...');
        // 從回應中提取可能的條件（這是一個簡化版本，未來可以改進）
        recommendedProducts = await recommendProducts({});
        // 限制返回數量為 5 個
        if (recommendedProducts.length > 5) {
          recommendedProducts = recommendedProducts.slice(0, 5);
        }
        console.log('[Search API] Found', recommendedProducts.length, 'products to recommend');
      } catch (error) {
        console.error('Error fetching recommended products:', error);
        // 不影響主要回應，繼續返回
      }
    }

    return NextResponse.json({
      response,
      threadId: currentThreadId,
      recommendedProducts: recommendedProducts || undefined,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

