import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    const checks = {
      apiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      assistantId: !!assistantId,
      assistantIdValue: assistantId || 'NOT SET',
    };

    // Try to create OpenAI client
    let clientTest = false;
    let clientError = null;
    try {
      const openai = new OpenAI({ apiKey });
      // Try a simple API call
      await openai.models.list();
      clientTest = true;
    } catch (error: unknown) {
      clientError = toErrorMessage(error);
    }

    // Try to retrieve assistant
    let assistantTest = false;
    let assistantError = null;
    let assistantDetails = null;
    let assistantList = null;
    if (apiKey && assistantId) {
      try {
        const openai = new OpenAI({ apiKey });
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        assistantTest = !!assistant;
        assistantDetails = {
          id: assistant.id,
          name: assistant.name,
          model: assistant.model,
          tools_count: assistant.tools?.length || 0,
          tools: assistant.tools?.map(t => ({
            type: t.type,
            function: t.type === 'function' ? {
              name: t.function?.name,
              description: t.function?.description,
            } : null,
          })) || [],
        };
      } catch (error: unknown) {
        assistantError = toErrorMessage(error);
        // Try to list assistants to see what's available
        try {
          const openai = new OpenAI({ apiKey });
          const assistants = await openai.beta.assistants.list({ limit: 10 });
          assistantList = assistants.data.map(a => ({
            id: a.id,
            name: a.name,
            model: a.model,
            created_at: a.created_at,
            tools_count: a.tools?.length || 0,
          }));
        } catch {
          // Ignore list error
        }
      }
    }

    return NextResponse.json({
      success: true,
      checks,
      clientTest,
      clientError,
      assistantTest,
      assistantError,
      assistantDetails,
      assistantList,
      message: assistantTest 
        ? `Assistant 配置正確！已找到 Assistant "${assistantDetails?.name}"，配置了 ${assistantDetails?.tools_count || 0} 個工具。` 
        : assistantList && assistantList.length > 0
        ? `找不到指定的 Assistant，但找到 ${assistantList.length} 個其他 Assistant。請檢查 Assistant ID 是否正確，或使用列表中的 ID。`
        : '找不到指定的 Assistant，且無法列出其他 Assistant。請確認 Assistant ID 是否正確，或在 OpenAI 平台創建新的 Assistant。',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

