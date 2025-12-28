'use client';

import { Video, VideoCategory } from '@/lib/types';
import { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import VideoPlayer from './VideoPlayer';
import CategoryFilter from './CategoryFilter';

export default function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter((v) => v.category === selectedCategory));
    }
  }, [selectedCategory, videos]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
        setFilteredVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
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
    <>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="max-w-6xl mx-auto">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--foreground)] text-lg font-semibold">
              目前沒有影片
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>
        )}
      </div>

      <VideoPlayer
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
}

