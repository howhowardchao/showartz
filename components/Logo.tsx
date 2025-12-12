'use client';

import Image from 'next/image';

export default function Logo() {
  // 橫式 logo 比例：2001 x 500 ≈ 4:1
  // 設定高度，寬度自動按比例調整
  return (
    <div className="flex items-center">
      <div className="relative h-[34px] md:h-[42px] w-auto">
        <Image
          src="/showartzlogo.png"
          alt="Showartz Logo"
          width={2001}
          height={500}
          className="object-contain h-full w-auto"
          priority
          sizes="(max-width: 768px) 160px, 200px"
        />
      </div>
    </div>
  );
}
