import type { CSSProperties, ReactNode } from 'react'
import { isRect, type SketchItem, type SketchRect, type SketchStroke } from './sketch-data'

const B = '#551020'
const T = '#C07454'
const PLAY = 'var(--mk-play,paused)'

/** `name` sur une durée `dur` × --mk-dur, après un délai `delay` × --mk-dur. */
export const anim = (name: string, dur: number, delay: number, ease = 'ease') =>
  `${name} calc(var(--mk-dur,1s) * ${dur}) ${ease} calc(var(--mk-dur,1s) * ${delay}) forwards`

const vars = (style: Record<string, string | number>) => style as CSSProperties

function Stroke({ item, index }: { item: SketchStroke; index: number }) {
  const delay = item.delay ?? 0
  const path = (
    <path
      key={index}
      d={item.d}
      pathLength={1}
      style={{
        fill: 'none',
        stroke: item.c === 'T' ? T : B,
        strokeWidth: item.w ?? 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: 1,
        strokeDashoffset: 1,
        animation: anim('mk-draw', 1, delay, 'cubic-bezier(.45,0,.3,1)'),
        animationPlayState: PLAY,
      }}
    />
  )
  if (!item.ghost) return path
  return (
    <>
      <path
        d={item.d}
        pathLength={1}
        style={{
          fill: 'none',
          stroke: B,
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeDasharray: '.04 .03',
          opacity: 0.5,
          animation: anim('mk-ghost', 1, delay + 0.6),
          animationPlayState: PLAY,
        }}
      />
      {path}
    </>
  )
}

function Rect({ item }: { item: SketchRect }) {
  const [x, y, w, h] = item.rect
  const fill = item.fill ?? T
  const delay = item.delay ?? 1.6

  if (item.crisp) {
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        ry={10}
        style={{
          fill,
          opacity: item.tint ?? 0.2,
          transition: 'fill .5s',
          transformBox: 'fill-box',
          transformOrigin: 'left center',
          transform: 'scaleX(0)',
          animation: anim('mk-sweep', 1.1, delay, 'cubic-bezier(.6,0,.2,1)'),
          animationPlayState: PLAY,
        }}
      />
    )
  }

  // Gribouillage : zigzag de traits épais aux bords irréguliers
  const rows = 9
  const step = h / rows
  let d = ''
  for (let r = 0; r <= rows; r++) {
    const yy = y + r * step + Math.sin(r * 2.3) * 2
    const l = x - 4 + Math.sin(r * 1.7) * 6
    const rr = x + w + 4 + Math.cos(r * 2.1) * 6
    const a = r % 2 ? [rr, l] : [l, rr]
    d += (r ? ` Q${(a[0] + a[1]) / 2} ${yy + (r % 2 ? 3 : -3)} ` : `M${a[0]} ${yy} L`) + `${a[1]} ${yy}`
  }
  const style: CSSProperties = {
    fill: 'none',
    stroke: fill,
    strokeWidth: step * 1.15,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    opacity: item.tint ?? 0.2,
    transition: 'stroke .5s',
  }
  if (!item.fixed) {
    Object.assign(style, {
      strokeDasharray: 1,
      strokeDashoffset: 1,
      animation: anim('mk-draw', 1.4, delay, 'ease-out'),
      animationPlayState: PLAY,
    })
  }
  return <path d={d} pathLength={1} style={style} />
}

/** Rend une liste d'éléments de croquis (sans balise svg). */
export function SketchItems({ items }: { items: SketchItem[] }) {
  return (
    <>
      {items.map((item, i) => (isRect(item) ? <Rect key={i} item={item} /> : <Stroke key={i} item={item} index={i} />))}
    </>
  )
}

interface SketchProps {
  viewBox: string
  items: SketchItem[]
  children?: ReactNode
  style?: CSSProperties
  className?: string
}

/**
 * Croquis au trait. Les animations restent en pause (`--mk-play: paused`)
 * jusqu'à ce que DecorRuntime passe l'ancêtre `[data-sketch]` à `running`
 * quand il entre dans l'écran. Le filtre crayon (#mk-pencil) est déclaré une
 * fois dans le layout du site.
 */
export default function Sketch({ viewBox, items, children, style, className }: SketchProps) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" className={className} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', filter: 'url(#mk-pencil)', ...style }}>
      <SketchItems items={items} />
      {children}
    </svg>
  )
}

/** Groupe qui glisse vers sa position finale une fois tracé (cadre et lampe du hero). */
export function MoveGroup({ from, delay, children }: { from: string; delay: number; children: ReactNode }) {
  return (
    <g style={vars({ transform: from, transformBox: 'fill-box', transformOrigin: 'center', animation: anim('mk-move', 1, delay, 'cubic-bezier(.5,0,.2,1)'), animationPlayState: PLAY })}>
      {children}
    </g>
  )
}
