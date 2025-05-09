/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  dest: "public",
})(nextConfig);
