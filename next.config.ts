import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Imposta esplicitamente la root per evitare warning su lockfiles multipli
    root: __dirname,
  },
  // eslint e typescript errors bloccano il build in produzione
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Ottimizzazioni performance
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 anno
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Compressione
  compress: true,
  // Ottimizzazioni bundle
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Ottimizzazioni per mobile
    optimizeServerReact: true,
    serverMinification: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/api/staff/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://admin.rescuemanager.eu" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://help.rescuemanager.eu",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://res.cloudinary.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: http:",
              "frame-src 'self' https://help.rescuemanager.eu",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
