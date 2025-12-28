'use client';

import { VideoCategory } from '@/lib/types';
import { Sparkles } from 'lucide-react';

const categories: { value: VideoCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '最熱門' },
  { value: 'image', label: '形象' },
  { value: 'product', label: '商品' },
  { value: 'fun', label: '趣味' },
];

interface CategoryFilterProps {
  selectedCategory: VideoCategory | 'all';
  onCategoryChange: (category: VideoCategory | 'all') => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.value;
        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all duration-300 border ${
              isSelected
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                : 'bg-white text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm'
            }`}
          >
            {isSelected && (
              <Sparkles className="inline-block w-4 h-4 mr-1 align-middle" />
            )}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

