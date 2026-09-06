import type { Coordonnees, ModuleHero } from '@/lib/types'
import { resolveLien } from '@/lib/links'
import Section from '@/components/ui/Section'
import HeroSlides from '@/components/interactive/HeroSlides'

type Props = ModuleHero & { coordonnees: Coordonnees | null }

/**
 * Premier écran de l'accueil. Rend toujours un h1 : ce module n'a de sens
 * qu'en tête de page, il ne reçoit donc pas `level`.
 *
 * Composant serveur : résout les liens (WhatsApp depuis Coordonnées) et
 * délègue le diaporama à `HeroSlides` (client).
 */
export default function Hero({ eyebrow, titre, texte, cta, citation, lien, slides, defilement_auto, coordonnees }: Props) {
  return (
    <Section module="hero" fond="creme" padding="none">
      <HeroSlides
        eyebrow={eyebrow}
        titre={titre}
        texte={texte}
        bouton={resolveLien(cta, coordonnees)}
        citation={citation}
        lien={resolveLien(lien, coordonnees)}
        slides={slides}
        autoplay={defilement_auto}
      />
    </Section>
  )
}
