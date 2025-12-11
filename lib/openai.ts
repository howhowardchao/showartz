import OpenAI from 'openai';

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
  } catch (error: any) {
    console.error('Error creating thread:', error);
    throw new Error(`Failed to create thread: ${error?.message || String(error)}`);
  }
}

// Send message and get response with Function Calling support
export async function sendMessage(threadId: string, message: string) {
  console.log('[OpenAI] sendMessage called:', { threadId, messageLength: message.length });
  
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

  // Add message to thread
  try {
    console.log('[OpenAI] Creating message in thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });
    console.log('[OpenAI] Message created successfully');
  } catch (error: any) {
    console.error('[OpenAI] Error creating message:', error);
    throw new Error(`Failed to create message: ${error?.message || String(error)}`);
  }

  // Run assistant
  let run;
  try {
    console.log('[OpenAI] Creating run with assistant:', ASSISTANT_ID);
    run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    console.log('[OpenAI] Run created:', run.id, 'Status:', run.status);
  } catch (error: any) {
    console.error('[OpenAI] Error creating run:', error);
    throw new Error(`Failed to create run: ${error?.message || String(error)}`);
  }

  if (!run || !run.id) {
    throw new Error('Failed to create run');
  }

  // Poll for completion and handle function calls
  const maxWaitTime = 120000; // 120 seconds (增加時間以處理 Function Calling)
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });

    // Handle function calling
    if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          let functionArgs;
          
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error('Error parsing function arguments:', e);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: false, error: 'Invalid function arguments' }),
            });
            continue;
          }

          // Execute function
          try {
            const { executeFunction } = await import('./openai-functions');
            const result = await executeFunction(functionName, functionArgs);
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(result),
            });
          } catch (error: any) {
            console.error(`Error executing function ${functionName}:`, error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ 
                success: false, 
                error: error?.message || String(error) 
              }),
            });
          }
        }
      }

      // Submit tool outputs
      if (toolOutputs.length > 0) {
        try {
          run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
            tool_outputs: toolOutputs,
          });
        } catch (error: any) {
          console.error('Error submitting tool outputs:', error);
          throw new Error(`Failed to submit tool outputs: ${error?.message || String(error)}`);
        }
      }
      
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
            return content.text.value;
          }
        }
      }
      
      throw new Error('No assistant message found');
    }

    if (runStatus.status === 'failed') {
      const errorMessage = runStatus.last_error?.message || 'Unknown error';
      const errorCode = runStatus.last_error?.code;
      console.error('OpenAI Run failed:', {
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

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

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

