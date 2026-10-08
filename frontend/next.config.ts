import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/patient",
        destination: "/citizen",
        permanent: true,
      },
      {
        source: "/patient/:path*",
        destination: "/citizen/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
