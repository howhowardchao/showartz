import OpenAI from 'openai';
import { Product } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || '';

/**
 * 塔羅顧問提示詞說明
 * 
 * 請在 OpenAI Assistant 平台上設定以下提示詞：
 * 
 * 角色定位：你是《藝棧 Tarot》塔羅顧問，一位溫柔、洞察力強、心理導向的塔羅牌占卜師。
 * 你同時也是一位「生活商品推薦顧問」，在使用者同意後可以依照其狀況推薦適合的商品或資源。
 * 
 * 互動流程：
 * 1. greeting - 問候與需求確認
 * 2. ask_topic - 選擇占卜主題（感情、工作、金錢、家庭、自我成長等）
 * 3. ask_question - 請使用者描述問題
 * 4. ask_card_count - 詢問要抽幾張牌（1-3張）
 * 5. tarot_reading - 模擬抽牌＋解牌
 * 6. ask_recommend - 詢問是否需要商品推薦
 * 7. recommend_collect → recommend - 收集條件並推薦商品
 * 
 * 完整提示詞請參考：readme/showartz Tarot 顧問＋商品推薦助理提示詞
 */

// Debug logging helper - only log in development
const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const debugError = (...args: unknown[]) => {
  // Always log errors, but with less detail in production
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  } else {
    // In production, only log error messages without stack traces
    const messages = args.map(arg => 
      arg instanceof Error ? arg.message : String(arg)
    );
    console.error(...messages);
  }
};

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY is not set');
  }
  if (!ASSISTANT_ID) {
    console.warn('⚠️  OPENAI_ASSISTANT_ID is not set');
  }
}

// Create or get thread for user session
export async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    if (!thread || !thread.id) {
      throw new Error('Failed to create thread: no ID returned');
    }
    return thread.id;
  } catch (error: unknown) {
    console.error('Error creating thread:', error);
    throw new Error(`Failed to create thread: ${toErrorMessage(error)}`);
  }
}

// Send message and get response with Function Calling support
export async function sendMessage(threadId: string, message: string): Promise<{
  response: string;
  recommendedProducts?: Product[];
}> {
  debugLog('[OpenAI] sendMessage called:', { threadId, messageLength: message.length });
  
  if (!threadId) {
    throw new Error('Thread ID is required');
  }

  if (!ASSISTANT_ID) {
    console.error('[OpenAI] ASSISTANT_ID is not configured');
    throw new Error('OpenAI Assistant ID is not configured');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('[OpenAI] OPENAI_API_KEY is not configured');
    throw new Error('OpenAI API key is not configured');
  }

  // 存儲 Function Calling 返回的推薦商品
  let recommendedProducts: Product[] = [];

  // Add message to thread
  try {
    debugLog('[OpenAI] Creating message in thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });
    debugLog('[OpenAI] Message created successfully');
  } catch (error: unknown) {
    debugError('[OpenAI] Error creating message:', error);
    throw new Error(`Failed to create message: ${toErrorMessage(error)}`);
  }

  // Run assistant
  let run;
  try {
    debugLog('[OpenAI] Creating run with assistant:', ASSISTANT_ID);
    run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    debugLog('[OpenAI] Run created:', run.id, 'Status:', run.status);
  } catch (error: unknown) {
    debugError('[OpenAI] Error creating run:', error);
    throw new Error(`Failed to create run: ${toErrorMessage(error)}`);
  }

  if (!run || !run.id) {
    throw new Error('Failed to create run');
  }

  // Poll for completion and handle function calls
  const maxWaitTime = 180000; // 180 seconds (增加時間以處理多次 Function Calling)
  const startTime = Date.now();
  let pollCount = 0;

  while (Date.now() - startTime < maxWaitTime) {
    pollCount++;
    // OpenAI SDK v6: retrieve(runId, params) where params includes thread_id
    let runStatus;
    try {
      runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });
      debugLog(`[OpenAI] Poll ${pollCount}: Status = ${runStatus.status}`);
    } catch (error: unknown) {
      debugError('[OpenAI] Error retrieving run status:', error);
      throw new Error(`Failed to retrieve run status: ${toErrorMessage(error)}`);
    }

    // Handle function calling
    if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
      debugLog('[OpenAI] Function calling required, processing tool calls...');
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          let functionArgs;
          
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            debugError('Error parsing function arguments:', e);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: false, error: 'Invalid function arguments' }),
            });
            continue;
          }

          // Execute function
          try {
            debugLog(`[OpenAI] Executing function: ${functionName}`, functionArgs);
            const { executeFunction } = await import('./openai-functions');
            const result = await executeFunction(functionName, functionArgs);
            debugLog(`[OpenAI] Function ${functionName} result:`, { 
              success: result.success, 
              productCount: result.products?.length || 0 
            });
            
            // 如果是商品相關函數且執行成功，保存商品列表
            if ((functionName === 'recommend_products' || functionName === 'search_products_by_tags') 
                && result.success && result.products) {
              recommendedProducts = result.products;
              debugLog(`[OpenAI] Extracted products from ${functionName}:`, recommendedProducts.length);
            }
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(result),
            });
          } catch (error: unknown) {
            debugError(`[OpenAI] Error executing function ${functionName}:`, error);
            debugError(`[OpenAI] Function arguments:`, functionArgs);
            debugError(`[OpenAI] Error stack:`, error?.stack);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ 
                success: false, 
                error: toErrorMessage(error),
              }),
            });
          }
        }
      }

      // Submit tool outputs
      if (toolOutputs.length > 0) {
        try {
          debugLog(`[OpenAI] Submitting ${toolOutputs.length} tool outputs...`);
          // OpenAI SDK v6: submitToolOutputs(runId, params) where params includes thread_id
          run = await openai.beta.threads.runs.submitToolOutputs(run.id, {
            thread_id: threadId,
            tool_outputs: toolOutputs,
          });
          debugLog('[OpenAI] Tool outputs submitted, waiting for next status...');
        } catch (error: unknown) {
          debugError('Error submitting tool outputs:', error);
          throw new Error(`Failed to submit tool outputs: ${toErrorMessage(error)}`);
        }
      } else {
        debugError('[OpenAI] No tool outputs to submit, but requires_action status');
      }
      
      // Wait a bit before checking status again after submitting tool outputs
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    // Check if completed
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      const latestMessage = assistantMessages[0];

      if (latestMessage) {
        // Handle different content types
        for (const content of latestMessage.content) {
          if (content.type === 'text') {
            const responseText = content.text.value;
            return {
              response: responseText,
              recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : undefined,
            };
          }
        }
      }
      
      throw new Error('No assistant message found');
    }

    if (runStatus.status === 'failed') {
      const errorMessage = runStatus.last_error?.message || 'Unknown error';
      const errorCode = runStatus.last_error?.code;
      debugError('OpenAI Run failed:', {
        status: runStatus.status,
        error: errorMessage,
        code: errorCode,
        runId: run.id,
      });
      throw new Error(`Run failed: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}`);
    }

    if (runStatus.status === 'cancelled' || runStatus.status === 'expired') {
      throw new Error(`Run ${runStatus.status}`);
    }

    // Handle other statuses (queued, in_progress)
    if (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      debugLog(`[OpenAI] Run is ${runStatus.status}, waiting...`);
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    // Unknown status
    debugError('[OpenAI] Unknown run status:', runStatus.status);
    throw new Error(`Unknown run status: ${runStatus.status}`);
  }

  debugError(`[OpenAI] Run timed out after ${maxWaitTime}ms (${pollCount} polls)`);
  throw new Error(`Run timed out after ${maxWaitTime}ms`);
}

// Stream response (for real-time updates)
export async function* streamMessage(threadId: string, message: string) {
  // Add message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });

  // Run assistant with streaming
  const stream = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
    stream: true,
  });

  for await (const event of stream) {
    if (event.event === 'thread.message.delta') {
      const delta = event.data.delta;
      if (delta.content && delta.content[0].type === 'text') {
        yield delta.content[0].text?.value || '';
      }
    }
  }
}

