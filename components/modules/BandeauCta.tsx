import type { Coordonnees, ModuleBandeauCta } from '@/lib/types'
import { resolveLien } from '@/lib/links'
import Section from '@/components/ui/Section'
import Heading from '@/components/ui/Heading'
import PaintButton from '@/components/ui/PaintButton'
import Wall from '@/components/decor/Wall'

type Props = ModuleBandeauCta & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Bandeau d'appel à l'action en bas de page. Titre sur deux lignes (la seconde
 * en italique accent), texte, bouton rouleau. Une bande de quadrilobes habille
 * la droite, masquée en dégradé pour ne pas passer sous le texte.
 */
export default function BandeauCta({ titre, titre_accent, texte, cta, fond, level, coordonnees }: Props) {
  const bouton = resolveLien(cta, coordonnees)

  return (
    <Section module="bandeau_cta" fond={fond} className="isolate overflow-hidden">
      <Wall
        variant="band"
        className="pointer-events-none absolute inset-x-0 -inset-y-6 -z-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent_40%,#000_75%)]"
      />
      <div data-reveal="" className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Heading level={level} className="text-[clamp(38px,5vw,80px)] leading-none tracking-[-.015em]">
            {titre}
            {titre_accent && (
              <>
                <br />
                <em>{titre_accent}</em>
              </>
            )}
          </Heading>
          {texte && <p className="lead mt-6 max-w-[46ch]">{texte}</p>}
        </div>
        {bouton && <PaintButton {...bouton} size="lg" />}
      </div>
    </Section>
  )
}
