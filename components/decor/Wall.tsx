/**
 * Quadrilobe de la marque et papiers peints qui en sont composés.
 *
 * Le quadrilobe remplace toute coche ou puce sur le site (livrables, note de
 * fin de grille, séparateur du bandeau de villes).
 */

import type { CSSProperties } from 'react'
import { FLOWER } from './sketch-data'

const PLAY = 'var(--mk-play,paused)'

/** Éclosion d'une fleur, décalée de `delay` × `--mk-dur`. */
const bloom = (delay: number): CSSProperties => ({
  transformOrigin: '50% 50%',
  transformBox: 'fill-box',
  animation: `mk-bloom calc(var(--mk-dur,1s) * .9) cubic-bezier(.2,.7,.2,1) calc(var(--mk-dur,1s) * ${delay.toFixed(2)}) forwards`,
  animationPlayState: PLAY,
})

/** Quadrilobe seul, statique (puces, séparateur du bandeau de villes). */
export function Flower({ color = '#B9878F', className = '', style }: { color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} style={style}>
      <path d={FLOWER} fill={color} />
    </svg>
  )
}

/** Fleur qui éclot à l'entrée dans l'écran (aperçu Prestations, coin haut droit). */
export function BloomFlower({ className = '' }: { className?: string }) {
  return (
    <span data-sketch="" className={`block ${className}`.trim()}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full">
        <path d={FLOWER} fill="#B9878F" style={{ ...bloom(0), animation: `mk-bloom calc(var(--mk-dur,1s) * 1.2) cubic-bezier(.2,.7,.2,1) forwards` }} />
      </svg>
    </span>
  )
}

/**
 * Fleur d'angle des sections (aperçu Prestations, galerie) : déborde du coin
 * haut droit, derrière le contenu. La section appelante doit être `isolate`
 * et `overflow-hidden` pour que le `-z-10` reste dans la section et que le
 * débordement soit rogné.
 */
export function CornerBloom({ className = '' }: { className?: string }) {
  return (
    <BloomFlower
      className={`pointer-events-none absolute -right-[clamp(30px,6vw,70px)] -top-[clamp(30px,6vw,70px)] -z-10 size-[clamp(180px,22vw,320px)] opacity-[.32] ${className}`.trim()}
    />
  )
}

type Variant = 'full' | 'edge' | 'seed' | 'corner' | 'band' | 'marge'

/**
 * Papier peint de quadrilobes. Variantes, assignées par les modules :
 * - `edge`  : frise le long d'un bord, effilochée (bloc Carole) ;
 * - `seed`  : quelques fleurs solitaires au contour tracé (Contact, Votre projet) ;
 * - `corner`: médaillon dense dans un coin (en-tête À propos) ;
 * - `band`  : bande de deux rangs (bandeau CTA) ;
 * - `marge` : semis vertical au contour tracé pour les marges latérales des
 *   grands écrans (galerie) ; cadré par la largeur, il habille le haut de la section ;
 * - `full`  : mur complet (non utilisé à ce jour, gardé pour une future page).
 *
 * Positions et couleurs sont déterministes (indices, pas d'aléatoire) : le
 * SVG doit être identique au serveur et au client. Chaque fleur éclot avec un
 * léger décalage quand DecorRuntime lance l'animation.
 */
export default function Wall({ variant = 'full', opacity, className = '' }: { variant?: Variant; opacity?: number; className?: string }) {
  const S = 100
  const flowers: { x: number; y: number; color: string; delay: number; stroke?: boolean; extra?: string }[] = []
  let viewBox = ''
  let par = 'xMidYMid slice'
  let alpha = opacity

  if (variant === 'full' || variant === 'band') {
    const cols = variant === 'band' ? 14 : 16
    const rows = variant === 'band' ? 2 : 12
    const cs = ['#B9878F', '#B9878F', '#C07454', '#B9878F', '#8BC1A9', '#B9878F', '#C07454']
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) flowers.push({ x: i * S, y: j * S, color: cs[(i * 3 + j * 5 + (j % 2)) % cs.length], delay: (i + j) * 0.05 })
    viewBox = `0 0 ${cols * S} ${rows * S}`
    if (variant === 'band') par = 'xMaxYMid slice'
    alpha ??= 0.2
  } else if (variant === 'edge') {
    const rows = 3
    const cols = 30
    const cs = ['#B9878F', '#B9878F', '#C07454', '#B9878F', '#8BC1A9']
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        if (j === rows - 1 && (i * 7) % 3 === 0) continue // trous dans le dernier rang : bord effiloché
        flowers.push({ x: i * S, y: j * S, color: cs[(i * 3 + j * 5) % cs.length], delay: i * 0.03 + j * 0.1 })
      }
    viewBox = `0 0 ${cols * S} ${rows * S}`
    par = 'xMinYMin slice'
    alpha ??= 0.18
  } else if (variant === 'seed') {
    const pts: [number, number, number][] = [[6, 12, 1], [22, 78, 0.7], [48, 30, 0.5], [70, 88, 0.9], [88, 18, 0.6], [93, 60, 0.45], [35, 55, 0.35], [60, 8, 0.4], [12, 45, 0.5], [80, 42, 0.35]]
    pts.forEach(([x, y, s], i) =>
      flowers.push({ x: x * 10, y: y * 6, color: i % 3 === 2 ? '#C07454' : '#B9878F', delay: i * 0.12, stroke: true, extra: `scale(${s * 0.7}) rotate(${(i * 37) % 40 - 20})` })
    )
    viewBox = '0 0 1000 600'
    alpha ??= 0.35
  } else if (variant === 'marge') {
    const pts: [number, number, number][] = [[62, 6, 0.9], [22, 20, 0.5], [78, 34, 0.6], [30, 50, 1], [70, 66, 0.45], [18, 80, 0.7], [64, 94, 0.55]]
    pts.forEach(([x, y, s], i) =>
      flowers.push({ x: x * 3, y: y * 12, color: i % 3 === 1 ? '#C07454' : '#B9878F', delay: i * 0.14, stroke: true, extra: `scale(${s * 0.6}) rotate(${(i * 41) % 40 - 20})` })
    )
    viewBox = '0 0 300 1200'
    par = 'xMidYMin meet'
    alpha ??= 0.35
  } else {
    const n = 6
    const cs = ['#B9878F', '#C07454', '#B9878F', '#8BC1A9', '#B9878F']
    for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) flowers.push({ x: i * S, y: j * S, color: cs[(i + j * 2) % cs.length], delay: (i + j) * 0.08 })
    viewBox = `0 0 ${n * S} ${n * S}`
    par = 'xMinYMin meet'
    alpha ??= 0.22
  }

  return (
    <span data-sketch="" aria-hidden="true" className={`block ${className}`.trim()}>
      <svg viewBox={viewBox} preserveAspectRatio={par} className="block size-full" style={{ opacity: alpha }}>
        {flowers.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y})${f.extra ? ' ' + f.extra : ''}`}>
            <path d={FLOWER} fill={f.stroke ? 'none' : f.color} stroke={f.stroke ? f.color : undefined} strokeWidth={f.stroke ? 3 : undefined} strokeLinejoin="round" style={bloom(f.delay)} />
          </g>
        ))}
      </svg>
    </span>
  )
}
