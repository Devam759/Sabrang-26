import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
