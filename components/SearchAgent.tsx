'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, X } from 'lucide-react';
import { Product } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface SearchAgentProps {
  onConversationChange?: (isActive: boolean) => void;
  onProductRecommendation?: (hasProducts: boolean, products?: Product[]) => void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function SearchAgent({ onConversationChange, onProductRecommendation }: SearchAgentProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // 只滾動消息容器內部，不影響整個頁面
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // 只在有新消息時滾動，使用 setTimeout 確保 DOM 已更新
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  // 通知父組件對話狀態變化
  useEffect(() => {
    const hasMessages = messages.length > 0;
    onConversationChange?.(hasMessages);
  }, [messages, onConversationChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, threadId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        // 如果是 429 錯誤（限時/冷卻），直接顯示錯誤訊息
        if (response.status === 429) {
          throw new Error(errorData.error || '抱歉，目前我的對話時間有限時，請您等候5分鐘後再與我聊聊。');
        }
        // 使用詳細的錯誤訊息（如果有的話），否則使用錯誤訊息
        const errorMsg = errorData.details || errorData.error || 'Failed to get response';
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Save thread ID for conversation continuity
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      // 清理回應：移除 JSON metadata
      let cleanedResponse = data.response || '抱歉，我無法處理您的請求。';
      // 移除 JSON 格式的 metadata
      const jsonMetadataPattern = /\s*\{[\s\S]*"stage"[\s\S]*\}/;
      cleanedResponse = cleanedResponse.replace(jsonMetadataPattern, '').trim();
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: cleanedResponse },
      ]);
      
      // 通知是否需要顯示商品推薦
      if (onProductRecommendation) {
        const hasProducts = data.recommendedProducts && data.recommendedProducts.length > 0;
        const products = data.recommendedProducts || undefined;
        console.log('[SearchAgent] Product recommendation:', { hasProducts, productCount: products?.length });
        onProductRecommendation(hasProducts, products);
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
      const errorMessage = getErrorMessage(error) || '發生了未知錯誤';
      
      // 如果是限時/冷卻錯誤，只顯示等待訊息，不添加其他說明
      let displayMessage: string;
      if (errorMessage.includes('對話時間有限時') || errorMessage.includes('等候5分鐘')) {
        // 限時錯誤是正常的業務邏輯，只需要顯示等待訊息即可
        const cleanMessage = errorMessage.trim().replace(/。+$/, '');
        displayMessage = `${cleanMessage}。`;
      } else {
        // 其他錯誤才需要顯示「請檢查後端日誌或稍後再試」
        displayMessage = `抱歉，發生了錯誤：${errorMessage}。請檢查後端日誌或稍後再試。`;
      }
      
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: displayMessage
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setThreadId(null);
    onConversationChange?.(false);
    onProductRecommendation?.(false, undefined);
  };

  const hasMessages = messages.length > 0;

  return (
    <div 
      id="search-agent-container"
      className={`w-full mx-auto mb-12 transition-all duration-500 ease-in-out ${
        hasMessages 
          ? 'max-w-5xl' 
          : 'max-w-4xl'
      }`}
    >
      <div 
        className={`rounded-2xl border border-[var(--border)] bg-white shadow-md transition-all duration-500 ease-in-out ${
          hasMessages 
            ? 'p-6 md:p-8 shadow-lg' 
            : 'p-6 md:p-8'
        }`}
      >
        {/* 標題和清空按鈕 - 只在有對話時顯示 */}
        {hasMessages && (
          <div className="flex items-center justify-between mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl md:text-2xl font-semibold text-[var(--foreground)]">
                藝棧精靈
              </h2>
            </div>
            <button
              onClick={handleClearConversation}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1"
              title="清空對話"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 提示文字 - 只在沒有對話時顯示 */}
        {!hasMessages && (
          <div className="text-center text-[var(--muted)] opacity-90 mb-6">
            <p className="text-lg font-medium">輕鬆聊藝棧、塔羅牌、商品推薦...</p>
          </div>
        )}

        {/* Messages - 只在有對話時顯示 */}
        {hasMessages && (
          <div 
            ref={messagesContainerRef}
            className="overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar transition-all duration-500 ease-in-out h-64 md:h-80"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex animate-fade-in ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-sm md:text-base text-[var(--foreground)]">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                          li: ({ children }) => <li className="ml-1">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-[var(--foreground)]">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-[var(--foreground)]">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-[var(--foreground)]">{children}</h3>,
                          code: ({ children }) => <code className="bg-[var(--border)] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--border)] pl-3 italic my-2 text-[var(--muted)]">{children}</blockquote>,
                          hr: () => <hr className="border-[var(--border)] my-3" />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--border)] rounded-lg px-4 py-2">
                  <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input - 始終顯示在聊天框內 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輕鬆聊"
            className="flex-1 bg-white border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-300 shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[var(--primary)] border border-[var(--primary)] text-white rounded-lg px-4 py-2 hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            style={{ minWidth: '44px' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

