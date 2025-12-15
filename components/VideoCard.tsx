'use client';

import Image from 'next/image';
import { Video } from '@/lib/types';
import { Play } from 'lucide-react';
import { useState } from 'react';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="aspect-[9/16] bg-gradient-to-br from-magic-purple/30 to-magic-blue/30 rounded-lg overflow-hidden border border-magic-purple/30 magic-glow hover:border-magic-gold/50 relative">
        {/* 如果有縮圖，顯示縮圖 */}
        {video.thumbnail_url && !imageError ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title || 'Video thumbnail'}
            fill
            sizes="(max-width: 768px) 60vw, 25vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            {/* 背景裝飾 */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-b from-transparent via-magic-gold/10 to-magic-purple/20"></div>
            </div>

            {/* 播放按鈕 - 只在未懸停時顯示 */}
            {!isHovered && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-magic-gold/20 backdrop-blur-sm rounded-full p-6 magic-glow">
                  <Play className="w-16 h-16 text-magic-gold fill-current" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Instagram 標記 */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="bg-magic-dark/80 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-xs text-magic-gold-light font-magic">IG</span>
          </div>
        </div>
        
        {/* 標題（如果有）- 只在未懸停時顯示 */}
        {video.title && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-magic-dark/90 via-magic-dark/50 to-transparent z-10 pointer-events-none">
            <p className="text-xs text-magic-gold-light text-center font-magic line-clamp-2">
              {video.title}
            </p>
          </div>
        )}
        
        {/* Hover overlay - 懸停時顯示 */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-magic-dark/95 via-magic-dark/70 to-magic-dark/50 z-30 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="mb-4">
                <div className="bg-magic-gold rounded-full p-5 magic-glow transform scale-125 transition-transform duration-300">
                  <Play className="w-10 h-10 text-magic-dark fill-current" />
                </div>
              </div>
              {video.title && (
                <p className="text-base text-magic-gold text-center font-magic mb-2 px-4 line-clamp-2">
                  {video.title}
                </p>
              )}
              <p className="text-xs text-magic-gold-light text-center opacity-90 font-magic">
                點擊播放
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

