import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de check-in (cámara/galería) viajan como data URL en el
      // Server Action del kiosco; el límite por defecto de 1MB las corta.
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
