import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    qualities: [75, 85],
  },
};

export default nextConfig;
