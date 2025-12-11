'use client';

import { useState, useEffect } from 'react';
import { Image } from '@/lib/types';
import ImageModal from '@/components/ImageModal';

export default function SpacePage() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
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
        <div className="text-magic-gold font-magic text-xl magic-sparkle">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="text-center mb-12 pt-12 md:pt-16">
        <h1 className="text-4xl md:text-5xl font-magic text-magic-gold mb-4">
          故事
        </h1>
        <p className="text-magic-gold-light text-lg md:text-xl max-w-2xl mx-auto">
          探索藝棧的魔法故事，感受每一處的奇幻氛圍
        </p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-magic-gold-light text-lg font-magic">
            目前沒有故事圖文
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="aspect-square bg-magic-purple/20 rounded-lg overflow-hidden border border-magic-purple/30 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:border-magic-gold/50 magic-glow"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.image_url}
                alt={image.description || '故事照片'}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
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

