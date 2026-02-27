import type { NextConfig } from "next";

const repo = "ARG_Plataforma_Integral_Dotacion";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
