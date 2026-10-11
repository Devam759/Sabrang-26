import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  images: {
    // Serve AVIF first (≈40% smaller than WebP for photos), then WebP as fallback.
    formats: ["image/avif", "image/webp"],
    // Quality 90 removed — 85 is visually indistinguishable for festival photography.
    qualities: [65, 75, 85],
    // Cache optimised variants on the CDN for 30 days. Without this, Vercel re-optimises
    // on every cold request after the default short TTL expires.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.16.54.52',
    '172.16.54.52:3000',
    '192.168.56.1',
    '192.168.56.1:3000',
  ],
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: '/sponsor',
        destination: '/sponsors',
        permanent: true,
      },
      {
        source: '/highlights',
        destination: '/gallery',
        permanent: true,
      },
      {
        source: '/passes',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/tickets',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/schedule/ode/:path*',
        destination: '/schedule',
        permanent: true,
      },
      {
        source: '/ode/:path*',
        destination: '/schedule',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Advertise HTTP/3 support over QUIC port 443 to modern browsers
            key: "Alt-Svc",
            value: 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
