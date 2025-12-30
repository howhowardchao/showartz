'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Image as ImageType } from '@/lib/types';
import { Trash2, Plus, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { isLocalUploadImage } from '@/lib/utils';

export default function ImageManager() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImage, setNewImage] = useState({
    image_url: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images', {
        credentials: 'include',
      });
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

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/story-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNewImage((prev) => ({ ...prev, image_url: data.url }));
      } else {
        const errorData = await response.json();
        alert(errorData.error || '上傳失敗');
      }
    } catch (error) {
      console.error('Error uploading story image:', error);
      alert('上傳時發生錯誤');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleAdd = async () => {
    if (!newImage.image_url) {
      alert('請先上傳故事圖文');
      return;
    }

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newImage),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchImages();
        setNewImage({ image_url: '', description: '' });
        setShowAddForm(false);
      } else {
        alert('新增失敗');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('發生錯誤');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這張照片嗎？')) return;

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchImages();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('發生錯誤');
    }
  };

  if (loading) {
    return <div className="text-magic-gold">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-magic text-magic-gold">故事圖文管理</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增故事圖文
        </button>
      </div>

      {showAddForm && (
        <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-6 space-y-4">
          <h3 className="text-xl font-magic text-magic-gold">新增故事圖文</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <div className="space-y-2">
            <label className="block text-magic-gold-light font-magic">
              圖片上傳
            </label>
            <p className="text-magic-gold-light/70 text-sm">
              建議比例：1:1（正方形）或 4:5（直式）
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-magic-gold-light border-t-transparent rounded-full animate-spin"></div>
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  選擇圖片
                </>
              )}
            </button>
            {newImage.image_url && (
              <div className="flex items-center gap-2 text-magic-gold-light text-sm">
                <ImageIcon className="w-4 h-4 text-magic-gold" />
                <span>{newImage.image_url.split('/').pop()}</span>
                <button
                  type="button"
                  onClick={() => setNewImage({ ...newImage, image_url: '' })}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  清除
                </button>
              </div>
            )}
            {newImage.image_url && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-magic-purple/30 bg-magic-dark">
                <Image
                  src={newImage.image_url}
                  alt="故事圖文預覽"
                  fill
                  sizes="128px"
                  className="object-cover"
                  unoptimized={isLocalUploadImage(newImage.image_url)}
                />
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="描述（選填）"
            value={newImage.description}
            onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
            className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          />
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
                setNewImage({ image_url: '', description: '' });
              }}
              className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-magic-purple/20 rounded-lg border border-magic-purple/30 p-4 space-y-2"
          >
            <div className="relative aspect-square bg-magic-dark rounded-lg overflow-hidden">
              <Image
                src={image.image_url}
                alt={image.description || '空間照片'}
                fill
                sizes="200px"
                className="object-cover"
                unoptimized={isLocalUploadImage(image.image_url)}
              />
            </div>
            {image.description && (
              <p className="text-magic-gold-light text-sm">{image.description}</p>
            )}
            <button
              onClick={() => handleDelete(image.id)}
              className="w-full bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

