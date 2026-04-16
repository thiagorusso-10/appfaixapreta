import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configs para otimizar imagens hospedadas no Supabase e PWA
  images: {
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: 'hhofuvhvxnqyynyxltoh.supabase.co' 
      },
    ],
  },
  // Headers de Segurança Padrão
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
