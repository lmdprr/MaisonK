/**
 * Loader `next/image` pour Cloudflare.
 *
 * L'optimiseur d'images de Next.js est un service Vercel, absent de Cloudflare.
 * On le remplace par les transformations d'images Cloudflare (`/cdn-cgi/image`),
 * facturées à la transformation unique (5 000 / mois offertes sur le plan Free).
 *
 * Trois modes, pilotés par l'environnement :
 *
 * | Variables                              | Résultat                                   |
 * |----------------------------------------|--------------------------------------------|
 * | aucune                                 | image servie telle quelle depuis `/public` |
 * | `NEXT_PUBLIC_IMAGE_CDN_URL`            | image servie depuis le bucket R2           |
 * | + `NEXT_PUBLIC_IMAGE_TRANSFORMS=true`  | passage par `/cdn-cgi/image` (resize, AVIF/WebP) |
 *
 * Le troisième mode exige « Transformations » activé sur la zone, donc un
 * domaine custom : il ne fonctionne pas sur `*.workers.dev`.
 *
 * Les chemins stockés par Keystatic restent relatifs (`/images/hero/x.jpg`) :
 * le contenu ne dépend pas de l'hébergeur, seul ce loader décide de l'origine.
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
  const resolved = isAbsolute ? src : `${CDN_URL}${src.startsWith('/') ? src : `/${src}`}`

  if (!USE_TRANSFORMS) return resolved

  // `fit=scale-down` : jamais d'agrandissement au-delà de la source.
  const options = [
    `width=${width}`,
    `quality=${quality ?? DEFAULT_QUALITY}`,
    'format=auto',
    'fit=scale-down',
  ].join(',')

  return `/cdn-cgi/image/${options}/${resolved}`
}
