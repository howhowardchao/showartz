'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X } from 'lucide-react';
import Logo from './Logo';

const navItems = [
  { href: '/', label: '首頁' },
  { href: '/space', label: '故事' },
  { href: '/products', label: '商品' },
  { href: '/about', label: '關於' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 當路由改變時關閉選單
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 當選單打開時禁止背景滾動
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <nav className="w-full border-b border-magic-purple/30 bg-magic-dark/50 backdrop-blur-sm sticky top-0 z-50">
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
                  className={`relative px-4 py-2 text-sm md:text-base font-magic transition-all duration-300 ${
                    isActive
                      ? 'text-magic-gold'
                      : 'text-magic-gold-light hover:text-magic-gold'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <>
                      <Sparkles className="absolute -left-2 -top-1 w-3 h-3 text-magic-gold magic-sparkle" />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-magic-gold to-transparent magic-glow" />
                    </>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* 手機/平板版漢堡選單按鈕 - 只在 md 以下顯示 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden z-50 p-2 text-magic-gold-light hover:text-magic-gold transition-colors"
            aria-label="選單"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* 桌面版右側空白區域，用於平衡佈局 */}
          <div className="hidden md:block w-32 md:w-40"></div>
        </div>

        {/* 手機/平板版下拉選單 */}
        <div
          className={`md:hidden fixed inset-0 top-[73px] bg-magic-dark/95 backdrop-blur-md z-40 transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'opacity-100 visible'
              : 'opacity-0 invisible'
          }`}
        >
          <div className="flex flex-col items-end pr-4 pt-6 space-y-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`relative px-6 py-3 text-lg font-magic transition-all duration-300 w-full text-right ${
                    isActive
                      ? 'text-magic-gold bg-magic-purple/20'
                      : 'text-magic-gold-light hover:text-magic-gold hover:bg-magic-purple/10'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    {isActive && (
                      <Sparkles className="w-4 h-4 text-magic-gold magic-sparkle" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-magic-gold to-transparent magic-glow" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

