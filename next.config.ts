import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Static export for S3/CloudFront deployment (also used by Capacitor native builds)
  output: 'export',

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
