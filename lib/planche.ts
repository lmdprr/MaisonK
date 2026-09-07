/**
 * Planche de teintes et matières.
 *
 * Bibliothèque fixe et utilitaires couleur partagés par l'encart de la page
 * Prestations et par le formulaire « Votre projet ». Les teintes sont une
 * palette curatée, nommée et regroupée par famille : la cliente choisit un
 * « Terracotta » ou un « Bleu lagon », pas une valeur HSL. Une couleur libre
 * reste possible pour qui a déjà une référence précise.
 *
 * Les textures des matières sont des dégradés CSS, pas des images : rien à
 * charger, rien à synchroniser.
 *
 * L'état de la planche est persisté en localStorage pour survivre à la
 * navigation entre les deux pages, voir `components/interactive/usePlanche.ts`.
 */

export interface PlancheItem {
  /** Stable pour la palette et les matières ; dérivé du hex pour une couleur libre. */
  id: string
  name: string
  /** Valeur CSS de `background` : couleur unie ou dégradé de texture. */
  bg: string
  /** Code hex pour les teintes ; absent pour les matières. */
  hex?: string
}

/** Quatre épingles : la planche les affiche sur une seule ligne. */
export const PLANCHE_MAX = 4
export const PLANCHE_STORAGE_KEY = 'mk-planche'

/** Famille de teintes de la palette, affichée comme un groupe de pastilles. */
export interface TintFamily {
  name: string
  items: PlancheItem[]
}

const tint = (id: string, name: string, hex: string): PlancheItem => ({ id: `t-${id}`, name, bg: hex, hex })

/**
 * Palette curatée : dix-huit teintes en quatre familles, dans l'esprit de la
 * charte (terracotta, sauge, bordeaux, rose poudré y figurent tels quels).
 * L'ordre est celui de l'affichage.
 */
export const TINT_FAMILIES: TintFamily[] = [
  {
    name: 'Terres',
    items: [
      tint('terracotta', 'Terracotta', '#C07454'),
      tint('argile', 'Argile', '#B58469'),
      tint('ocre', 'Ocre', '#C9964A'),
      tint('cannelle', 'Cannelle', '#8E5A3C'),
      tint('sable-chaud', 'Sable chaud', '#D8B98C'),
    ],
  },
  {
    name: 'Verts & bleus',
    items: [
      tint('sauge', 'Sauge', '#8BC1A9'),
      tint('olive', 'Olive', '#7A8450'),
      tint('vert-profond', 'Vert profond', '#3E5A47'),
      tint('bleu-lagon', 'Bleu lagon', '#4E8C8C'),
      tint('bleu-nuit', 'Bleu nuit', '#2F3E55'),
    ],
  },
  {
    name: 'Neutres',
    items: [
      tint('creme', 'Crème', '#EDEAE4'),
      tint('lin', 'Lin', '#D7D0B4'),
      tint('grege', 'Grège', '#B9AE9A'),
      tint('anthracite', 'Anthracite', '#3A3A3A'),
    ],
  },
  {
    name: 'Accents',
    items: [
      tint('bordeaux', 'Bordeaux', '#551020'),
      tint('rose-poudre', 'Rose poudré', '#E6D9D3'),
      tint('vieux-rose', 'Vieux rose', '#C08A96'),
      tint('prune', 'Prune', '#5E3A52'),
    ],
  },
]

export const MATERIALS: PlancheItem[] = [
  { id: 'chene', name: 'Chêne clair', bg: 'repeating-linear-gradient(95deg,#D8B98C 0 6px,#C9A674 6px 8px,#D2B183 8px 15px,#BE9A66 15px 16px)' },
  { id: 'noyer', name: 'Noyer', bg: 'repeating-linear-gradient(100deg,#6B4630 0 5px,#553521 5px 7px,#7A5238 7px 13px,#4B2E1B 13px 14px)' },
  { id: 'rotin', name: 'Rotin', bg: 'repeating-linear-gradient(45deg,#D9B77A 0 4px,#C39A55 4px 6px),repeating-linear-gradient(-45deg,rgba(255,255,255,.28) 0 4px,transparent 4px 6px)' },
  { id: 'lin', name: 'Lin naturel', bg: 'repeating-linear-gradient(0deg,#E3DCC9 0 2px,#D6CEB8 2px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 2px,transparent 2px 3px)' },
  { id: 'laiton', name: 'Laiton brossé', bg: 'linear-gradient(135deg,#B8924A,#E2C27A 35%,#A98038 60%,#D9B86C)' },
  { id: 'terrazzo', name: 'Terrazzo', bg: 'radial-gradient(circle at 20% 30%,#7A2E2E 0 4px,transparent 5px),radial-gradient(circle at 70% 60%,#5C6B4F 0 5px,transparent 6px),radial-gradient(circle at 45% 80%,#C07454 0 3px,transparent 4px),radial-gradient(circle at 80% 20%,#3a3a3a 0 3px,transparent 4px),#E8E2D6' },
  { id: 'travertin', name: 'Travertin', bg: 'repeating-linear-gradient(8deg,#E4D9C6 0 7px,#D7CAB3 7px 9px,#EAE1D0 9px 18px,#CFC1A8 18px 19px)' },
  { id: 'beton', name: 'Béton ciré', bg: 'radial-gradient(circle at 30% 40%,rgba(255,255,255,.18),transparent 55%),radial-gradient(circle at 75% 70%,rgba(0,0,0,.12),transparent 50%),#A9A59D' },
]

/** Inclinaison des épingles sur la planche, par position (effet « punaisé »). */
export const TILTS = ['rotate(-2deg)', 'rotate(1.5deg)', 'rotate(2deg)', 'rotate(-1deg)']

/**
 * Nom lisible d'une couleur libre, à partir de sa famille (par tranche de
 * teinte) et de sa clarté (« Terracotta doux », « Vert profond »). Les teintes
 * de la palette ont leur propre nom, celui-ci ne sert qu'au sélecteur libre.
 *
 * @param h teinte 0-360
 * @param s saturation 0-100
 * @param l clarté 0-100
 */
export function hueName(h: number, s: number, l: number): string {
  if (s < 10) return l < 30 ? 'Gris profond' : l > 75 ? 'Blanc cassé' : 'Gris'
  const fam =
    h < 15 || h >= 345 ? 'Rouge' : h < 45 ? 'Terracotta' : h < 70 ? 'Ocre' : h < 170 ? 'Vert' : h < 200 ? 'Céladon' : h < 260 ? 'Bleu' : h < 300 ? 'Violet' : 'Rose'
  const tone = l < 30 ? ' profond' : l > 65 ? ' pâle' : l > 50 ? ' doux' : ''
  return fam + tone
}

/** Pièce de planche pour une couleur libre `#RRGGBB` (entrée supposée valide). */
export function freeTint(hex: string): PlancheItem {
  const up = hex.toUpperCase()
  const { h, s, l } = hexToHsl(up)
  return { id: `hue-${up}`, name: hueName(h, s, l), bg: up, hex: up }
}

/** `#RRGGBB` vers HSL arrondi. L'entrée est supposée valide (validée par le composant). */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = d / (1 - Math.abs(2 * l - 1))
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** Résumé texte de la planche pour l'e-mail : « Terracotta (#C07454), Chêne clair ». */
export function plancheSummary(board: PlancheItem[]): string {
  return board.map((item) => (item.hex ? `${item.name} (${item.hex})` : item.name)).join(', ')
}
