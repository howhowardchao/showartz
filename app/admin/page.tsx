/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import VideoManager from '@/components/admin/VideoManager';
import ImageManager from '@/components/admin/ImageManager';
import ProductManager from '@/components/admin/ProductManager';
import { LogOut } from 'lucide-react';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include', // 確保發送 cookies
      });
      if (response.ok) {
        const data = await response.json();
        setAuthenticated(data.authenticated);
      } else {
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      setAuthenticated(false);
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-magic-gold font-magic text-xl magic-sparkle">
          檢查中...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-magic text-magic-gold">後台管理</h1>
        <button
          onClick={handleLogout}
          className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          登出
        </button>
      </div>

      <div className="space-y-12">
        <VideoManager />
        <ImageManager />
        <ProductManager />
      </div>
    </div>
  );
}

