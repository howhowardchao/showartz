'use client';

import { Product } from '@/lib/types';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="bg-gradient-to-br from-magic-purple/30 to-magic-blue/30 rounded-lg overflow-hidden border border-magic-purple/30 magic-glow hover:border-magic-gold/50 relative">
        {/* 商品圖片 */}
        <div className="aspect-square bg-magic-dark/50 relative">
          {product.image_url && !imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-magic-purple/20 to-magic-blue/20">
              <div className="text-magic-gold-light opacity-50 text-center p-4">
                <p className="text-sm font-magic">無圖片</p>
              </div>
            </div>
          )}

          {/* 平台標記 */}
          {(product.pinkoi_url || product.shopee_url) && (
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <div className="bg-magic-dark/80 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-xs text-magic-gold-light font-magic">
                  {product.pinkoi_url ? 'Pinkoi' : '蝦皮'}
                </span>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-magic-dark/95 via-magic-dark/70 to-magic-dark/50 z-30 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="mb-4">
                  <div className="bg-magic-gold rounded-full p-5 magic-glow transform scale-125 transition-transform duration-300">
                    <ExternalLink className="w-10 h-10 text-magic-dark" />
                  </div>
                </div>
                <p className="text-xs text-magic-gold-light text-center opacity-90 font-magic">
                  前往購買
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="p-4">
          <h3 className="text-sm text-magic-gold-light font-magic line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg text-magic-gold font-magic">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-magic-gold-light/60 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-magic-gold-light">⭐</span>
                <span className="text-xs text-magic-gold-light">
                  {typeof product.rating === 'number' 
                    ? product.rating.toFixed(1) 
                    : parseFloat(String(product.rating || 0)).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {product.sales_count > 0 && (
            <p className="text-xs text-magic-gold-light/70 mt-2">
              已售 {product.sales_count.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

