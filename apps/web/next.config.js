import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
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

const sentryEnabled = Boolean(process.env.SENTRY_DSN);

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Client bundle'ı şişirmemek için kapalı; sourcemap upload yalnızca server
  // tarafı için anlamlı olacak şekilde daraltıldı.
  widenClientFileUpload: false,
  hideSourceMaps: true,
  webpack: {
    disableSentryConfig: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
  sourcemaps: {
    disable: true,
  },
};

export default sentryEnabled
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
