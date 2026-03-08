/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dzunuwrcimytbgvhqrot.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  serverExternalPackages: ["bcryptjs", "@libsql/client"],
  // experimental: {
  //   optimizePackageImports: ["lucide-react", "react-hot-toast"],
  // },
};

export default nextConfig;
