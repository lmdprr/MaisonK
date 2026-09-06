import type { Icone, TypePiece } from '@/lib/types'

/**
 * Bibliothèque des croquis au trait, portée telle quelle depuis la maquette v2.
 * Un croquis est une liste d'éléments : traits (`d`) qui se dessinent dans
 * l'ordre des `delay`, ou aplats (`rect`) teintés après coup. Voir Sketch.tsx.
 */

export interface SketchStroke {
  d: string
  /** `T` terracotta, sinon bordeaux. */
  c?: 'T' | 'B'
  w?: number
  delay?: number
  /** Trait fantôme pointillé qui s'efface une fois le trait définitif tracé. */
  ghost?: boolean
}

export interface SketchRect {
  rect: [number, number, number, number]
  fill?: string
  tint?: number
  /** Aplat déjà en place (pas d'animation). */
  fixed?: boolean
  /** Aplat net qui balaie de gauche à droite ; sinon gribouillage. */
  crisp?: boolean
  delay?: number
}

export type SketchItem = SketchStroke | SketchRect

export const isRect = (item: SketchItem): item is SketchRect => 'rect' in item

/** Icônes 48 × 48 des eyebrows et des prestations. */
export const ICONS: Record<Exclude<Icone, 'aucune'>, SketchItem[]> = {
  fauteuil: [{ d: 'M10 26 v-9 q0 -7 7 -7 h14 q7 0 7 7 v9' }, { d: 'M6 26 h36 v10 h-36 z', delay: 0.25 }, { d: 'M11 36 v6 M37 36 v6', delay: 0.5, w: 1.3 }],
  plan: [{ d: 'M6 8 h36 v32 h-36 z' }, { d: 'M6 26 h14 v14 M26 26 h16 M26 26 v-6', delay: 0.3 }, { d: 'M20 26 q0 -6 6 -6', c: 'T', delay: 0.6, w: 1.3 }],
  plante: [
    { d: 'M16 41 h16 l-2 -11 h-12 z' },
    { d: 'M24 30 q-11 -14 -2 -23 M24 30 q11 -16 4 -25', c: 'T', delay: 0.3, w: 1.3 },
    { d: 'M24 30 q-2 -12 -13 -14', c: 'T', delay: 0.55, w: 1.3 },
  ],
  cadre: [{ d: 'M8 8 h32 v32 h-32 z' }, { d: 'M14 14 h20 v20 h-20 z', delay: 0.3, w: 1.2 }, { d: 'M16 32 l6 -8 l5 5 l4 -4 l3 7', c: 'T', delay: 0.6, w: 1.3 }],
}

/** Croquis de pièce 120 × 70 des fiches Réalisations, par `type_piece`. */
export const ROOMS: Record<TypePiece, SketchItem[]> = {
  salon: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M22 48 q0 -10 8 -10 h40 q8 0 8 10 M16 48 h68 v12 h-68 z', ghost: true, delay: 0.2 },
    { d: 'M40 12 h22 v16 h-22 z', c: 'T', ghost: true, delay: 0.6 },
  ],
  cuisine: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M14 36 h60 v26 h-60 z M44 36 v26 M14 49 h30', ghost: true, delay: 0.2 },
    { d: 'M82 62 v-40 h20 v40 M86 30 h12', ghost: true, delay: 0.5 },
    { d: 'M20 12 h48 v10 h-48 z', c: 'T', ghost: true, delay: 0.8 },
  ],
  chambre: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M20 40 h60 v22 h-60 z M20 40 v-16 h60 v16', ghost: true, delay: 0.2 },
    { d: 'M28 36 h18 v6 h-18 z', c: 'T', ghost: true, delay: 0.6 },
    { d: 'M92 62 v-22 M86 40 h12 l-2 -10 h-8 z', c: 'T', ghost: true, delay: 0.8 },
  ],
  sejour: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M28 42 h56 v4 h-56 z M34 46 v16 M78 46 v16', ghost: true, delay: 0.2 },
    { d: 'M14 62 v-20 h10 v20 M88 62 v-20 h10 v20', ghost: true, delay: 0.5 },
    { d: 'M56 6 v14 M46 20 h20 l4 8 h-28 z', c: 'T', ghost: true, delay: 0.8 },
  ],
  maison: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M18 62 v-30 l40 -22 l40 22 v30', ghost: true, delay: 0.2 },
    { d: 'M40 62 v-16 h36 v16', ghost: true, delay: 0.5 },
    { d: 'M84 46 h12 v-12', c: 'T', ghost: true, delay: 0.8, w: 1.3 },
  ],
  autre: [
    { d: 'M8 62 h104', w: 1.4 },
    { d: 'M20 62 v-40 h80 v40', ghost: true, delay: 0.2 },
    { d: 'M50 30 h20 v14 h-20 z', c: 'T', ghost: true, delay: 0.6 },
  ],
}

/** Salon du hero, 260 × 150 : mur, canapé, plante ; lampe et cadre sont animés à part. */
export const SALON_BASE: SketchItem[] = [
  { rect: [14, 14, 232, 114], fill: '#C07454', tint: 0.09, crisp: true, delay: 1.9 },
  { d: 'M8 128 Q130 125 252 129', w: 1.6 },
  { d: 'M64 96 q0 -14 12 -14 h76 q12 0 12 14', delay: 0.2 },
  { d: 'M54 96 h110 q4 0 4 4 v18 h-118 v-18 q0 -4 4 -4', delay: 0.35 },
  { d: 'M108 82 v14 M60 118 v8 M158 118 v8', delay: 0.55, w: 1.3 },
  { d: 'M40 124 h-16 l-2 -16 h20 z', delay: 0.5 },
  { d: 'M31 108 q-14 -20 -4 -32 M31 108 q13 -22 5 -34 M31 108 q1 -20 -12 -26', c: 'T', delay: 0.7, w: 1.3 },
]
export const SALON_LAMP: SketchItem[] = [{ d: 'M204 124 v-50 M190 124 h28', delay: 0.6 }, { d: 'M186 74 l8 -22 h20 l8 22 z', c: 'T', delay: 0.8 }]
export const SALON_FRAME: SketchItem[] = [{ d: 'M88 30 h48 v36 h-48 z', delay: 0.9 }, { d: 'M96 60 l12 -14 l10 10 l8 -8 l10 12', c: 'T', delay: 1.1, w: 1.3 }]
export const SALON_RAYS = ['M190 46 l-5 -7', 'M204 42 v-9', 'M218 46 l5 -7']

/** Plan d'aménagement 220 × 150, qui bascule en perspective une fois tracé. */
export const PLAN_FLAT: SketchItem[] = [
  { d: 'M20 22 h180 v106 h-180 z', w: 1.6 },
  { d: 'M112 22 v54 M112 100 v28', delay: 0.2 },
  { d: 'M112 76 q14 0 14 14', c: 'T', delay: 0.45, w: 1.2 },
  { d: 'M34 40 h48 v30 h-48 z M34 50 h48', delay: 0.5 },
  { d: 'M132 56 h44 v38 h-44 z', delay: 0.6 },
  { d: 'M34 96 h56 v18 h-56 z', delay: 0.7 },
  { d: 'M34 40 v-10 M82 40 v-10 M34 30 h48 M132 56 v-10 M176 56 v-10 M132 46 h44 M34 96 v-10 M90 96 v-10 M34 86 h56', c: 'T', delay: 1.9, w: 1.2 },
]

/** Quadrilobe (fleur) de la marque, 100 × 100. */
export const FLOWER = 'M50 50A50 50 0 0 1 0 0A50 50 0 0 1 50 50ZM50 50A50 50 0 0 1 100 0A50 50 0 0 1 50 50ZM50 50A50 50 0 0 1 100 100A50 50 0 0 1 50 50ZM50 50A50 50 0 0 1 0 100A50 50 0 0 1 50 50Z'

/** Couleurs des trois cartes « Pour qui » et de leur papier peint. */
export const CELL_COLORS = ['#C07454', '#B08A5A', '#5C6B4F']
export const CELL_WALLPAPERS = ['feuilles', 'arches', 'treillis'] as const
export type WallpaperKind = (typeof CELL_WALLPAPERS)[number]
