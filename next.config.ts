import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    serverActions: {
      // Las fotos de check-in (cámara/galería) viajan como data URL en el
      // Server Action del kiosco; el límite por defecto de 1MB las corta.
      bodySizeLimit: '10mb',
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
});
