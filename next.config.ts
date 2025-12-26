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
      },
      {
        protocol: 'https',
        hostname: 'cdn02.pinkoi.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn03.pinkoi.com',
      },
      {
        protocol: 'https',
        hostname: '**.pinkoi.com',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.tw',
      },
      {
        protocol: 'https',
        hostname: '**.shopee.tw',
      },
    ],
  },
};

export default nextConfig;
