import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maylon-store.s3.us-east-1.amazonaws.com",
        pathname: "/store/produtos/**",
      },
      {
        protocol: "https",
        hostname: "foto-temporarias.s3.us-east-1.amazonaws.com",
        pathname: "/rifas/**",
      },
    ],
  },
};

export default nextConfig;