import type { Icone, TypePiece } from '@/lib/types'
import Sketch, { MoveGroup, SketchItems, anim } from './Sketch'
import { ICONS, PLAN_FLAT, ROOMS, SALON_BASE, SALON_FRAME, SALON_LAMP, SALON_RAYS } from './sketch-data'

const PLAY = 'var(--mk-play,paused)'

/** Icône croquis 48 × 48 (fauteuil, plan, plante, cadre). Rien si `aucune`. */
export function SketchIcon({ name, className = '' }: { name: Icone; className?: string }) {
  if (name === 'aucune') return null
  return (
    <span data-sketch="" className={`inline-flex shrink-0 ${className}`.trim()}>
      <Sketch viewBox="0 0 48 48" items={ICONS[name]} />
    </span>
  )
}

/** Croquis de pièce des fiches Réalisations, 120 × 70. */
export function RoomSketch({ kind, className = '' }: { kind: TypePiece; className?: string }) {
  return (
    <span data-sketch="" className={`block ${className}`.trim()}>
      <Sketch viewBox="0 0 120 70" items={ROOMS[kind] ?? ROOMS.autre} />
    </span>
  )
}

/**
 * Salon du hero : le mur se teinte, le cadre et la lampe glissent en place,
 * puis trois rayons se dessinent au-dessus de la lampe et rebondissent.
 */
export function HeroSketch() {
  return (
    <Sketch viewBox="0 0 260 150" items={SALON_BASE}>
      <MoveGroup from="translate(-26px,-8px) rotate(-4deg)" delay={1.5}>
        <SketchItems items={SALON_FRAME} />
      </MoveGroup>
      <MoveGroup from="translate(22px,0)" delay={1.55}>
        <SketchItems items={SALON_LAMP} />
      </MoveGroup>
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', animation: anim('mk-bounce', 0.6, 3.75, 'cubic-bezier(.3,0,.2,1)'), animationPlayState: PLAY }}>
        {SALON_RAYS.map((d, k) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            style={{ fill: 'none', stroke: '#C07454', strokeWidth: 1.5, strokeLinecap: 'round', strokeDasharray: 1, strokeDashoffset: 1, animation: anim('mk-draw', 0.3, 2.9 + k * 0.25, 'ease-out'), animationPlayState: PLAY }}
          />
        ))}
      </g>
    </Sketch>
  )
}

/** Plan d'aménagement qui bascule en perspective : « la projection rend la décision concrète ». */
export function PlanSketch() {
  return (
    <Sketch
      viewBox="0 0 220 150"
      items={PLAN_FLAT}
      style={{ transformOrigin: '50% 70%', animation: anim('mk-tilt', 1, 1.2, 'cubic-bezier(.5,0,.2,1)'), animationPlayState: PLAY }}
    />
  )
}
