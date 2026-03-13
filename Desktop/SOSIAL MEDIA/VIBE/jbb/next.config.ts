import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/isomorphic-ws",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "files.useyapi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.useyapi.com",
        pathname: "/**",
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
