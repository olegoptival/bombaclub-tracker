import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["bombaclub.live", "www.bombaclub.live"],
};

export default nextConfig;
