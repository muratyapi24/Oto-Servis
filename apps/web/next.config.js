import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/landing/index.html',
        },
        {
          source: '/features',
          destination: '/landing/features.html',
        },
        {
          source: '/about',
          destination: '/landing/about.html',
        },
        {
          source: '/blog',
          destination: '/landing/blog.html',
        },
        {
          source: '/contact',
          destination: '/landing/contact.html',
        },
      ],
    };
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
