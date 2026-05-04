import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next dev server to serve assets when accessed via the public domain
  // through Caddy (only relevant in dev — production builds aren't affected).
  allowedDevOrigins: ["bombaclub.live", "www.bombaclub.live"],
};

export default nextConfig;
