import { redirect } from 'next/navigation'
import { HOME_SLUG } from '@/lib/keystatic'

/**
 * `/` redirige vers la page d'accueil éditable (`/accueil`).
 *
 * On garde une seule route de rendu (`[slug]`) plutôt qu'un cas particulier
 * pour la racine : l'accueil est une page Keystatic comme les autres.
 */
export default function RootPage() {
  redirect(`/${HOME_SLUG}`)
}
