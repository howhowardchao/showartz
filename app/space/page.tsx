'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Image as ImageType } from '@/lib/types';
import ImageModal from '@/components/ImageModal';

export default function SpacePage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
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

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-[var(--border)] py-10 md:py-14">
        {/* 背景插圖全幅覆蓋 */}
        <div className="pointer-events-none absolute inset-0 opacity-70 md:opacity-70">
          <Image
            src="/images/hero-illustration.png"
            alt="藝棧 Showartz 插圖"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)] shadow-sm">
              故事
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-[var(--foreground)] leading-tight">
              故事
            </h1>
            <p className="mt-3 text-base md:text-lg text-[var(--muted)] leading-relaxed max-w-2xl">
              探索藝棧的故事與靈感，感受每一處的奇幻氛圍。
            </p>
          </div>
        </div>
      </section>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--foreground)] text-lg font-semibold">
            目前沒有故事圖文
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {images.map((image) => {
            // 截取描述的前120字
            const truncateDescription = (text: string | undefined, maxLength: number = 120) => {
              if (!text) return '';
              if (text.length <= maxLength) return text;
              return text.slice(0, maxLength) + '...';
            };

            const previewText = truncateDescription(image.description, 120);

            return (
              <div
                key={image.id}
                className="bg-white rounded-lg overflow-hidden border border-[var(--border)] cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
                onClick={() => setSelectedImage(image)}
              >
                {/* 圖片區域 */}
                <div className="aspect-square bg-[var(--border)]/50 relative overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={image.description || '故事照片'}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                    priority={false}
                  />
                </div>
                
                {/* 文字預覽區域 */}
                {previewText && (
                  <div className="p-3 md:p-4 flex-1 flex flex-col justify-start">
                    <p className="text-[var(--muted)] text-xs md:text-sm leading-relaxed line-clamp-4">
                      {previewText}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

