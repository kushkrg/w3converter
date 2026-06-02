import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env["DOCKER_BUILD"] === "true" ? "standalone" : undefined,
  experimental: {
    serverActions: {
      allowedOrigins: [process.env["NEXT_PUBLIC_APP_URL"] ?? "localhost:3000"],
    },
  },
  transpilePackages: ["@pdf-tools/core"],
};

export default nextConfig;
