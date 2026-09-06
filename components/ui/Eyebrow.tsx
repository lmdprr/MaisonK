import type { Icone } from '@/lib/types'
import { SketchIcon } from '@/components/decor/Sketches'

interface Props {
  children: string
  /** Filet de 28 px avant le texte (hero). */
  line?: boolean
  /** Icône croquis qui se dessine à l'entrée dans l'écran. Rien si `aucune`. */
  icone?: Icone
  className?: string
}

/** Petit texte capitales espacées au-dessus d'un titre. Styles dans globals.css (`.eyebrow`). */
export default function Eyebrow({ children, line = false, icone = 'aucune', className = '' }: Props) {
  return (
    <p className={`eyebrow ${className}`.trim()} data-line={line} data-icone={icone}>
      <SketchIcon name={icone} className="size-[26px]" />
      {children}
    </p>
  )
}
