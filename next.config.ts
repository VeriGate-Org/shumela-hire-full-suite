import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Static export for S3/CloudFront deployment (also used by Capacitor native builds)
  // Disabled during CI type-check builds (STATIC_EXPORT=true enables it in deploy workflow)
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' as const } : {}),

  /*
   * Pin the workspace root to this project.
   *
   * Next infers the root by walking up for a lockfile. A stray package-lock.json anywhere above
   * the checkout — a mistyped `npm install` in a home directory is enough — silently wins, and
   * file tracing then resolves against that directory instead. The build compiles, then dies
   * looking for `.next/server/pages-manifest.json`.
   *
   * It only bites where such a file exists, so CI is unaffected and it presents as "works on CI,
   * broken on my machine". Pinning it costs nothing and removes the trap for everyone.
   *
   * Build only, deliberately: this checkout's node_modules is a symlink to a sibling checkout, and
   * pinning the root in dev puts that symlink outside it — Turbopack then refuses to start with
   * "Symlink node_modules is invalid, it points out of the filesystem root".
   */
  ...(process.env.NODE_ENV === 'production' ? { outputFileTracingRoot: __dirname } : {}),

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'recharts', 'date-fns'],
  },

  // Compression handled by CloudFront, not needed at build time
  compress: false,

  // Image optimization disabled for static export (use <img> or external CDN)
  images: {
    unoptimized: true,
  },

  // Note: Security headers (X-Frame-Options, CSP, HSTS, etc.) are now configured
  // in CloudFront response headers policy instead of Next.js headers().
  // Static export does not support the headers() config.

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/node_modules/**'],
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
