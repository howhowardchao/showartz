'use client';

import { Product } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  recommendedProducts?: Product[];
}

export default function ProductGrid({ recommendedProducts }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const prevProductsRef = useRef<string>('');

  useEffect(() => {
    // 如果有推薦的商品，直接使用；否則從 API 獲取所有商品
    if (recommendedProducts && recommendedProducts.length > 0) {
      // 使用商品ID序列化來比較是否有變化
      const productsKey = recommendedProducts.map(p => p.id).join(',');
      const hasChanged = prevProductsRef.current !== productsKey;
      
      if (hasChanged) {
        prevProductsRef.current = productsKey;
        console.log('[ProductGrid] Products changed, updating:', recommendedProducts.length, 'IDs:', productsKey);
      } else {
        console.log('[ProductGrid] Products unchanged, but forcing update:', recommendedProducts.length, 'IDs:', productsKey);
      }
      
      // 強制更新：創建新數組引用，確保 React 檢測到變化
      setProducts([...recommendedProducts]);
      setLoading(false);
    } else {
      // 當沒有推薦商品時，清空之前的商品ID記錄
      if (prevProductsRef.current !== '') {
        prevProductsRef.current = '';
        console.log('[ProductGrid] Clearing recommended products');
      }
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
        <div className="text-[var(--primary)] font-semibold text-xl">
          載入中...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--foreground)] text-lg font-semibold">
          目前沒有商品
        </p>
        <p className="text-[var(--muted)] text-sm mt-2">
          請在後台同步蝦皮商品
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}



