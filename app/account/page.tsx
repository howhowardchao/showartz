'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Package, MapPin, LogOut, Edit2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  membership_level: string;
  total_points: number;
  total_spent: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/login?returnUrl=/account');
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Fetch user error:', error);
        router.push('/login?returnUrl=/account');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/user/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--primary)] font-semibold text-xl">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f3f6f8] to-[#eef2f7]">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-semibold text-[var(--foreground)] mb-8">會員中心</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側選單 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-[var(--foreground)]">{user.name}</div>
                  <div className="text-sm text-[var(--muted)]">{user.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--primary)] text-white font-semibold"
                >
                  <User className="w-5 h-5" />
                  個人資料
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  地址管理
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                >
                  <Package className="w-5 h-5" />
                  我的訂單
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  登出
                </button>
              </div>
            </div>

            {/* 會員資訊卡片 */}
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">會員資訊</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">會員等級</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {user.membership_level === 'regular' ? '一般會員' : user.membership_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">累積積分</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {user.total_points.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">累積消費</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    NT$ {user.total_spent.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側內容 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">個人資料</h2>
                <button className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-dark)] font-semibold">
                  <Edit2 className="w-4 h-4" />
                  編輯
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] mb-2">
                    姓名
                  </label>
                  <div className="text-lg text-[var(--foreground)]">{user.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    電子郵件
                  </label>
                  <div className="text-lg text-[var(--foreground)]">{user.email}</div>
                </div>

                {user.nickname && (
                  <div>
                    <label className="block text-sm font-semibold text-[var(--muted)] mb-2">
                      暱稱
                    </label>
                    <div className="text-lg text-[var(--foreground)]">{user.nickname}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

