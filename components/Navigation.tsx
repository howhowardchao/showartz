/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Menu, X, User, LogOut } from 'lucide-react';
import Logo from './Logo';

const navItems = [
  { href: '/', label: '首頁' },
  { href: '/space', label: '故事' },
  { href: '/products', label: '商品' },
  { href: '/about', label: '關於' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 當路由改變時關閉選單
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 檢查用戶登入狀態
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch('/api/auth/user/session', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/user/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 當選單打開時禁止背景滾動
  useEffect(() => {
    if (isMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow || 'unset';
      };
    }
    document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="w-full border-b border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative">
            {/* Logo 在左側 */}
            <Link href="/" className="flex items-center z-10">
              <Logo />
            </Link>
            
            {/* 桌面版導航連結置中 - 只在 md 以上顯示 */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-6 md:space-x-12">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 text-sm md:text-base font-semibold transition-all duration-300 ${
                      isActive
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
                    )}
                  </Link>
                );
              })}
            </div>
            
          {/* 桌面版用戶區域 - 只在 md 以上顯示 */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-[var(--border)] rounded animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--border)] transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-[var(--foreground)]">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  title="登出"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                >
                  登入
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>

          {/* 手機/平板版漢堡選單按鈕 - 只在 md 以下顯示 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative z-[60] p-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            aria-label="選單"
            type="button"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          </div>
        </div>
      </nav>

      {/* 手機/平板版下拉選單 - 移到 nav 外面 */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[73px] bg-white/95 backdrop-blur-md z-[45]"
          onClick={(e) => {
            // 點擊選單背景時關閉選單
            if (e.target === e.currentTarget) {
              setIsMenuOpen(false);
            }
          }}
        >
          <div className="flex flex-col items-end pr-4 pt-6 space-y-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`relative px-6 py-3 text-lg font-semibold transition-all duration-300 w-full text-right ${
                    isActive
                      ? 'text-[var(--primary)] bg-[var(--border)]'
                      : 'text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)]/60'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    {isActive && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
                  )}
                </Link>
              );
            })}

            {/* 手機版用戶區域 */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className="relative px-6 py-3 text-lg font-semibold transition-all duration-300 w-full text-right text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)]/60 flex items-center justify-end gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>會員中心</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="relative px-6 py-3 text-lg font-semibold transition-all duration-300 w-full text-right text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)]/60 flex items-center justify-end gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>登出</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="relative px-6 py-3 text-lg font-semibold transition-all duration-300 w-full text-right text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--border)]/60"
                    >
                      登入
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="relative px-6 py-3 text-lg font-semibold transition-all duration-300 w-full text-right bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-lg"
                    >
                      註冊
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

