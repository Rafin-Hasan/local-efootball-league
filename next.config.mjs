/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake barrel imports so a page only ships the motion primitives it
  // actually uses instead of the whole package surface.
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
