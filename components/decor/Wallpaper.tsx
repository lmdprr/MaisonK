import type { WallpaperKind } from './sketch-data'

/** Taille d'une tuile et dimensions de la grille, en unités du viewBox. */
const T = 56
const COLS = 9
const ROWS = 7

/** Motif d'une tuile, en coordonnées absolues (origine de la tuile en paramètre). */
const SHAPES: Record<WallpaperKind, (x: number, y: number) => string> = {
  feuilles: (x, y) => `M${x + 10} ${y + 46} q14 -34 32 -36 q-4 24 -32 36 M${x + 10} ${y + 46} q12 -14 26 -24`,
  arches: (x, y) => `M${x} ${y + T} q28 -44 56 0 M${x + 12} ${y + T} q16 -24 32 0`,
  treillis: (x, y) => `M${x} ${y + 28} l28 -28 l28 28 l-28 28 z M${x + 20} ${y + 28} l8 -8 l8 8 l-8 8 z`,
}

/**
 * Papier peint au trait des cartes « Pour qui ». Contrairement aux croquis, il
 * ne dépend pas de DecorRuntime : il se dessine au survol de la carte via la
 * règle CSS `[data-wallpaper]:hover { --mk-play: running }`, en diagonale
 * depuis le coin haut gauche.
 */
export default function Wallpaper({ kind, color }: { kind: WallpaperKind; color: string }) {
  const tiles: { d: string; delay: number }[] = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      // Les arches sont posées en quinconce.
      const off = kind === 'arches' && r % 2 ? T / 2 : 0
      tiles.push({ d: SHAPES[kind](c * T + off - T / 2, r * T), delay: (r + c) * 0.09 })
    }

  return (
    <svg viewBox={`0 0 ${COLS * T - T} ${ROWS * T}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full" style={{ filter: 'url(#mk-pencil)' }}>
      {tiles.map((t, i) => (
        <path
          key={i}
          d={t.d}
          pathLength={1}
          style={{
            fill: 'none',
            stroke: color,
            strokeWidth: 1.1,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 0.42,
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: `mk-draw 1.1s cubic-bezier(.45,0,.3,1) ${t.delay.toFixed(2)}s forwards`,
            animationPlayState: 'var(--mk-play,paused)',
          }}
        />
      ))}
    </svg>
  )
}
