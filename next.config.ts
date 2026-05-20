import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-71da3bae-a302-4590-89b6-682aa459f659.space-z.ai",
  ],
};

export default nextConfig;
