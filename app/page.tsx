'use client';

import { useState } from 'react';
import SearchAgent from '@/components/SearchAgent';
import VideoGrid from '@/components/VideoGrid';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/lib/types';

export default function Home() {
  const [showProducts, setShowProducts] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[] | undefined>(undefined);

  const handleProductRecommendation = (hasProducts: boolean, products?: Product[]) => {
    setShowProducts(hasProducts);
    setRecommendedProducts(products);
    console.log('[Home] Product recommendation updated:', { hasProducts, productCount: products?.length });
  };

  return (
    <div className="min-h-screen">
      {/* 搜尋工具 - 固定在頂部 */}
      <div className="container mx-auto px-4 py-6 sticky top-[73px] z-40 bg-gradient-to-b from-magic-dark via-magic-blue/20 to-transparent pb-2">
        <SearchAgent 
          onProductRecommendation={handleProductRecommendation}
        />
      </div>
      
      {/* 內容區域 */}
      <div className="container mx-auto px-4 pt-[6px] pb-8 md:pb-12">
        {showProducts ? (
          <ProductGrid recommendedProducts={recommendedProducts} />
        ) : (
          <VideoGrid />
        )}
      </div>
    </div>
  );
}
