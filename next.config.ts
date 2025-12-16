import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
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
    ],
  },
};

export default nextConfig;
