import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    // Every value the app actually passes to next/image. A quality outside this
    // list is a 400, not a fallback — 65 silently blanked the whole mobile gallery.
    qualities: [65, 75, 85, 90],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.16.54.52',
    '172.16.54.52:3000',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
