'use client';

import Image from 'next/image';
import { Image as ImageType } from '@/lib/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-magic-dark/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-magic-gold hover:text-magic-gold-light transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 magic-glow p-4">
          <div className="relative w-full max-w-5xl max-h-[80vh] min-h-[200px]">
            <Image
              src={image.image_url}
              alt={image.description || '空間照片'}
              fill
              sizes="(max-width: 768px) 90vw, 70vw"
              className="object-contain rounded-lg"
              priority
            />
          </div>
          {image.description && (
            <p className="mt-4 text-center text-magic-gold-light font-magic">
              {image.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

