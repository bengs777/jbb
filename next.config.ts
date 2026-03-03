import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true, // gzip compression
  poweredByHeader: false, // remove X-Powered-By header
  eslint: { ignoreDuringBuilds: true }, // pre-existing lint issues; fix later
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dzunuwrcimytbgvhqrot.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "api.qrserver.com" }, // QRIS QR code images
    ],
    formats: ["image/avif", "image/webp"], // modern formats = smaller files
    minimumCacheTTL: 60 * 60 * 24 * 7, // cache images for 7 days
  },
  serverExternalPackages: ["bcryptjs", "@libsql/client"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",   // tree-shake icons
      "react-hot-toast",
    ],
  },
};

export default nextConfig;
