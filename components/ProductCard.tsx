'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { shouldDisableImageOptimization } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    const url = product.pinkoi_url || product.shopee_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPrice = (price: number | string) => {
    const numeric =
      typeof price === 'number'
        ? price
        : parseFloat(String(price).replace(/[^\d.-]/g, '')) || 0;
    return `NT$${numeric.toLocaleString('zh-TW')}`;
  };

  // 檢查是否為占位圖片
  const isPlaceholderImage = (url: string | undefined) => {
    if (!url) return true;
    return url.includes('space.gif');
  };

  // 取得有效的圖片 URL（過濾占位圖片）
  const getValidImageUrl = () => {
    if (isPlaceholderImage(product.image_url)) {
      return null;
    }
    return product.image_url;
  };

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-white shadow-sm hover:shadow-lg relative transition-shadow duration-300">
        {/* 商品圖片 */}
        <div className="aspect-square bg-[var(--border)]/40 relative">
          {getValidImageUrl() && !imageError ? (
            <Image
              src={getValidImageUrl()!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized={shouldDisableImageOptimization(getValidImageUrl()!)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--border)]/50">
              <div className="text-[var(--muted)] opacity-80 text-center p-4">
                <p className="text-sm font-semibold">無圖片</p>
              </div>
            </div>
          )}

          {/* 平台標記 */}
          {(product.pinkoi_url || product.shopee_url) && (
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <div className="bg-white/90 border border-[var(--border)] backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                <span className="text-xs text-[var(--foreground)] font-semibold">
                  {product.pinkoi_url ? 'Pinkoi' : '蝦皮'}
                </span>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent z-30 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
                <div className="bg-[var(--primary)] text-white rounded-full p-3 shadow-md">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <p className="text-xs text-white text-center opacity-90 font-semibold">
                  前往購買
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm text-[var(--foreground)] font-semibold line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg text-[var(--foreground)] font-semibold">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-[var(--muted)] line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--muted)]">⭐</span>
                <span className="text-xs text-[var(--muted)]">
                  {typeof product.rating === 'number' 
                    ? product.rating.toFixed(1) 
                    : parseFloat(String(product.rating || 0)).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {product.sales_count > 0 && (
            <p className="text-xs text-[var(--muted)] mt-1">
              已售 {product.sales_count.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

