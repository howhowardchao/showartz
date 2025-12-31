'use client';

import Image from 'next/image';
import { Image as ImageType } from '@/lib/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { isLocalUploadImage } from '@/lib/utils';

interface ImageModalProps {
  image: ImageType;
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-magic-dark/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] bg-magic-purple/20 rounded-lg border border-magic-gold/30 magic-glow flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 - 右上角 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-magic-dark/80 hover:bg-magic-dark rounded-full p-2 text-magic-gold hover:text-magic-gold-light transition-colors shadow-lg"
          aria-label="關閉"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 可滾動的內容區域 - 包含圖片和文字 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* 圖片區域 */}
          <div className="relative w-full max-w-[1024px] mx-auto" style={{ aspectRatio: '1/1' }}>
            <Image
              src={image.image_url}
              alt={image.description || '空間照片'}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1024px"
              className="object-contain rounded-lg"
              priority
              unoptimized={isLocalUploadImage(image.image_url)}
            />
          </div>

          {/* 描述文字區域 */}
          {image.description && (
            <div className="mt-4 md:mt-6">
              <p className="text-center text-magic-gold-light font-magic text-sm md:text-base leading-relaxed px-4">
                {image.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

