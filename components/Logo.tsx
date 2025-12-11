'use client';

import Image from 'next/image';

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 md:w-12 md:h-12">
        <div className="relative w-full h-full magic-glow rounded-full bg-gradient-to-br from-magic-gold to-magic-purple p-0.5">
          <div className="relative w-full h-full rounded-full bg-magic-dark flex items-center justify-center overflow-hidden">
            <Image
              src="/showartzlogo.png"
              alt="Showartz Logo"
              fill
              sizes="(max-width: 768px) 40px, 48px"
              className="object-contain p-1"
              priority
            />
          </div>
        </div>
      </div>
      <span className="text-lg md:text-xl font-magic text-magic-gold">
        Showartz
      </span>
    </div>
  );
}
