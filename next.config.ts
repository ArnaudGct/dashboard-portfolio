import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "portfolio.srv892985.hstgr.cloud",
        port: "3000",
        pathname: "/uploads/**",
      },
      // Ajoutez d'autres patterns selon vos besoins
    ],
  },
};

export default nextConfig;
