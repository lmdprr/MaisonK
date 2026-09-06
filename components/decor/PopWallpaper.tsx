/**
 * Papier peint pop de l'en-tête sans visuel : une grille de tuiles colorées
 * portant des silhouettes de mobilier et le quadrilobe de la marque.
 *
 * Chaque tuile a deux faces (un meuble devant, un autre objet ou une fleur
 * derrière) : elle se retourne lentement à tour de rôle, comme si la pièce se
 * réaménageait d'elle-même, et immédiatement sous la souris. Les couleurs et
 * les objets sont tirés de l'index : le rendu est identique serveur et client.
 *
 * Le tempo, le retournement au survol et le fondu des bords sont dans
 * globals.css (`[data-pop]`) ; DecorRuntime lance l'animation à l'entrée dans
 * l'écran via `--mk-play`, comme les autres décors.
 */

import type { CSSProperties } from 'react'
import { FLOWER } from './sketch-data'

interface Shape {
  d: string
  /** `bg` : découpe dans la couleur de la tuile ; `accent` : seconde couleur. */
  k?: 'bg' | 'accent'
}

/*
 * Grille de construction des silhouettes, commune à tous les jeux d'objets.
 *
 * - Carré 100 × 100, zone utile de 10 à 90 dans les deux sens : le SVG occupe
 *   72 % de la tuile, une tuile fait 60 px sur mobile, la marge évite que la
 *   silhouette touche le bord arrondi.
 * - Trois rôles au plus par objet : la silhouette (encre), une découpe dans la
 *   couleur de la tuile (`bg`), une touche de seconde couleur (`accent`).
 *   Plusieurs tracés peuvent partager un rôle s'ils forment un seul détail
 *   (les deux feuilles de la plante, la montagne et le soleil du cadre).
 * - Formes pleines, pas de trait : le trait appartient aux croquis au trait
 *   (sketch-data.ts), qui déclinent les mêmes objets dans l'autre rendu.
 * - Un objet se lit en une seconde à 60 px, sur les six palettes : la découpe
 *   doit rester visible sur la tuile bordeaux comme sur la tuile sable.
 */
const OBJECTS: Record<string, Shape[]> = {
  fauteuil: [
    { d: 'M18 62 v-24 a14 14 0 0 1 14 -14 h36 a14 14 0 0 1 14 14 v24 z' },
    { d: 'M12 58 a6 6 0 0 1 6 -6 h64 a6 6 0 0 1 6 6 v18 h-76 z' },
    { d: 'M18 76 h8 v10 h-8 z M74 76 h8 v10 h-8 z' },
    { d: 'M30 40 h40 v12 h-40 z', k: 'bg' },
  ],
  lampe: [
    { d: 'M34 14 h32 l9 30 h-50 z' },
    { d: 'M48 44 h4 v42 h-4 z' },
    { d: 'M32 84 a18 6 0 0 1 36 0 z' },
    { d: 'M40 38 h20 v3 h-20 z', k: 'accent' },
  ],
  plante: [
    { d: 'M34 64 h32 l-5 26 h-22 z' },
    { d: 'M50 62 c-24 -6 -30 -30 -20 -46 c16 6 24 28 20 46 z', k: 'accent' },
    { d: 'M50 62 c24 -6 30 -30 20 -46 c-16 6 -24 28 -20 46 z', k: 'accent' },
    { d: 'M50 64 c-2 -20 2 -34 0 -50 c-2 16 2 30 0 50 z', k: 'bg' },
  ],
  cadre: [
    { d: 'M20 20 h60 v60 h-60 z' },
    { d: 'M29 29 h42 v42 h-42 z', k: 'bg' },
    { d: 'M33 67 l12 -18 l9 11 l6 -7 l7 14 z', k: 'accent' },
    { d: 'M58 38 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 z', k: 'accent' },
  ],
  miroir: [
    { d: 'M28 88 v-46 a22 22 0 0 1 44 0 v46 z' },
    { d: 'M36 88 v-46 a14 14 0 0 1 28 0 v46 z', k: 'bg' },
    { d: 'M43 84 v-36 a7 7 0 0 1 7 -7 v43 z', k: 'accent' },
  ],
  table: [
    { d: 'M12 58 h76 v8 h-76 z' },
    { d: 'M18 66 h7 v22 h-7 z M75 66 h7 v22 h-7 z' },
    { d: 'M42 58 l-5 -22 a13 13 0 0 1 26 0 l-5 22 z', k: 'accent' },
    { d: 'M47 36 h6 v-10 h-6 z', k: 'bg' },
  ],
  chaise: [
    { d: 'M30 12 a8 8 0 0 1 8 -8 h24 a8 8 0 0 1 8 8 v44 h-40 z' },
    { d: 'M38 20 h24 v28 h-24 z', k: 'bg' },
    { d: 'M24 56 h52 v12 h-52 z' },
    { d: 'M28 68 h7 v22 h-7 z M65 68 h7 v22 h-7 z' },
  ],
  suspension: [
    { d: 'M48 6 h4 v28 h-4 z' },
    { d: 'M18 66 a32 32 0 0 1 64 0 z' },
    { d: 'M40 74 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 z', k: 'accent' },
  ],
  commode: [
    { d: 'M14 28 h72 v54 h-72 z' },
    { d: 'M18 82 h8 v8 h-8 z M74 82 h8 v8 h-8 z' },
    { d: 'M14 52 h72 v3 h-72 z', k: 'bg' },
    { d: 'M42 39 h16 v4 h-16 z M42 66 h16 v4 h-16 z', k: 'bg' },
  ],
  fleur: [{ d: FLOWER }],
}

const NAMES = Object.keys(OBJECTS)

/** Fond de tuile, encre de la silhouette, seconde couleur. Palette de la charte. */
const PALETTES: [string, string, string][] = [
  ['#c07454', '#edeae4', '#551020'],
  ['#8bc1a9', '#151515', '#edeae4'],
  ['#c08a96', '#551020', '#edeae4'],
  ['#551020', '#edeae4', '#c08a96'],
  ['#d7d0b4', '#551020', '#c07454'],
  ['#e6d9d3', '#c07454', '#551020'],
]

function Face({ object, palette, back }: { object: string; palette: number; back?: boolean }) {
  const [bg, ink, accent] = PALETTES[palette % PALETTES.length]
  const fill = { bg, accent, ink }
  return (
    <span data-face={back ? 'back' : 'front'} style={{ background: bg }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {OBJECTS[object].map((s, i) => (
          <path key={i} d={s.d} fill={fill[s.k ?? 'ink']} fillRule="evenodd" />
        ))}
      </svg>
    </span>
  )
}

/**
 * Grille de tuiles. Le nombre est large (le conteneur masque le surplus) :
 * l'ordre des objets est une marche de pas 7 dans la liste, une fleur toutes
 * les cinq tuiles, pour qu'aucune colonne ne répète sa voisine.
 */
export default function PopWallpaper({ count = 60, className = '' }: { count?: number; className?: string }) {
  const tiles = Array.from({ length: count }, (_, i) => {
    const fleur = i % 5 === 3
    const front = fleur ? 'fleur' : NAMES[(i * 7) % (NAMES.length - 1)]
    const back = fleur ? NAMES[(i * 3 + 1) % (NAMES.length - 1)] : i % 3 === 1 ? 'fleur' : NAMES[(i * 7 + 4) % (NAMES.length - 1)]
    return { front, back, p1: (i * 5 + Math.floor(i / 7)) % PALETTES.length, p2: (i * 5 + Math.floor(i / 7) + 3) % PALETTES.length, delay: ((i * 37) % count) / count }
  })

  return (
    <span data-sketch="" data-pop="" aria-hidden="true" className={`block ${className}`.trim()}>
      {tiles.map((t, i) => (
        <span key={i} data-tile="" style={{ '--i': i, '--d': t.delay } as CSSProperties}>
          <span data-spin="">
            <span data-flip="">
              <Face object={t.front} palette={t.p1} />
              <Face object={t.back} palette={t.p2} back />
            </span>
          </span>
        </span>
      ))}
    </span>
  )
}
