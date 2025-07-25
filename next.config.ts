
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Adicionado para exportação estática
  trailingSlash: true, // Adicionado para compatibilidade com alguns servidores estáticos/WebViews
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Adicionado para compatibilidade com exportação estática/APK
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      }
    ],
  },
};

export default nextConfig;
