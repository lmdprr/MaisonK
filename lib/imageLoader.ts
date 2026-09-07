/**
 * Loader `next/image` pour Cloudflare.
 *
 * L'optimiseur d'images de Next.js est un service Vercel, absent de Cloudflare.
 * On le remplace par les transformations d'images Cloudflare (`/cdn-cgi/image`),
 * facturées à la transformation unique (5 000 / mois offertes sur le plan Free).
 *
 * Deux réglages indépendants, pilotés par l'environnement :
 *
 * | Variable                               | Effet                                              |
 * |----------------------------------------|----------------------------------------------------|
 * | `NEXT_PUBLIC_IMAGE_CDN_URL`            | origine des fichiers : le bucket R2 au lieu du site |
 * | `NEXT_PUBLIC_IMAGE_TRANSFORMS=true`    | passage par `/cdn-cgi/image` (resize, AVIF/WebP)   |
 *
 * Sans aucune des deux, l'image est servie telle quelle depuis `/public`
 * (Workers Static Assets). Les transformations exigent « Transformations »
 * activé sur la zone Cloudflare, donc un domaine custom : elles ne fonctionnent
 * pas sur `*.workers.dev`. Si l'origine est un autre domaine que le site,
 * l'option « Resize images from any origin » doit aussi être activée sur la zone.
 *
 * Les chemins stockés par Keystatic restent relatifs (`/images/hero/x.jpg`) :
 * le contenu ne dépend pas de l'hébergeur, seul ce loader décide de l'origine.
 *
 * Le nombre de transformations uniques consommées dépend directement des
 * largeurs candidates de `next/image` : elles sont plafonnées dans
 * `next.config.ts` (`deviceSizes`, `imageSizes`) aux besoins réels du site.
 *
 * @remarks
 * Ce fichier est référencé par `images.loaderFile` (next.config.ts) et passé
 * explicitement en prop par `components/ui/Img.tsx`, voir ce dernier pour la
 * raison.
 */

interface LoaderArgs {
  src: string
  width: number
  quality?: number
}

const CDN_URL = process.env.NEXT_PUBLIC_IMAGE_CDN_URL?.replace(/\/$/, '') ?? ''
const USE_TRANSFORMS = process.env.NEXT_PUBLIC_IMAGE_TRANSFORMS === 'true'

/** Qualité par défaut de `next/image`, reprise pour rester cohérent avec Vercel. */
const DEFAULT_QUALITY = 75

export default function cloudflareImageLoader({ src, width, quality }: LoaderArgs): string {
  // Aperçus locaux (photo du formulaire) : rien à réécrire.
  if (src.startsWith('data:') || src.startsWith('blob:')) return src

  const isAbsolute = /^https?:\/\//.test(src)
  const relative = src.startsWith('/') ? src : `/${src}`
  const resolved = isAbsolute ? src : `${CDN_URL}${relative}`

  if (!USE_TRANSFORMS) return resolved

  // `fit=scale-down` : jamais d'agrandissement au-delà de la source.
  const options = [
    `width=${width}`,
    `quality=${quality ?? DEFAULT_QUALITY}`,
    'format=auto',
    'fit=scale-down',
  ].join(',')

  // Source relative : chemin sur la zone, sans slash initial (`/cdn-cgi/image/<options>/images/x.jpg`).
  // Source absolue : URL complète (`/cdn-cgi/image/<options>/https://cdn.../images/x.jpg`).
  const source = /^https?:\/\//.test(resolved) ? resolved : resolved.slice(1)
  return `/cdn-cgi/image/${options}/${source}`
}
