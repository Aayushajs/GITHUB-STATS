import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // SVG cards are served from Edge route handlers; no image optimization needed.
  poweredByHeader: false,
};

export default nextConfig;
