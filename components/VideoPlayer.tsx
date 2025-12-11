'use client';

import { Video } from '@/lib/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  video: Video | null;
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  useEffect(() => {
    if (video) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [video]);

  if (!video) return null;

  // Extract Instagram video ID and create embed URL
  const getEmbedUrl = (url: string) => {
    // Extract video ID from Instagram URL
    const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      const videoId = match[1];
      // Instagram embed URL (autoplay is not supported by Instagram)
      return `https://www.instagram.com/reel/${videoId}/embed/`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(video.ig_url);
  const cleanUrl = video.ig_url.split('?')[0]; // Remove query parameters for cleaner display

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-magic-dark/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-magic-gold hover:text-magic-gold-light transition-colors z-10 bg-magic-dark/80 rounded-full p-2 backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 magic-glow p-4 backdrop-blur-sm">
          {/* Instagram Embed */}
          {video.ig_url.includes('instagram.com') && embedUrl ? (
            <>
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4 relative min-h-[400px]">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ minHeight: '400px' }}
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency={true}
                  allow="encrypted-media; autoplay; fullscreen"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                  title={video.title || 'Instagram Video'}
                  loading="lazy"
                />
              </div>
              <div className="text-center space-y-3">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-magic-gold text-magic-dark px-6 py-3 rounded-lg font-magic hover:bg-magic-gold-light transition-colors magic-glow"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  在 Instagram 開啟完整影片
                </a>
                <p className="text-xs text-magic-gold-light/60">
                  如果上方無法顯示，請點擊上方按鈕在 Instagram 觀看
                </p>
              </div>
            </>
          ) : video.ig_url.includes('instagram.com') ? (
            <div className="aspect-[9/16] bg-gradient-to-br from-magic-purple/30 to-magic-blue/30 rounded-lg overflow-hidden flex flex-col items-center justify-center p-8">
              <p className="text-magic-gold-light mb-6 text-center font-magic text-xl">
                Instagram 影片
              </p>
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-magic-gold text-magic-dark px-8 py-4 rounded-lg font-magic hover:bg-magic-gold-light transition-colors magic-glow inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                在 Instagram 開啟
              </a>
            </div>
          ) : (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <ReactPlayer
                url={video.ig_url}
                width="100%"
                height="100%"
                controls
                playing
              />
            </div>
          )}
          
          {/* 標題 */}
          {video.title && (
            <h3 className="mt-4 text-lg text-magic-gold font-magic text-center px-4">
              {video.title}
            </h3>
          )}
        </div>
      </div>
    </div>
  );
}

