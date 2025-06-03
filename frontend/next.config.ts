import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fixed port configuration to prevent port conflicts
  experimental: {
    // Enable experimental features if needed
  },
  // Server configuration
  serverRuntimeConfig: {
    port: process.env.PORT || 8080,
  },
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
