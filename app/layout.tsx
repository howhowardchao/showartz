import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '藝棧 Showartz - 魔法商店',
  description: '會說故事的動物潮包、閃著微光的奇幻裝飾，每一幅畫作都藏著秘密通道。歡迎光臨，你的幻想補給站 藝棧',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-magic-dark via-magic-blue/20 to-magic-dark flex flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
