import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    qualities: [75, 85],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.16.54.52',
    '172.16.54.52:3000',
  ],
};

export default nextConfig;
