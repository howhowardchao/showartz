'use client';

import { useState } from 'react';
import SearchAgent from '@/components/SearchAgent';
import VideoGrid from '@/components/VideoGrid';
import ProductGrid from '@/components/ProductGrid';

export default function Home() {
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  return (
    <div className="min-h-screen">
      {/* 搜尋工具 - 固定在頂部 */}
      <div className="container mx-auto px-4 py-6 sticky top-[73px] z-40 bg-gradient-to-b from-magic-dark via-magic-blue/20 to-transparent pb-2">
        <SearchAgent 
          onConversationChange={setIsConversationActive}
          onProductRecommendation={setShowProducts}
        />
      </div>
      
      {/* 內容區域 */}
      <div className="container mx-auto px-4 pt-[6px] pb-8 md:pb-12">
        {showProducts ? (
          <ProductGrid />
        ) : (
          <VideoGrid />
        )}
      </div>
    </div>
  );
}
