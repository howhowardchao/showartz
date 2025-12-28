import Image from 'next/image';

export default function AboutPage() {
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
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)] shadow-sm">
              關於藝棧
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-[var(--foreground)] leading-tight">
              關於藝棧
            </h1>
            <p className="mt-3 text-base md:text-lg text-[var(--muted)] leading-relaxed max-w-2xl">
              這裡有會說故事的潮流配件與奇幻裝飾，每一幅畫作都藏著秘密通道。帶走的不只是商品，更是一段屬於你的旅程。
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg p-8 md:p-12 space-y-6">
            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
              這裡有會說故事的動物潮包、閃著微光的奇幻裝飾，每一幅畫作都藏著秘密通道。
            </p>
            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
              你可以窩在角落與貓咪玩耍，在充滿回憶的雜貨海裡淘寶，或是單純欣賞店長如精靈般的側臉。
            </p>
            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
              空氣中飄著無限幻想，每個抽屜都裝著驚喜。來這裡，帶走的不只是商品，更是一段屬於你的奇幻旅程。
            </p>

            <div className="pt-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--foreground)] mb-4">
                服務項目
              </h2>
              <ul className="space-y-3 text-[var(--muted)] text-lg leading-relaxed">
                <li className="bg-[var(--border)]/50 border border-[var(--border)] rounded-xl px-4 py-3">
                  藝棧優選商品
                </li>
                <li className="bg-[var(--border)]/50 border border-[var(--border)] rounded-xl px-4 py-3">
                  藝棧名店探索
                </li>
                <li className="bg-[var(--border)]/50 border border-[var(--border)] rounded-xl px-4 py-3">
                  AI 商業應用導入服務
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

