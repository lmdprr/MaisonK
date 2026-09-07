import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Pas d'optimiseur d'images Vercel sur Cloudflare : le loader custom cible
    // R2 et /cdn-cgi/image. Voir lib/imageLoader.ts.
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    // Largeurs candidates du srcset. Chaque largeur demandée par un navigateur
    // consomme une transformation unique Cloudflare (5 000 / mois sur le plan
    // Free) : on ne garde que ce que les mises en page utilisent. Le rendu le
    // plus large est le hero à 50 vw, soit ~960 px CSS sur un écran de 1 920,
    // donc 1 920 px physiques en Retina. Par défaut Next en propose 16
    // (jusqu'à 3 840 px), ici 7.
    deviceSizes: [640, 960, 1280, 1920],
    // Largeurs fixes (logo 168 px → 256 en Retina) et petites vignettes.
    imageSizes: [128, 256, 384],
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
