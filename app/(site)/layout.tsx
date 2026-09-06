import { getHeader, getFooter, getCoordonnees } from '@/lib/keystatic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PencilFilter from '@/components/decor/PencilFilter'
import DecorRuntime from '@/components/decor/DecorRuntime'

/**
 * Habillage du site public : en-tête, pied de page, filtre SVG des croquis et
 * runtime des animations.
 *
 * Les routes de ce groupe sont toutes pré-rendues : la lecture des singletons
 * Keystatic n'a lieu qu'au build. `DecorRuntime` est le seul composant client
 * monté ici ; il observe le DOM, ce qui laisse les modules en composants serveur.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [header, footer, coordonnees] = await Promise.all([getHeader(), getFooter(), getCoordonnees()])

  return (
    <>
      <PencilFilter />
      <Header data={header} coordonnees={coordonnees} />
      <main className="flex-1">{children}</main>
      <Footer data={footer} header={header} coordonnees={coordonnees} />
      <DecorRuntime />
    </>
  )
}
