'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import SearchAgent from '@/components/SearchAgent';
import VideoGrid from '@/components/VideoGrid';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-[var(--border)] py-10 md:py-14">
        {/* 背景插圖全幅覆蓋 */}
        <div className="pointer-events-none absolute inset-0 opacity-70 md:opacity-70">
          <Image
            src="/images/hero-illustration.png"
            alt="藝棧 Showartz 插圖"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[var(--muted)] shadow-sm">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                每週上新・跟著 IG 實拍逛店
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[var(--foreground)] leading-tight">
                藝棧 Showartz
              </h1>
              <p className="text-base md:text-lg text-[var(--muted)] leading-relaxed">
                精選會說故事的潮流配件與奇幻裝飾，實拍穿搭都在 IG。找靈感、聊商品、直接逛起來。
              </p>
            </div>

            {/* 搜尋工具 */}
            <div className="w-full">
              <SearchAgent />
            </div>
          </div>
        </div>
      </section>
      
      {/* 內容區域：admin 貼入的 IG 卡片（後端來源） */}
      <div className="container mx-auto px-4 pt-6 pb-14 md:pb-18">
        <section className="space-y-4">
          <div>
            <p className="text-sm text-[var(--muted)]">IG 精選</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">來自社群的最新貼文</h2>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
            <VideoGrid />
          </div>
        </section>
      </div>
    </div>
  );
}
