import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: true, // Supabase 이미지는 최적화 없이 직접 로드
  },
};

export default nextConfig;
