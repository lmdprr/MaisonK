import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPageBySlug, getPublishedPageSlugs, getCoordonnees } from '@/lib/keystatic'
import ModuleRenderer from '@/components/modules/ModuleRenderer'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Le contenu vit dans le dépôt : l'ensemble des pages est connu au build.
 *
 * `dynamicParams = false` garantit qu'aucune requête n'atteint le serveur pour
 * un slug inconnu (404 direct). Indispensable sur Workers, où le reader
 * Keystatic (système de fichiers) n'existe pas à l'exécution.
 */
export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getPublishedPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * Métadonnées SEO depuis les champs `seo_*` de la page. L'URL canonique
 * retombe sur le domaine de production si l'éditeur n'en a pas saisi.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}

  return {
    title: page.seo_title || page.title,
    description: page.seo_description ?? undefined,
    robots: page.seo_no_index ? 'noindex' : 'index,follow',
    alternates: {
      canonical: page.canonical_url || `https://maisonk.fr/${page.slug}`,
    },
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description ?? undefined,
      images: page.seo_image ? [page.seo_image] : [],
    },
  }
}

/**
 * Rendu d'une page : la liste ordonnée de ses modules. Coordonnées est lu une
 * fois ici et transmis à chaque module (liens WhatsApp, villes, cartes contact).
 */
export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const [page, coordonnees] = await Promise.all([getPageBySlug(slug), getCoordonnees()])

  if (!page) notFound()

  return (
    <>
      {page.modules.map((mod, index) => (
        <ModuleRenderer key={index} module={mod} index={index} pageSlug={page.slug} coordonnees={coordonnees} />
      ))}
    </>
  )
}
