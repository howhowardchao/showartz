'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, X } from 'lucide-react';

interface SearchAgentProps {
  onConversationChange?: (isActive: boolean) => void;
  onProductRecommendation?: (hasProducts: boolean) => void;
}

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
        throw new Error(errorData.error || errorData.details || 'Failed to get response');
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
        onProductRecommendation(hasProducts);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMessage = error?.message || '發生了未知錯誤';
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `抱歉，發生了錯誤：${errorMessage}。請檢查後端日誌或稍後再試。` 
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
    onProductRecommendation?.(false);
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
        className={`bg-magic-purple/20 rounded-lg border border-magic-gold/30 backdrop-blur-sm transition-all duration-500 ease-in-out ${
          hasMessages 
            ? 'p-6 md:p-8 shadow-2xl border-magic-gold/50' 
            : 'p-6 md:p-8'
        }`}
      >
        {/* 標題和清空按鈕 - 只在有對話時顯示 */}
        {hasMessages && (
          <div className="flex items-center justify-between mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-magic-gold magic-sparkle" />
              <h2 className="text-xl md:text-2xl font-magic text-magic-gold">
                藝棧精靈
              </h2>
            </div>
            <button
              onClick={handleClearConversation}
              className="text-magic-gold-light hover:text-magic-gold transition-colors p-1"
              title="清空對話"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 提示文字 - 只在沒有對話時顯示 */}
        {!hasMessages && (
          <div className="text-center text-magic-gold-light opacity-70 mb-6">
            <p className="font-magic text-lg">輕鬆聊藝棧、塔羅牌、商品推薦...</p>
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
                      ? 'bg-magic-gold text-magic-dark'
                      : 'bg-magic-blue/50 text-magic-gold-light'
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-magic-blue/50 rounded-lg px-4 py-2">
                  <Loader2 className="w-5 h-5 text-magic-gold animate-spin" />
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
            className="flex-1 bg-magic-dark border border-magic-gold/30 rounded-lg px-4 py-2 text-magic-gold-light focus:outline-none focus:border-magic-gold focus:ring-1 focus:ring-magic-gold transition-all duration-300"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-transparent border border-magic-gold/30 text-magic-gold rounded-lg px-4 py-2 hover:bg-magic-gold/10 hover:border-magic-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ minWidth: '44px' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

