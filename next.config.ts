import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  async rewrites() {
    return [
      {
        source: '/images/:path*',
        destination: '/api/images/:path*',
      },
    ];
  },
};

export default nextConfig;
