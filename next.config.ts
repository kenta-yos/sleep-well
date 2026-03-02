import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  serverActions: {
    bodySizeLimit: "10mb",
  },
};

export default nextConfig;
