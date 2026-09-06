import { DocumentRenderer } from '@keystatic/core/renderer'
import type { ModuleTexte } from '@/lib/types'
import Section from '@/components/ui/Section'
import type { ContainerProps } from '@/components/ui/Container'

/** Le champ `largeur` de l'admin parle en mots ; le Container en tailles. */
const LARGEUR_TO_CONTAINER: Record<ModuleTexte['largeur'], ContainerProps['size']> = {
  etroit: 'narrow',
  moyen: 'medium',
  pleine: 'full',
}

/**
 * Texte riche (mentions légales, pages libres).
 *
 * `fields.document` renvoie un arbre structuré rendu par `DocumentRenderer`,
 * jamais du HTML : aucun assainissement nécessaire. C'est important sur
 * Workers, où les bibliothèques à base de jsdom ne tournent pas.
 */
export default function Texte({ contenu, largeur }: ModuleTexte) {
  return (
    <Section module="texte" fond="creme" size={LARGEUR_TO_CONTAINER[largeur] ?? 'narrow'} padding="tight" className="pb-section">
      <div data-largeur={largeur} className="prose-mk">
        <DocumentRenderer document={(contenu ?? []) as Parameters<typeof DocumentRenderer>[0]['document']} />
      </div>
    </Section>
  )
}
