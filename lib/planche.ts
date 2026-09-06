/**
 * Planche de teintes et matières.
 *
 * Bibliothèque fixe et utilitaires couleur partagés par l'encart de la page
 * Prestations et par le formulaire « Votre projet ». Les textures des matières
 * sont des dégradés CSS, pas des images : rien à charger, rien à synchroniser.
 *
 * L'état de la planche est persisté en localStorage pour survivre à la
 * navigation entre les deux pages, voir `components/interactive/usePlanche.ts`.
 */

export interface PlancheItem {
  /** Stable pour les matières ; dérivé de la couleur HSL pour les teintes. */
  id: string
  name: string
  /** Valeur CSS de `background` : couleur unie ou dégradé de texture. */
  bg: string
  /** Code hex pour les teintes ; absent pour les matières. */
  hex?: string
}

/** Quatre épingles : la grille de la planche est en 2 × 2. */
export const PLANCHE_MAX = 4
export const PLANCHE_STORAGE_KEY = 'mk-planche'

export const MATERIALS: PlancheItem[] = [
  { id: 'chene', name: 'Chêne clair', bg: 'repeating-linear-gradient(95deg,#D8B98C 0 6px,#C9A674 6px 8px,#D2B183 8px 15px,#BE9A66 15px 16px)' },
  { id: 'noyer', name: 'Noyer', bg: 'repeating-linear-gradient(100deg,#6B4630 0 5px,#553521 5px 7px,#7A5238 7px 13px,#4B2E1B 13px 14px)' },
  { id: 'lin', name: 'Lin naturel', bg: 'repeating-linear-gradient(0deg,#E3DCC9 0 2px,#D6CEB8 2px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 2px,transparent 2px 3px)' },
  { id: 'laiton', name: 'Laiton brossé', bg: 'linear-gradient(135deg,#B8924A,#E2C27A 35%,#A98038 60%,#D9B86C)' },
  { id: 'terrazzo', name: 'Terrazzo', bg: 'radial-gradient(circle at 20% 30%,#7A2E2E 0 4px,transparent 5px),radial-gradient(circle at 70% 60%,#5C6B4F 0 5px,transparent 6px),radial-gradient(circle at 45% 80%,#C07454 0 3px,transparent 4px),radial-gradient(circle at 80% 20%,#3a3a3a 0 3px,transparent 4px),#E8E2D6' },
  { id: 'travertin', name: 'Travertin', bg: 'repeating-linear-gradient(8deg,#E4D9C6 0 7px,#D7CAB3 7px 9px,#EAE1D0 9px 18px,#CFC1A8 18px 19px)' },
]

/** Inclinaison des épingles sur la planche, par position (effet « punaisé »). */
export const TILTS = ['rotate(-2deg)', 'rotate(1.5deg)', 'rotate(2deg)', 'rotate(-1deg)']

/**
 * Nom lisible d'une teinte, à partir de sa famille (par tranche de teinte) et
 * de sa clarté (« Terracotta doux », « Vert profond »). Sert de libellé sur la
 * planche et dans l'e-mail.
 *
 * @param h teinte 0-360
 * @param l clarté 0-100
 */
export function hueName(h: number, l: number): string {
  const fam =
    h < 15 || h >= 345 ? 'Rouge' : h < 45 ? 'Terracotta' : h < 70 ? 'Ocre' : h < 160 ? 'Vert' : h < 200 ? 'Céladon' : h < 260 ? 'Bleu' : h < 300 ? 'Violet' : 'Rose'
  const tone = l < 30 ? ' profond' : l > 65 ? ' pâle' : l > 50 ? ' doux' : ''
  return fam + tone
}

/** HSL (0-360, 0-100, 0-100) vers `#RRGGBB` majuscules. */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
      .toUpperCase()
  )
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

/** Résumé texte de la planche pour l'e-mail : « Terracotta doux (#B5654A), Chêne clair ». */
export function plancheSummary(board: PlancheItem[]): string {
  return board.map((item) => (item.hex ? `${item.name} (${item.hex})` : item.name)).join(', ')
}
