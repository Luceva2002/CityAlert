import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.ngrok-free.app'],
  async redirects() {
    return [
      { source: '/map', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/leaderboard', destination: '/', permanent: true },
      { source: '/virtual-tour', destination: '/', permanent: true },
      { source: '/onboarding', destination: '/auth', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
