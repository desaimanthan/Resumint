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
};

export default nextConfig;
