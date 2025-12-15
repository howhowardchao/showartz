'use client';

import { Product } from '@/lib/types';
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  recommendedProducts?: Product[];
}

export default function ProductGrid({ recommendedProducts }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 如果有推薦的商品，直接使用；否則從 API 獲取所有商品
    if (recommendedProducts && recommendedProducts.length > 0) {
      setProducts(recommendedProducts);
      setLoading(false);
      console.log('[ProductGrid] Using recommended products:', recommendedProducts.length);
    } else {
      fetchProducts();
    }
  }, [recommendedProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-magic-gold font-magic text-xl magic-sparkle">
          載入中...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-magic-gold-light text-lg font-magic">
          目前沒有商品
        </p>
        <p className="text-magic-gold-light/70 text-sm mt-2">
          請在後台同步蝦皮商品
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}



