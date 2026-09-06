'use client'

import Image, { type ImageProps } from 'next/image'
import cloudflareImageLoader from '@/lib/imageLoader'

/**
 * `next/image` avec le loader Cloudflare passé explicitement.
 *
 * `images.loaderFile` (next.config.ts) suffit en build webpack, mais Turbopack
 * en dev ne l'applique pas au rendu serveur et lève « missing loader prop ».
 * La prop `loader` n'étant acceptée que depuis un composant client, ce wrapper
 * est la seule façon d'avoir le même comportement en dev et en prod.
 *
 * À utiliser partout à la place de `next/image`. Le composant reste
 * utilisable depuis un composant serveur : seule la référence au loader
 * traverse la frontière.
 */
export default function Img({ alt, ...rest }: Omit<ImageProps, 'loader'>) {
  return <Image {...rest} alt={alt} loader={cloudflareImageLoader} />
}
