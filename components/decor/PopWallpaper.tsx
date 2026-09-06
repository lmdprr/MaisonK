/**
 * Papier peint pop de l'en-tête sans visuel : une grille de tuiles colorées
 * portant des silhouettes et le quadrilobe de la marque.
 *
 * Deux jeux d'objets sur la même grille, la même palette et le même tempo :
 * `mobilier` (ce qui a été livré, Réalisations) et `atelier` (les outils de
 * ce qui est proposé, Prestations). Le visiteur reconnaît la signature d'une
 * page à l'autre et lit l'orientation sans lire le titre.
 *
 * Chaque tuile a deux faces (un objet devant, un autre ou une fleur
 * derrière) : elle se retourne lentement à tour de rôle, comme si la pièce se
 * réaménageait d'elle-même, et immédiatement sous la souris. Les couleurs et
 * les objets sont tirés de l'index : le rendu est identique serveur et client.
 *
 * Le tempo, le retournement au survol et le fondu des bords sont dans
 * globals.css (`[data-pop]`) ; DecorRuntime lance l'animation à l'entrée dans
 * l'écran via `--mk-play`, comme les autres décors.
 */

import type { CSSProperties } from 'react'
import type { JeuMotif } from '@/lib/types'
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
type Vocabulaire = Record<string, Shape[]>

/*
 * Vocabulaire mobilier : ce qui a été livré. Chaque type de pièce des projets
 * (salon, séjour, chambre, cuisine, maison) a au moins un objet qui le nomme ;
 * plante, cadre et miroir sont transverses. La fleur reste en dernier : la
 * marche d'ordonnancement l'exclut et la place à intervalle fixe.
 */
const MOBILIER: Vocabulaire = {
  // Salon
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
  suspension: [
    { d: 'M48 10 h4 v26 h-4 z' },
    { d: 'M18 66 a32 32 0 0 1 64 0 z' },
    { d: 'M40 74 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 z', k: 'accent' },
  ],
  // Séjour : table à pied central, chaise de profil
  table: [
    { d: 'M12 40 h76 v8 h-76 z' },
    { d: 'M46 48 h8 v32 h-8 z' },
    { d: 'M28 86 a22 8 0 0 1 44 0 z' },
    { d: 'M36 30 h28 a14 10 0 0 1 -28 0 z', k: 'accent' },
  ],
  chaise: [
    { d: 'M28 12 h12 v44 h-12 z' },
    { d: 'M28 50 h44 v8 h-44 z' },
    { d: 'M32 58 h7 v30 h-7 z M63 58 h7 v30 h-7 z' },
    { d: 'M40 44 h30 v6 h-30 z', k: 'accent' },
  ],
  // Chambre
  lit: [
    { d: 'M18 54 v-32 a8 8 0 0 1 8 -8 h48 a8 8 0 0 1 8 8 v32 z' },
    { d: 'M12 54 h76 v18 h-76 z' },
    { d: 'M16 72 h8 v14 h-8 z M76 72 h8 v14 h-8 z' },
    { d: 'M26 40 h20 v10 h-20 z M54 40 h20 v10 h-20 z', k: 'accent' },
    { d: 'M12 60 h76 v3 h-76 z', k: 'bg' },
  ],
  // Cuisine : casserole à deux anses, couvercle posé
  casserole: [
    { d: 'M24 48 h52 v30 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 z' },
    { d: 'M22 42 h56 v6 h-56 z' },
    { d: 'M10 52 h14 v6 h-14 z M76 52 h14 v6 h-14 z' },
    { d: 'M45 32 h10 v10 h-10 z', k: 'accent' },
    { d: 'M24 64 h52 v4 h-52 z', k: 'bg' },
  ],
  // Maison : façade au toit débordant
  maison: [
    { d: 'M10 46 L50 12 L90 46 Z' },
    { d: 'M20 46 h60 v40 h-60 z' },
    { d: 'M44 62 h12 v24 h-12 z', k: 'accent' },
    { d: 'M28 54 h10 v10 h-10 z M62 54 h10 v10 h-10 z', k: 'bg' },
  ],
  // Transverses
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
  fleur: [{ d: FLOWER }],
}

/*
 * Vocabulaire atelier : les outils de ce qui est proposé. Deux objets par
 * prestation (plans, moodboard, 3D, home staging), trois outils transverses,
 * la fleur en dernier comme dans le mobilier. La maison filaire est le pendant
 * au trait de la façade pleine du mobilier : le projet dessiné, puis livré.
 */
const ATELIER: Vocabulaire = {
  // Plans & aménagement
  equerre: [
    { d: 'M14 86 L86 86 L14 14 Z' },
    { d: 'M32 72 L58 72 L32 46 Z', k: 'bg' },
    { d: 'M26 84 v-7 h4 v7 z M38 84 v-7 h4 v7 z M50 84 v-7 h4 v7 z M62 84 v-7 h4 v7 z', k: 'accent' },
  ],
  metre: [
    { d: 'M14 52 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0 z' },
    { d: 'M70 58 h14 v8 h-14 z M84 56 h4 v14 h-4 z' },
    { d: 'M30 52 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 z', k: 'bg' },
    { d: 'M38 52 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 z', k: 'accent' },
  ],
  plan: [
    { d: 'M14 30 h56 v40 h-56 z' },
    { d: 'M64 50 a10 20 0 1 0 20 0 a10 20 0 1 0 -20 0 z' },
    { d: 'M70 50 a4 11 0 1 0 8 0 a4 11 0 1 0 -8 0 z', k: 'bg' },
    { d: 'M22 40 h30 v4 h-30 z M22 50 h22 v4 h-22 z M22 60 h26 v4 h-26 z', k: 'accent' },
  ],
  // Moodboard & étude préparatoire
  nuancier: [
    { d: 'M43 22 h14 v56 h-14 z' },
    { d: 'M26 30 l13 -4 l16 52 l-13 4 z' },
    { d: 'M74 30 l-13 -4 l-16 52 l13 4 z', k: 'accent' },
    { d: 'M46 78 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 z', k: 'bg' },
  ],
  pinceau: [
    { d: 'M47 10 h6 v40 h-6 z' },
    { d: 'M34 60 h32 v18 l-4 8 h-24 l-4 -8 z' },
    { d: 'M36 50 h28 v10 h-28 z', k: 'accent' },
  ],
  // Modélisation 3D
  cube: [
    { d: 'M50 12 L84 31 L84 69 L50 88 L16 69 L16 31 Z' },
    { d: 'M50 19 L76 34 L50 49 L24 34 Z', k: 'bg' },
    { d: 'M53 54 L78 40 L78 66 L53 80 Z', k: 'accent' },
  ],
  maison_filaire: [
    { d: 'M50 14 L88 46 L78 46 L78 86 L22 86 L22 46 L12 46 Z' },
    { d: 'M30 50 h40 v36 h-40 z M50 24 L70 42 L30 42 Z', k: 'bg' },
    { d: 'M44 64 h12 v22 h-12 z M34 56 h8 v8 h-8 z', k: 'accent' },
  ],
  // Home staging & réalisation décorative
  cle: [
    { d: 'M14 50 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 z' },
    { d: 'M42 46 h46 v8 h-46 z' },
    { d: 'M24 50 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 z', k: 'bg' },
    { d: 'M72 54 h6 v9 h-6 z M82 54 h6 v12 h-6 z', k: 'accent' },
  ],
  coussin: [
    { d: 'M22 22 q28 -8 56 0 q8 28 0 56 q-28 8 -56 0 q-8 -28 0 -56 z' },
    { d: 'M45 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 z', k: 'accent' },
    { d: 'M28 48 h14 v4 h-14 z M58 48 h14 v4 h-14 z M48 28 h4 v14 h-4 z M48 58 h4 v14 h-4 z', k: 'bg' },
  ],
  // Transverses
  crayon: [
    { d: 'M26 72 L64 34 L76 46 L38 84 Z' },
    { d: 'M26 72 L20 88 L38 84 Z' },
    { d: 'M64 34 L72 26 L84 38 L76 46 Z', k: 'accent' },
  ],
  compas: [
    { d: 'M50 12 L32 84 L40 86 L50 46 L60 86 L68 84 Z' },
    { d: 'M43 20 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 z', k: 'accent' },
  ],
  fleur: [{ d: FLOWER }],
}

const JEUX: Record<JeuMotif, Vocabulaire> = { mobilier: MOBILIER, atelier: ATELIER }

/** Fond de tuile, encre de la silhouette, seconde couleur. Palette de la charte. */
const PALETTES: [string, string, string][] = [
  ['#c07454', '#edeae4', '#551020'],
  ['#8bc1a9', '#151515', '#edeae4'],
  ['#c08a96', '#551020', '#edeae4'],
  ['#551020', '#edeae4', '#c08a96'],
  ['#d7d0b4', '#551020', '#c07454'],
  ['#e6d9d3', '#c07454', '#551020'],
]

function Face({ shapes, palette, back }: { shapes: Shape[]; palette: number; back?: boolean }) {
  const [bg, ink, accent] = PALETTES[palette % PALETTES.length]
  const fill = { bg, accent, ink }
  return (
    <span data-face={back ? 'back' : 'front'} style={{ background: bg }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {shapes.map((s, i) => (
          <path key={i} d={s.d} fill={fill[s.k ?? 'ink']} fillRule="evenodd" />
        ))}
      </svg>
    </span>
  )
}

/**
 * Grille de tuiles. Le nombre est large (le conteneur masque le surplus) :
 * l'ordre des objets est une marche de pas 7 dans la liste, une fleur toutes
 * les cinq tuiles, pour qu'aucune colonne ne répète sa voisine. Le pas 7 est
 * premier avec les onze objets hors fleur de chaque jeu : tous apparaissent.
 */
export default function PopWallpaper({ jeu = 'mobilier', count = 60, className = '' }: { jeu?: JeuMotif; count?: number; className?: string }) {
  const objets = JEUX[jeu]
  const noms = Object.keys(objets)
  const n = noms.length - 1
  const tiles = Array.from({ length: count }, (_, i) => {
    const fleur = i % 5 === 3
    const front = fleur ? 'fleur' : noms[(i * 7) % n]
    const back = fleur ? noms[(i * 3 + 1) % n] : i % 3 === 1 ? 'fleur' : noms[(i * 7 + 4) % n]
    return { front, back, p1: (i * 5 + Math.floor(i / 7)) % PALETTES.length, p2: (i * 5 + Math.floor(i / 7) + 3) % PALETTES.length, delay: ((i * 37) % count) / count }
  })

  return (
    <span data-sketch="" data-pop="" data-jeu={jeu} aria-hidden="true" className={`block ${className}`.trim()}>
      {tiles.map((t, i) => (
        <span key={i} data-tile="" style={{ '--i': i, '--d': t.delay } as CSSProperties}>
          <span data-spin="">
            <span data-flip="">
              <Face shapes={objets[t.front]} palette={t.p1} />
              <Face shapes={objets[t.back]} palette={t.p2} back />
            </span>
          </span>
        </span>
      ))}
    </span>
  )
}
