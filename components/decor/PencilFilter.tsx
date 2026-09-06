/**
 * Filtre SVG « crayon » : un léger déplacement par bruit fractal donne aux
 * traits nets des croquis et papiers peints un rendu tracé à la main.
 *
 * Déclaré une seule fois dans le layout du site ; les SVG y font référence
 * par `filter: url(#mk-pencil)`.
 */
export default function PencilFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="mk-pencil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
