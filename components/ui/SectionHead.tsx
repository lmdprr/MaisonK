import type { Coordonnees, EnTeteSection } from '@/lib/types'
import { resolveLien } from '@/lib/links'
import Heading from './Heading'
import Eyebrow from './Eyebrow'
import ArrowLink from './ArrowLink'

interface Props {
  data: EnTeteSection
  level: 1 | 2
  coordonnees: Coordonnees | null
  /** Marge sous la tête (désactivée quand le module gère lui-même l'espace). */
  spaced?: boolean
  className?: string
}

/**
 * Tête de section partagée : eyebrow (+ icône croquis), titre, intro, lien fléché.
 *
 * Trois dispositions, choisies par le contenu et non par un champ :
 * - intro présente : deux colonnes alignées en bas, l'intro à droite ;
 * - lien présent : titre à gauche, lien à droite ;
 * - sinon, titre seul.
 *
 * Ne rend rien si tout est vide (bandeau de villes), pour ne pas laisser une
 * marge orpheline.
 */
export default function SectionHead({ data, level, coordonnees, spaced = true, className = '' }: Props) {
  const lien = resolveLien(data.lien, coordonnees)
  if (!data.eyebrow && !data.titre && !data.intro && !lien) return null

  const margin = spaced ? 'mb-head' : ''
  const titre = (
    <div className="flex flex-col gap-[18px]">
      {data.eyebrow && <Eyebrow icone={data.icone}>{data.eyebrow}</Eyebrow>}
      {data.titre && <Heading level={level}>{data.titre}</Heading>}
    </div>
  )

  if (data.intro) {
    return (
      <div data-component="SectionHead" data-reveal="" className={`grid items-end gap-[clamp(32px,5vw,80px)] md:grid-cols-2 ${margin} ${className}`.trim()}>
        {titre}
        <div className="flex flex-col gap-5">
          <p className="lead max-w-[48ch]">{data.intro}</p>
          {lien && <ArrowLink {...lien} />}
        </div>
      </div>
    )
  }

  return (
    <div data-component="SectionHead" data-reveal="" className={`flex flex-wrap items-end justify-between gap-6 ${margin} ${className}`.trim()}>
      {titre}
      {lien && <ArrowLink {...lien} className="mb-2" />}
    </div>
  )
}
