import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
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
    ],
  },
};

export default nextConfig;
