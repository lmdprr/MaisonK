import type { Coordonnees, ModuleZoneIntervention } from '@/lib/types'
import Section from '@/components/ui/Section'
import SectionHead from '@/components/ui/SectionHead'
import Pill from '@/components/ui/Pill'
import { Flower } from '@/components/decor/Wall'

type Props = ModuleZoneIntervention & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Villes lues dans Coordonnées (une seule source). Bandeau défilant sur l'accueil,
 * nuage de pastilles sur À propos. Le séparateur floral SVG remplacera ✦ à l'étape décor.
 */
export default function ZoneIntervention({ en_tete, affichage, fond, level, coordonnees }: Props) {
  const villes = coordonnees?.villes ?? []
  if (villes.length === 0) return null

  if (affichage === 'defilant') {
    const sep = <Flower className="mx-5 inline-block size-3 align-middle" />
    const bande = (
      <span className="pr-2">
        {villes.map((ville) => (
          <span key={ville}>
            {ville}
            {sep}
          </span>
        ))}
        <em>Toute l’île</em>
        {sep}
      </span>
    )

    return (
      <Section module="zone_intervention" fond={fond} size="bleed" padding="none" className="overflow-hidden border-y border-(--line) py-[18px]">
        <div className="marquee whitespace-nowrap font-serif text-[22px] text-bordeaux" aria-label={villes.join(', ')}>
          {bande}
          <span aria-hidden="true">{bande}</span>
        </div>
      </Section>
    )
  }

  return (
    <Section module="zone_intervention" fond={fond}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-center gap-[clamp(24px,4vw,64px)]">
        <SectionHead data={en_tete} level={level} coordonnees={coordonnees} spaced={false} className="!grid-cols-1 !gap-[22px]" />
        <ul className="flex flex-wrap gap-2.5">
          {villes.map((ville) => (
            <li key={ville}>
              <Pill>{ville}</Pill>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
