import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    })
    return config
  },
};

export default nextConfig;
