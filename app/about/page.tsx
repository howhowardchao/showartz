export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-12 md:pt-16">
          <h1 className="text-4xl md:text-5xl font-magic text-magic-gold mb-4">
            關於藝棧
          </h1>
        </div>

        <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-8 md:p-12 backdrop-blur-sm magic-glow">
          <div className="prose prose-invert max-w-none">
            <p className="text-magic-gold-light text-lg md:text-xl leading-relaxed mb-6 font-magic">
              這裡有會說故事的動物潮包、閃著微光的奇幻裝飾，每一幅畫作都藏著秘密通道。
            </p>
            <p className="text-magic-gold-light text-lg md:text-xl leading-relaxed mb-6 font-magic">
              你可以窩在角落與貓咪玩耍，在充滿回憶的雜貨海裡淘寶，或是單純欣賞店長如精靈般的側臉。
            </p>
            <p className="text-magic-gold-light text-lg md:text-xl leading-relaxed mb-8 font-magic">
              空氣中飄著無限幻想，每個抽屜都裝著驚喜。來這裡，帶走的不只是商品，更是一段屬於你的奇幻旅程。
            </p>

            <div className="mt-10">
              <h2 className="text-3xl font-magic text-magic-gold mb-6 text-center">
                服務項目
              </h2>
              <ul className="space-y-4 text-magic-gold-light text-lg md:text-xl leading-relaxed font-magic">
                <li className="bg-magic-dark/60 border border-magic-purple/30 rounded-xl px-6 py-4">
                  藝棧優選商品
                </li>
                <li className="bg-magic-dark/60 border border-magic-purple/30 rounded-xl px-6 py-4">
                  藝棧名店探索
                </li>
                <li className="bg-magic-dark/60 border border-magic-purple/30 rounded-xl px-6 py-4">
                  AI商業應用導入服務
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-12 md:mb-16"></div>
    </div>
  );
}

