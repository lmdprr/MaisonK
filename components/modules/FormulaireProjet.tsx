import type { Coordonnees, ModuleFormulaireProjet } from '@/lib/types'
import { resolveLien } from '@/lib/links'
import Section from '@/components/ui/Section'
import ProjetForm from '@/components/interactive/ProjetForm'
import Wall from '@/components/decor/Wall'

/**
 * `email_to` est volontairement absent des props : l'adresse destinataire est
 * chiffrée au pré-rendu (lib/formToken.ts) et n'existe côté client que sous
 * forme de jeton opaque, déchiffré par la server action.
 */
export type FormulaireProjetProps = Omit<ModuleFormulaireProjet, 'email_to'> & {
  level: 1 | 2
  pageSlug: string
  coordonnees: Coordonnees | null
  /** Adresse destinataire chiffrée au pré-rendu ; `null` si `FORM_TOKEN_SECRET` manque. */
  recipientToken: string | null
}

/**
 * Page « Votre projet ». Composant serveur : résout le lien de confirmation
 * (qui peut valoir `whatsapp`) et transmet la configuration. Tout l'interactif
 * vit dans `ProjetForm`.
 */
export default function FormulaireProjet({ coordonnees, confirmation, ...rest }: FormulaireProjetProps) {
  return (
    <Section module="formulaire_projet" fond="creme" padding="none" className="isolate overflow-hidden pt-section-sm pb-section">
      <Wall variant="seed" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" />
      <ProjetForm {...rest} confirmation={confirmation} confirmationLien={resolveLien(confirmation.lien, coordonnees)} />
    </Section>
  )
}
