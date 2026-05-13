import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
