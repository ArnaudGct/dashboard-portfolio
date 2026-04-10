import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "500mb",
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  serverExternalPackages: ["sharp"],
  images: {
    // Les images Cloudinary sont deja optimisees en amont.
    // Evite les timeouts "upstream image response timed out" du proxy Next/Image.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "arnaudgct.fr",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Ajoutez d'autres patterns selon vos besoins
    ],
  },
};

export default nextConfig;
