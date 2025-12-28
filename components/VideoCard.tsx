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
      className="relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="aspect-[9/16] bg-white rounded-xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-lg relative">
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
            <div className="absolute inset-0 opacity-40">
              <div className="w-full h-full bg-gradient-to-b from-white via-[var(--border)] to-[var(--primary)]/20"></div>
            </div>

            {/* 播放按鈕 - 只在未懸停時顯示 */}
            {!isHovered && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-md border border-[var(--border)]">
                  <Play className="w-16 h-16 text-[var(--primary)] fill-current" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Instagram 標記 */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="bg-white/90 border border-[var(--border)] backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
            <span className="text-xs text-[var(--foreground)] font-semibold">IG</span>
          </div>
        </div>
        
        {/* 標題（如果有）- 只在未懸停時顯示 */}
        {video.title && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none">
            <p className="text-xs text-white text-center font-semibold line-clamp-2">
              {video.title}
            </p>
          </div>
        )}
        
        {/* Hover overlay - 懸停時顯示 */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-30 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="mb-4">
                <div className="bg-white rounded-full p-5 shadow-lg transform scale-110 transition-transform duration-300">
                  <Play className="w-10 h-10 text-[var(--primary)] fill-current" />
                </div>
              </div>
              {video.title && (
                <p className="text-base text-white text-center font-semibold mb-2 px-4 line-clamp-2">
                  {video.title}
                </p>
              )}
              <p className="text-xs text-white text-center opacity-90 font-semibold">
                點擊播放
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

