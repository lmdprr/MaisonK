import type { Coordonnees, PageModule } from '@/lib/types'
import { encryptRecipient } from '@/lib/formToken'
import Hero from './Hero'
import Intro from './Intro'
import GrillePoints from './GrillePoints'
import Prestations from './Prestations'
import Galerie from './Galerie'
import ZoneIntervention from './ZoneIntervention'
import BandeauCta from './BandeauCta'
import FormulaireProjet from './FormulaireProjet'
import Texte from './Texte'

interface Props {
  module: PageModule
  /** Position dans la page : le premier module rend un h1, les suivants un h2. */
  index: number
  /** Slug de la page courante — repris dans le sujet de l'email du formulaire. */
  pageSlug: string
  /** Singleton Coordonnées, lu une fois par page et transmis à chaque module. */
  coordonnees: Coordonnees | null
}

export default async function ModuleRenderer({ module, index, pageSlug, coordonnees }: Props) {
  const level = index === 0 ? 1 : 2

  switch (module.discriminant) {
    case 'hero':              return <Hero {...module.value} coordonnees={coordonnees} />
    case 'intro':             return <Intro {...module.value} level={level} coordonnees={coordonnees} />
    case 'grille_points':     return <GrillePoints {...module.value} level={level} coordonnees={coordonnees} />
    case 'prestations':       return <Prestations {...module.value} level={level} coordonnees={coordonnees} />
    case 'galerie':           return <Galerie {...module.value} level={level} coordonnees={coordonnees} />
    case 'zone_intervention': return <ZoneIntervention {...module.value} level={level} coordonnees={coordonnees} />
    case 'bandeau_cta':       return <BandeauCta {...module.value} level={level} coordonnees={coordonnees} />
    case 'formulaire_projet': {
      // `email_to` ne franchit jamais la frontière serveur → client : il est
      // retiré des props et remplacé par un jeton chiffré.
      const { email_to, ...publicProps } = module.value
      const recipientToken = await encryptRecipient(email_to)

      return (
        <FormulaireProjet
          {...publicProps}
          level={level}
          pageSlug={pageSlug}
          coordonnees={coordonnees}
          recipientToken={recipientToken}
        />
      )
    }
    case 'texte':             return <Texte {...module.value} />
    default:                  return null
  }
}
