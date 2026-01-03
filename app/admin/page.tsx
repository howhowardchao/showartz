/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import VideoManager from '@/components/admin/VideoManager';
import ImageManager from '@/components/admin/ImageManager';
import ProductManager from '@/components/admin/ProductManager';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import UserManager from '@/components/admin/UserManager';
import ServiceSettings from '@/components/admin/ServiceSettings';
import { LogOut, BarChart3, Video, Image as ImageIcon, Package, Users, Settings } from 'lucide-react';

type TabType = 'analytics' | 'videos' | 'images' | 'products' | 'users' | 'settings';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
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
        <div className="text-[var(--primary)] font-semibold text-xl">
          檢查中...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'analytics' as TabType, label: '訪客統計', icon: BarChart3 },
    { id: 'videos' as TabType, label: '媒體管理', icon: Video },
    { id: 'images' as TabType, label: '故事管理', icon: ImageIcon },
    { id: 'products' as TabType, label: '商品管理', icon: Package },
    { id: 'users' as TabType, label: '會員管理', icon: Users },
    { id: 'settings' as TabType, label: '服務設定', icon: Settings },
  ];

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-semibold text-[var(--foreground)]">後台管理</h1>
        <button
          onClick={handleLogout}
          className="bg-white border border-[var(--border)] text-[var(--foreground)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--border)] transition-colors flex items-center gap-2 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          登出
        </button>
      </div>

      {/* 分頁籤 */}
      <div className="border-b border-[var(--border)] mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap
                  ${
                    isActive
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 分頁內容 */}
      <div className="mt-6">
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'videos' && <VideoManager />}
        {activeTab === 'images' && <ImageManager />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'settings' && <ServiceSettings />}
      </div>
    </div>
  );
}

