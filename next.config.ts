import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Next.js workspace root warning when multiple lockfiles exist on disk.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
