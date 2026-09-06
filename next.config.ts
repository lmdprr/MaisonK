import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Pas d'optimiseur d'images Vercel sur Cloudflare : le loader custom cible
    // R2 et /cdn-cgi/image. Voir lib/imageLoader.ts pour les trois modes.
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
  },
  experimental: {
    serverActions: {
      // La photo du formulaire « Votre projet » transite en base64 dans le corps
      // de la server action (≤ ~1,5 Mo après redimensionnement côté client).
      // La limite par défaut est 1 Mo.
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
