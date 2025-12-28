'use client';

import NextImage from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Video, VideoCategory } from '@/lib/types';
import { Trash2, Plus, Save, X, Upload, Image as ImageIcon } from 'lucide-react';

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    ig_url: '',
    title: '',
    thumbnail_url: '',
    category: 'hot' as VideoCategory,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Video>>({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos', {
        credentials: 'include', // 確保發送 cookies
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchVideos();
        setNewVideo({ ig_url: '', title: '', thumbnail_url: '', category: 'hot' });
        setShowAddForm(false);
      } else {
        alert('新增失敗');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('發生錯誤');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchVideos();
        setEditingId(null);
        setEditData({});
        alert('更新成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`更新失敗: ${errorData.error || '請檢查網路連線'}`);
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('發生錯誤');
    }
  };

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleThumbnailUpload = async (file: File, isEdit: boolean = false, videoId?: string) => {
    try {
      if (isEdit && videoId) {
        setUploadingEditThumbnail(videoId);
      } else {
        setUploadingThumbnail(true);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isEdit && videoId) {
          setEditData({ ...editData, thumbnail_url: data.url });
        } else {
          setNewVideo({ ...newVideo, thumbnail_url: data.url });
        }
      } else {
        const error = await response.json();
        alert(error.error || '上傳失敗');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('上傳時發生錯誤');
    } finally {
      if (isEdit && videoId) {
        setUploadingEditThumbnail(null);
      } else {
        setUploadingThumbnail(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false, videoId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailUpload(file, isEdit, videoId);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個影片嗎？')) return;

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchVideos();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('發生錯誤');
    }
  };

  if (loading) {
    return <div className="text-magic-gold">載入中...</div>;
  }

  const categoryLabels: Record<VideoCategory, string> = {
    hot: '最熱門',
    image: '形象',
    product: '商品',
    fun: '趣味',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-magic text-magic-gold">媒體管理</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增影片
        </button>
      </div>

      {showAddForm && (
        <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-6 space-y-4">
          <h3 className="text-xl font-magic text-magic-gold">新增影片</h3>
          <input
            type="text"
            placeholder="IG 影片連結"
            value={newVideo.ig_url}
            onChange={(e) => setNewVideo({ ...newVideo, ig_url: e.target.value })}
            className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          />
          <input
            type="text"
            placeholder="標題（選填）"
            value={newVideo.title}
            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
            className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          />
          {/* 縮圖上傳 */}
          <div className="space-y-2">
            <label className="block text-magic-gold-light font-magic">
              縮圖（選填）
            </label>
            <p className="text-magic-gold-light/70 text-sm">
              建議尺寸：640x1136 像素，比例約為 9:16（直式）
            </p>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e, false)}
              className="hidden"
              disabled={uploadingThumbnail}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingThumbnail}
                className="flex items-center gap-2 bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingThumbnail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-magic-gold-light border-t-transparent rounded-full animate-spin"></div>
                    上傳中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    選擇縮圖
                  </>
                )}
              </button>
              {newVideo.thumbnail_url && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-magic-gold" />
                  <span className="text-sm text-magic-gold-light">
                    {newVideo.thumbnail_url.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewVideo({ ...newVideo, thumbnail_url: '' })}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>
            {newVideo.thumbnail_url && (
              <div className="relative w-32 h-56 rounded overflow-hidden border border-magic-purple/30 bg-magic-dark">
                <NextImage
                  src={newVideo.thumbnail_url}
                  alt="縮圖預覽"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <select
            value={newVideo.category}
            onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value as VideoCategory })}
            className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          >
            <option value="hot">最熱門</option>
            <option value="image">形象</option>
            <option value="product">商品</option>
            <option value="fun">趣味</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              儲存
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewVideo({ ig_url: '', title: '', thumbnail_url: '', category: 'hot' });
              }}
              className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-magic-purple/20 rounded-lg border border-magic-purple/30 p-4 space-y-3"
          >
            {editingId === video.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.ig_url ?? video.ig_url}
                  onChange={(e) => setEditData({ ...editData, ig_url: e.target.value })}
                  className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
                />
                <input
                  type="text"
                  value={editData.title ?? video.title ?? ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
                />
                {/* 縮圖上傳（編輯模式） */}
                <div className="space-y-2">
                  <label className="block text-magic-gold-light font-magic">
                    縮圖（選填）
                  </label>
                  <input
                    ref={(el) => {
                      if (el) {
                        editThumbnailInputRefs.current[video.id] = el;
                      }
                    }}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileSelect(e, true, video.id)}
                    className="hidden"
                    disabled={uploadingEditThumbnail === video.id}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editThumbnailInputRefs.current[video.id]?.click()}
                        disabled={uploadingEditThumbnail === video.id}
                        className="flex items-center gap-2 bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingEditThumbnail === video.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-magic-gold-light border-t-transparent rounded-full animate-spin"></div>
                            上傳中...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {editData.thumbnail_url !== undefined || video.thumbnail_url ? '更換縮圖' : '選擇縮圖'}
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-magic-gold-light/70 text-xs">
                      建議尺寸：640x1136 像素，比例約為 9:16（直式）
                    </p>
                    {(editData.thumbnail_url !== undefined ? editData.thumbnail_url : video.thumbnail_url) && (
                      <button
                        type="button"
                        onClick={() => setEditData({ ...editData, thumbnail_url: '' })}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  {(editData.thumbnail_url !== undefined ? editData.thumbnail_url : video.thumbnail_url) && (
                    <div className="relative w-32 h-56 rounded overflow-hidden border border-magic-purple/30 bg-magic-dark">
                      <NextImage
                        src={editData.thumbnail_url || video.thumbnail_url || '/placeholder.jpg'}
                        alt="縮圖預覽"
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <select
                  value={editData.category ?? video.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value as VideoCategory })}
                  className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
                >
                  <option value="hot">最熱門</option>
                  <option value="image">形象</option>
                  <option value="product">商品</option>
                  <option value="fun">趣味</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(video.id)}
                    className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    儲存
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditData({});
                    }}
                    className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-magic-gold-light font-magic">
                      {categoryLabels[video.category]}
                    </p>
                    {video.title && (
                      <p className="text-magic-gold-light mt-1">{video.title}</p>
                    )}
                    {video.thumbnail_url && (
                      <div className="relative mt-2 w-24 h-40 rounded overflow-hidden border border-magic-purple/30">
                        <NextImage
                          src={video.thumbnail_url}
                          alt="縮圖"
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-magic-gold-light/60 text-sm mt-1 break-all">
                      {video.ig_url}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(video.id);
                        setEditData({});
                      }}
                      className="text-magic-gold hover:text-magic-gold-light transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

