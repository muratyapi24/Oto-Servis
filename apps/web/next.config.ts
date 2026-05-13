import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  transpilePackages: ["@repo/ui", "@repo/database"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/landing/index.html" },
        { source: "/features", destination: "/landing/features.html" },
        { source: "/about", destination: "/landing/about.html" },
        { source: "/blog", destination: "/landing/blog.html" },
        { source: "/contact", destination: "/landing/contact.html" },
      ],
    };
  },
};

const config: NextConfig =
  process.env.NODE_ENV === "development"
    ? nextConfig
    : withSentryConfig(nextConfig, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: true,
        widenClientFileUpload: false,
        sourcemaps: {
          disable: true,
        },
      });

export default config;
