import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  serverExternalPackages: ["sharp"],
  images: {
    domains: ["localhost"], // Ajoutez ici le domaine de votre portfolio
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      // Ajoutez d'autres patterns selon vos besoins
    ],
  },
};

export default nextConfig;
