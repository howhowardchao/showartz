'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Wand2, Sparkles, Loader2, X } from 'lucide-react';
import { Product } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import ProductCard from './ProductCard';

interface SearchAgentProps {
  onConversationChange?: (isActive: boolean) => void;
  onProductRecommendation?: (hasProducts: boolean, products?: Product[]) => void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// 塔羅牌名稱到檔案名的映射（22 張大阿爾克納）
const TAROT_CARD_MAP: Record<string, string> = {
  '愚者': 'major-0-fool',
  '魔術師': 'major-1-magician',
  '女祭司': 'major-2-high-priestess',
  '皇后': 'major-3-empress',
  '皇帝': 'major-4-emperor',
  '教皇': 'major-5-hierophant',
  '戀人': 'major-6-lovers',
  '戰車': 'major-7-chariot',
  '力量': 'major-8-strength',
  '隱者': 'major-9-hermit',
  '命運之輪': '10-wheel-of-fortune',
  '正義': '11-justice',
  '倒吊人': '12-hanged-man',
  '死神': 'major-13-death',
  '節制': 'major-14-temperance',
  '惡魔': 'major-15-devil',
  '塔': 'major-16-tower',
  '星星': 'major-17-star',
  '月亮': 'major-18-moon',
  '太陽': 'major-19-sun',
  '審判': 'major-20-judgement',
  '世界': 'major-21-world',
};

// 按牌名長度排序（長的名稱優先匹配，避免部分匹配問題）
// 移到函數外部，避免每次調用都重新排序
const SORTED_CARDS = Object.entries(TAROT_CARD_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

/**
 * 輔助函數：從文本中提取並匹配牌名
 */
const extractCardName = (text: string): string | null => {
  // 移除可能的英文括號內容和標點符號
  let cardName = text.replace(/[（(].*?[）)]/g, '').trim();
  cardName = cardName.replace(/[【】：:。，、-]/g, '').trim();
  
  // 檢查是否匹配任何牌名
  for (const [chineseName] of SORTED_CARDS) {
    if (cardName === chineseName || cardName.startsWith(chineseName)) {
      return chineseName;
    }
  }
  return null;
};

/**
 * 輔助函數：生成圖片 Markdown
 */
const generateImageMarkdown = (foundCards: Map<string, string>): string => {
  return Array.from(foundCards.entries())
    .map(([chineseName, fileName]) => {
      const imagePath = `/tarot/${fileName}.jpg`;
      return `![${chineseName}](${imagePath})`;
    })
    .join('\n\n');
};

/**
 * 嘗試解析結構化的 cards JSON（若模型有輸出）
 * 支援從 ```json 區塊或直接 JSON 文字中擷取
 */
const extractStructuredCards = (content: string): string[] => {
  const allowed = new Set(Object.keys(TAROT_CARD_MAP));
  const tryParse = (text: string): string[] => {
    try {
      const obj = JSON.parse(text);
      const cards = obj?.cards;
      if (Array.isArray(cards)) {
        const names: string[] = [];
        cards.forEach((c) => {
          const n = c?.name || c?.card || c?.title;
          if (typeof n === 'string' && allowed.has(n)) {
            names.push(n);
          }
        });
        return names;
      }
    } catch (e) {
      // ignore parse error
    }
    return [];
  };

  // 1) ```json ... ```
  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (fencedMatch && fencedMatch[1]) {
    const names = tryParse(fencedMatch[1]);
    if (names.length > 0) return names;
  }

  // 2) 任意看似 JSON 的片段（最多 2000 字元）
  const anyJson = content.match(/\{[\s\S]{0,2000}\}/);
  if (anyJson && anyJson[0]) {
    const names = tryParse(anyJson[0]);
    if (names.length > 0) return names;
  }

  return [];
};

/**
 * 解析消息中的塔羅牌名稱並在文字最後添加圖片標記
 * 使用白名單機制：只匹配明確的抽牌格式，避免誤判解讀文字中的牌名
 * @param content 原始消息內容
 * @returns 添加了圖片標記的內容
 */
const parseTarotCards = (content: string): string => {
  // 先檢查內容中是否已經包含圖片標記，如果有則跳過處理（避免重複）
  if (content.includes('![') && content.includes('/tarot/')) {
    return content;
  }

  // 前置：如果還在詢問張數/前置問句，且未有抽牌語句，直接跳過
  const preDrawKeywords = ['抽幾張', '想抽幾張', '要抽幾張', '選擇', '1 張', '3 張', '一張', '三張', '抽幾張牌'];
  const hasPreDraw = preDrawKeywords.some((k) => content.includes(k));
  const hasDrawPhrase = /抽到的牌是/.test(content);
  if (hasPreDraw && !hasDrawPhrase) {
    return content;
  }

  // 檢查是否為抽牌語境：有「抽到的牌是」或有三張牌格式（過去/現在/建議：牌名）
  // 更精確的判斷：只有在「抽到的牌是」之後，且明確有「過去：牌名」「現在：牌名」「建議：牌名」格式時，才判斷為三張牌
  let hasThreeCardFormat = false;
  if (hasDrawPhrase) {
    const drawBlockPattern = /抽到的牌是[：:\s-【\[]?/;
    const drawBlockMatch = content.match(drawBlockPattern);
    if (drawBlockMatch && drawBlockMatch.index !== undefined) {
      const start = drawBlockMatch.index;
      const block = content.substring(start, Math.min(content.length, start + 500));
      // 檢查是否有明確的三張牌格式：數字列表或「過去：」「現在：」「建議：」格式
      // 支持多種格式：過去：、**過去**：、過去**：、**過去：等
      const threeCardListPattern = /(?:^|\n)\s*(?:[0-9一二三四五六七八九十]+[\.、．]?\s*)?\*{0,2}(過去|現在|建議)\*{0,2}\s*[：:－-]\s*[【\[]?[^：:\n【】\[\]]+[】\]]?/;
      const hasThreeCardList = threeCardListPattern.test(block);
      // 或者檢查是否有三個關鍵字都出現（過去、現在、建議），不管格式如何
      const hasAllKeywords = /過去/.test(block) && /現在/.test(block) && /建議/.test(block);
      hasThreeCardFormat = hasThreeCardList || hasAllKeywords;
    }
  }
  const hasKnownCard = SORTED_CARDS.some(([name]) => content.includes(name));
  const hasDrawContext = hasDrawPhrase || (hasKnownCard && hasThreeCardFormat);
  
  if (!hasDrawContext) {
    return content;
  }

  // 預期張數：若看到過去/現在/建議則預期 3 張，否則 1 張
  const expectedCount = hasThreeCardFormat ? 3 : 1;

  // 白名單機制：只匹配明確的抽牌格式
  // 使用更通用的模式，支持多種格式變體
  const foundCards = new Map<string, string>(); // 使用 Map，以牌名為 key，避免重複
  let firstThreeCardIndex = -1;

  // 優先使用結構化 JSON（若存在）
  const structuredNames = extractStructuredCards(content);
  if (structuredNames.length > 0) {
    structuredNames.slice(0, expectedCount).forEach((name) => {
      const file = TAROT_CARD_MAP[name];
      if (file) {
        foundCards.set(name, file);
      }
    });
  }

  // 方法1: 抽牌區塊掃描（避免截斷）——在「抽到的牌是」之後取較長片段，掃描所有牌名
  if (foundCards.size < expectedCount) {
    const drawBlockPattern = /抽到的牌是[：:\s-【\[]?/;
    const drawBlockMatch = content.match(drawBlockPattern);
    if (drawBlockMatch && drawBlockMatch.index !== undefined) {
      const start = drawBlockMatch.index;
      const block = content.substring(start, Math.min(content.length, start + 400));
      for (const [chineseName, fileName] of SORTED_CARDS) {
        if (foundCards.size >= expectedCount) break;
        // 移除全局標誌 'g'，避免 lastIndex 問題
        const cardPattern = new RegExp(
          `[【\\[]?${chineseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[】\\]]?(?:[（(].*?[）)]|正位|逆位|正|逆)?`
        );
        if (cardPattern.test(block)) {
          if (!foundCards.has(chineseName)) {
            foundCards.set(chineseName, fileName);
            // 單張牌時，找到第一張就停止
            if (expectedCount === 1) break;
          }
        }
      }
    }
  }

  // 方法2: 三張牌格式，直接匹配「過去/現在/建議：牌名（正位/逆位）」
  // 單張牌時，如果方法1已經找到一張，跳過此方法（避免重複）
  if (foundCards.size < expectedCount && !(expectedCount === 1 && foundCards.size >= 1)) {
    // 更簡單的正則：匹配「關鍵字：任意內容直到換行或下一個關鍵字」
    const threeCardRegex = /(過去|現在|建議)\s*[：:－-]\s*([^\n：]+?)(?=\n|$|過去|現在|建議)/g;
    let match;
    while ((match = threeCardRegex.exec(content)) !== null) {
      const keywordIndex = match.index;
      if (firstThreeCardIndex === -1 || keywordIndex < firstThreeCardIndex) {
        firstThreeCardIndex = keywordIndex;
      }
      const rawName = match[2]?.trim();
      if (rawName) {
        const cardName = extractCardName(rawName);
        if (cardName && !foundCards.has(cardName)) {
          foundCards.set(cardName, TAROT_CARD_MAP[cardName]);
          if (foundCards.size >= expectedCount) break;
        }
      }
    }
  }

  // 方法3: 兜底全局掃描（防止任何格式遺漏）
  // 但對於單張牌，只從「你抽到的牌是」之後掃描，避免抓到前面的牌名
  // 單張牌時，如果已經找到一張，跳過此方法（避免重複）
  if (foundCards.size < expectedCount && !(expectedCount === 1 && foundCards.size >= 1)) {
    const drawBlockPattern = /抽到的牌是[：:\s-【\[]?/;
    const drawBlockMatch = content.match(drawBlockPattern);
    const searchContent = drawBlockMatch && drawBlockMatch.index !== undefined && expectedCount === 1
      ? content.substring(drawBlockMatch.index) // 單張牌時，只從「抽到的牌是」之後掃描
      : content; // 三張牌時，可以全局掃描
    for (const [chineseName, fileName] of SORTED_CARDS) {
      if (foundCards.size >= expectedCount) break;
      // 移除全局標誌 'g'，避免 lastIndex 問題
      const cardPattern = new RegExp(
        `[【\\[]?${chineseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[】\\]]?(?:[（(].*?[）)]|正位|逆位|正|逆)?`
      );
      if (cardPattern.test(searchContent)) {
        if (!foundCards.has(chineseName)) {
          foundCards.set(chineseName, fileName);
          // 單張牌時，找到第一張就停止
          if (expectedCount === 1) break;
        }
      }
    }
  }

  // 依照原文出現順序整理牌，並最多保留預期張數，避免多抓或亂序
  // 對於單張牌，只從「你抽到的牌是」之後開始排序
  const drawBlockPattern = /抽到的牌是[：:\s-【\[]?/;
  const drawBlockMatch = content.match(drawBlockPattern);
  const sortContent = drawBlockMatch && drawBlockMatch.index !== undefined && expectedCount === 1
    ? content.substring(drawBlockMatch.index) // 單張牌時，只從「抽到的牌是」之後排序
    : content; // 三張牌時，可以全局排序
  
  const cardNamePattern = new RegExp(
    SORTED_CARDS.map(([name]) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  );
  const orderedNames: string[] = [];
  let orderMatch: RegExpExecArray | null;
  while ((orderMatch = cardNamePattern.exec(sortContent)) !== null) {
    const name = orderMatch[0];
    if (foundCards.has(name) && !orderedNames.includes(name)) {
      orderedNames.push(name);
      // 單張牌時，找到第一張就停止
      if (expectedCount === 1) break;
    }
  }
  const limitedNames = orderedNames.slice(0, expectedCount);
  if (limitedNames.length > 0) {
    const orderedMap = new Map<string, string>();
    limitedNames.forEach((name) => {
      const file = TAROT_CARD_MAP[name];
      if (file) orderedMap.set(name, file);
    });
    // 若仍有缺漏，補上原先找到的（但仍限制最多預期張數）
    for (const [name, file] of foundCards.entries()) {
      if (!orderedMap.has(name) && orderedMap.size < expectedCount) {
        orderedMap.set(name, file);
      }
    }
    foundCards.clear();
    orderedMap.forEach((file, name) => foundCards.set(name, file));
  } else if (foundCards.size > expectedCount) {
    // 如果排序後沒有結果，但 foundCards 有多張牌，只保留前 expectedCount 張
    const limitedEntries = Array.from(foundCards.entries()).slice(0, expectedCount);
    foundCards.clear();
    limitedEntries.forEach(([name, file]) => foundCards.set(name, file));
  }

  // 如果沒有找到任何牌，直接返回
  if (foundCards.size === 0) {
    return content;
  }

  // 統一在「你抽到的牌是」或「過去」「現在」「建議」之前插入所有圖片
  let parsedContent = content;
  const imageMarkdowns = generateImageMarkdown(foundCards);
  
  // 優先查找「你抽到的牌是」格式（支持多種分隔符）
  const drawPhrasePattern = /(?:你)?抽到的牌是[：:\s-【\[]/;
  const drawPhraseMatch = parsedContent.match(drawPhrasePattern);
  
  if (drawPhraseMatch && drawPhraseMatch.index !== undefined) {
    // 找到抽牌短語，在短語之前統一插入所有圖片
    const phraseStartIndex = drawPhraseMatch.index;
    parsedContent = 
      parsedContent.substring(0, phraseStartIndex) + 
      `\n\n${imageMarkdowns}\n\n` + 
      parsedContent.substring(phraseStartIndex);
  } else if (firstThreeCardIndex !== -1) {
    // 如果沒有找到「你抽到的牌是」，使用記錄的第一個「過去」「現在」「建議」位置
    const phraseStartIndex = firstThreeCardIndex;
    parsedContent = 
      parsedContent.substring(0, phraseStartIndex) + 
      `\n\n${imageMarkdowns}\n\n` + 
      parsedContent.substring(phraseStartIndex);
  } else {
    // 如果都沒有，在開頭插入
    parsedContent = `${imageMarkdowns}\n\n${parsedContent}`;
  }

  return parsedContent;
};

export default function SearchAgent({ onConversationChange, onProductRecommendation }: SearchAgentProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; products?: Product[] }[]>([]);
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
      
      // 獲取推薦商品
      const recommendedProducts = data.recommendedProducts || undefined;
      
      // 調試：檢查商品數據
      if (recommendedProducts && recommendedProducts.length > 0) {
        console.log('[SearchAgent] Products data:', recommendedProducts.map((p: Product) => ({
          name: p.name,
          hasImage: !!p.image_url,
          imageUrl: p.image_url,
          pinkoiUrl: p.pinkoi_url,
          shopeeUrl: p.shopee_url
        })));
      }
      
      // 如果有推薦商品，將商品信息附加到訊息中
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: cleanedResponse,
          products: recommendedProducts && recommendedProducts.length > 0 ? recommendedProducts : undefined
        },
      ]);
      
      // 通知是否需要顯示商品推薦
      if (onProductRecommendation) {
        const hasProducts = recommendedProducts && recommendedProducts.length > 0;
        console.log('[SearchAgent] Product recommendation:', { hasProducts, productCount: recommendedProducts?.length });
        onProductRecommendation(hasProducts, recommendedProducts);
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
      const errorMessage = getErrorMessage(error) || '發生了未知錯誤';
      
      // 如果是限時/冷卻錯誤，只顯示等待訊息，不添加其他說明
      let displayMessage: string;
      if (errorMessage.includes('對話時間有限時') || errorMessage.includes('等候')) {
        // 限時錯誤是正常的業務邏輯，顯示等待訊息和會員註冊建議（如果有的話）
        // 保留完整的錯誤訊息，包括會員註冊建議
        displayMessage = errorMessage.trim();
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
                className={`flex items-start gap-3 animate-fade-in ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10">
                    <Image
                      src="/avatars/assistant.png"
                      alt="藝棧精靈"
                      width={40}
                      height={40}
                      className="rounded-full shadow-sm object-cover"
                      priority={false}
                    />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-sm md:text-base text-[var(--foreground)]">
                      {/* 文字內容 */}
                      <ReactMarkdown
                        components={{
                          p: ({ children, ...props }) => {
                            // 檢查是否包含圖片，如果包含則使用 div 而不是 p（避免 HTML 結構錯誤）
                            const hasImage = React.Children.toArray(children).some(
                              (child: any) => child?.props?.src || child?.type === 'img'
                            );
                            if (hasImage) {
                              return <div className="mb-2 last:mb-0 leading-relaxed">{children}</div>;
                            }
                            return <p className="mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>;
                          },
                          // 修復 Markdown 格式問題：處理 **過去：這種情況和列表編號換行問題
                          text: ({ children }) => {
                            if (typeof children === 'string') {
                              // 修復 **過去：這種格式問題（冒號前不應該有粗體）
                              let fixed = children.replace(/\*\*([^：:]+)([：:])\*\*/g, '$1$2');
                              // 修復列表編號後的換行問題：將 "數字.\n" 改為 "數字."
                              fixed = fixed.replace(/(\d+)\.\s*\n\s*/g, '$1. ');
                              return fixed;
                            }
                            return children;
                          },
                          strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                          li: ({ children }) => {
                            // 處理列表項內容，確保編號和內容在同一行
                            // 如果內容是字符串且包含換行，移除開頭的換行和空白
                            const processedChildren = React.Children.map(children, (child: any) => {
                              if (typeof child === 'string') {
                                // 移除開頭的換行符和空白字符
                                return child.replace(/^\s*\n\s*/, '');
                              }
                              return child;
                            });
                            return <li className="ml-1">{processedChildren}</li>;
                          },
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-[var(--foreground)]">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-[var(--foreground)]">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-[var(--foreground)]">{children}</h3>,
                          code: ({ children }) => <code className="bg-[var(--border)] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--border)] pl-3 italic my-2 text-[var(--muted)]">{children}</blockquote>,
                          hr: () => <hr className="border-[var(--border)] my-3" />,
                          a: ({ href, children, ...props }) => {
                            // 確保連結可以點擊並在新分頁開啟
                            if (!href) return <span>{children}</span>;
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--primary)] hover:underline font-medium"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          },
                          img: ({ src, alt }) => {
                            if (!src || typeof src !== 'string') return null;
                            // 只處理塔羅牌圖片，商品圖片不再通過 Markdown 顯示（改用 ProductCard 組件）
                            const isTarotCard = src.startsWith('/tarot/');
                            if (!isTarotCard) return null; // 過濾掉商品圖片
                            return (
                              <div className="my-3 flex justify-center">
                                <Image
                                  src={src}
                                  alt={alt || '塔羅牌'}
                                  width={100}
                                  height={175}
                                  style={{ width: 'auto', height: 'auto', maxWidth: '150px' }}
                                  className="max-w-[150px] h-auto rounded-lg shadow-md object-contain"
                                  unoptimized
                                />
                              </div>
                            );
                          },
                        }}
                      >
                        {parseTarotCards(msg.content)}
                      </ReactMarkdown>
                      
                      {/* 商品卡片區域 - 在文字內容下方顯示 */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <div className="flex flex-col gap-3 md:gap-4">
                            {msg.products.map((product) => (
                              <div key={product.id} className="w-full md:max-w-md md:mx-auto">
                                <ProductCard product={product} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
            <Wand2 className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

