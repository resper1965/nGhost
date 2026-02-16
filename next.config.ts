import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Enable experimental features if needed
  experimental: {
    // serverActions is now stable, no need to enable
  },
};

export default nextConfig;
