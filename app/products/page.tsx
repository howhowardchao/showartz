'use client';

// 避免被快取，確保最新價格與顯示
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'sales-desc';

const ITEMS_PER_PAGE = 20; // 每頁顯示 20 個商品

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const shopeeUrl = 'https://shopee.tw/shop/62981645';
  const pinkoiUrl = 'https://www.pinkoi.com/store/showartz';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let sorted = [...products];

    // 分類過濾
    if (selectedCategory !== 'all') {
      sorted = sorted.filter(p => p.category === selectedCategory);
    }

    // 排序
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-TW'));
        break;
      case 'sales-desc':
        sorted.sort((a, b) => b.sales_count - a.sales_count);
        break;
      default:
        // 預設：按銷售量降序
        sorted.sort((a, b) => b.sales_count - a.sales_count);
    }

    setFilteredProducts(sorted);
    setCurrentPage(1); // 重置到第一頁
  }, [products, sortOption, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
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

  // 獲取所有分類
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // 分頁計算
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // 生成頁碼數組
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 最多顯示 5 個頁碼

    if (totalPages <= maxVisible) {
      // 如果總頁數少於等於最大顯示數，顯示所有頁碼
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 否則顯示部分頁碼
      if (currentPage <= 3) {
        // 當前頁在前幾頁
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 當前頁在後幾頁
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 當前頁在中間
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-magic-gold font-magic text-xl magic-sparkle">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="text-center mb-8 pt-12 md:pt-16">
        <h1 className="text-4xl md:text-5xl font-magic text-magic-gold mb-4">
          商品
        </h1>
        <p className="text-magic-gold-light text-lg md:text-xl max-w-2xl mx-auto mb-8">
          探索我們的奇趣商品，特別是貓頭鷹造型系列包
        </p>
      </div>

      {/* 賣場連結 */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-6 backdrop-blur-sm magic-glow hover:border-magic-gold transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-magic text-magic-gold mb-2">蝦皮賣場</h3>
                <p className="text-magic-gold-light text-sm">前往我們的蝦皮商店選購</p>
              </div>
              <ExternalLink className="w-6 h-6 text-magic-gold" />
            </div>
          </a>
          <a
            href={pinkoiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-6 backdrop-blur-sm magic-glow hover:border-magic-gold transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-magic text-magic-gold mb-2">Pinkoi 賣場</h3>
                <p className="text-magic-gold-light text-sm">前往我們的 Pinkoi 商店選購</p>
              </div>
              <ExternalLink className="w-6 h-6 text-magic-gold" />
            </div>
          </a>
        </div>
      </div>

      {/* 排序和分類篩選 */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-magic-gold-light font-magic flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              排序：
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light focus:outline-none focus:border-magic-gold"
            >
              <option value="default">預設（銷售量）</option>
              <option value="price-asc">價格：低到高</option>
              <option value="price-desc">價格：高到低</option>
              <option value="name-asc">名稱：A-Z</option>
              <option value="name-desc">名稱：Z-A</option>
              <option value="sales-desc">銷售量：高到低</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-magic-gold-light font-magic">分類：</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light focus:outline-none focus:border-magic-gold"
              >
                <option value="all">全部</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-magic-gold-light text-sm">
            共 {filteredProducts.length} 個商品
            {filteredProducts.length > ITEMS_PER_PAGE && (
              <span className="ml-2">
                （第 {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} 個）
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="max-w-6xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-magic-gold-light text-lg font-magic">
              目前沒有商品
            </p>
            <p className="text-magic-gold-light/70 text-sm mt-2">
              請在後台同步商品
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-magic-purple/20 border border-magic-gold/30 rounded-lg text-magic-gold-light hover:bg-magic-purple/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一頁
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...' || page === currentPage}
                      className={`px-3 py-2 min-w-[40px] border rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-magic-gold text-magic-dark border-magic-gold font-magic'
                          : page === '...'
                          ? 'bg-transparent border-transparent text-magic-gold-light cursor-default'
                          : 'bg-magic-purple/20 border-magic-gold/30 text-magic-gold-light hover:bg-magic-purple/40'
                      } disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-magic-purple/20 border border-magic-gold/30 rounded-lg text-magic-gold-light hover:bg-magic-purple/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  下一頁
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
