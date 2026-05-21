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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // script-src: + help widget Chatwoot/Crisp self-hosted su help.* + GA collector
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com https://vercel.live https://help.rescuemanager.eu https://*.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://help.rescuemanager.eu",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://res.cloudinary.com https://www.googletagmanager.com https://help.rescuemanager.eu https://*.google-analytics.com",
              "font-src 'self' data: https://fonts.gstatic.com https://help.rescuemanager.eu",
              // connect-src: + GA regional collectors (region1/2/.../analytics.google.com) + help widget WS
              "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://ienzdgrqalltvkdkuamp.supabase.co wss://ienzdgrqalltvkdkuamp.supabase.co https://help.rescuemanager.eu wss://help.rescuemanager.eu",
              "frame-src 'self' https://vercel.live https://help.rescuemanager.eu",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
