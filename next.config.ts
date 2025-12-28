import type { NextConfig } from 'next';

// 使用預設 output（非 standalone），避免特殊輸出造成路由漏打包
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.instagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn01.pinkoi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn02.pinkoi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn03.pinkoi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn04.pinkoi.com',
        pathname: '/**',
      },
    ],
    // 允許未優化的圖片（如果優化失敗）
    unoptimized: false,
  },
};

export default nextConfig;
