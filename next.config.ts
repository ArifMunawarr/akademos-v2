import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure ESM/CJS packages are transpiled for compatibility
  transpilePackages: ["ovenlivekit"],
  trailingSlash: false,
};

export default nextConfig;
