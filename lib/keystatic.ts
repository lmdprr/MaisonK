/**
 * Accès en lecture au contenu Keystatic.
 *
 * Le reader lit `content/` sur le disque : il ne fonctionne qu'au build (et en
 * dev). Aucune de ces fonctions ne doit être appelée depuis une route dynamique
 * ou une server action, il n'y a pas de système de fichiers sur Workers.
 *
 * Toutes les fonctions absorbent les erreurs et renvoient une valeur vide :
 * un YAML cassé ne doit pas faire échouer tout le build, seulement la page
 * concernée (qui passe en 404, avec la cause dans les logs).
 */

import { createReader } from '@keystatic/core/reader'
import keystaticConfig, { HOME_SLUG } from '../keystatic.config'
import type { Page, Header, Footer, Coordonnees, Projet, Prestation } from './types'

export { HOME_SLUG }

const reader = createReader(process.cwd(), keystaticConfig)

// ── Pages ──

/**
 * Page publiée par slug.
 *
 * @returns la page, ou `null` si elle n'existe pas, n'est pas publiée ou est illisible.
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const raw = await reader.collections.pages.read(slug, { resolveLinkedFiles: true })
    if (!raw || raw.status !== 'published') return null
    // Cast direct : le schéma Keystatic garantit la structure, lib/types.ts en
    // est la transcription manuelle (à tenir à jour ensemble).
    return { ...raw, slug } as unknown as Page
  } catch (err) {
    // Champ manquant ou valeur hors schéma : on trace pour ne pas chercher
    // un 404 à l'aveugle.
    console.error(`[keystatic] page « ${slug} » illisible :`, err instanceof Error ? err.message : err)
    return null
  }
}

export async function getAllPageSlugs(): Promise<string[]> {
  try {
    const slugs = await reader.collections.pages.list()
    return [...slugs]
  } catch {
    return []
  }
}

/** Slugs des pages publiées uniquement : c'est la base de `generateStaticParams`. */
export async function getPublishedPageSlugs(): Promise<string[]> {
  const slugs = await getAllPageSlugs()
  const pages = await Promise.all(slugs.map((slug) => getPageBySlug(slug)))
  return pages.flatMap((page) => (page ? [page.slug] : []))
}

// ── Collections ──

/** Tri par champ `ordre`, puis par titre pour rendre l'ordre stable à `ordre` égal. */
function byOrdre<T extends { ordre: number; titre: string }>(a: T, b: T): number {
  return a.ordre - b.ordre || a.titre.localeCompare(b.titre, 'fr')
}

/**
 * Projets de la collection Réalisations.
 *
 * @param slugs sélection explicite (module galerie). Si fournie et non vide,
 * seuls ces projets sont renvoyés, dans l'ordre demandé (celui choisi par
 * l'éditeur). Sinon, tous les projets triés par `ordre`.
 */
export async function getProjets(slugs?: (string | null)[]): Promise<Projet[]> {
  try {
    const all = await reader.collections.projets.all()
    const projets = all.map(({ slug, entry }) => ({ ...entry, slug }) as unknown as Projet)
    return pickBySlugs(projets, slugs).sort(slugs?.length ? () => 0 : byOrdre)
  } catch {
    return []
  }
}

/** Même contrat que {@link getProjets}, pour la collection Prestations. */
export async function getPrestations(slugs?: (string | null)[]): Promise<Prestation[]> {
  try {
    const all = await reader.collections.prestations.all()
    const prestations = all.map(({ slug, entry }) => ({ ...entry, slug }) as unknown as Prestation)
    return pickBySlugs(prestations, slugs).sort(slugs?.length ? () => 0 : byOrdre)
  } catch {
    return []
  }
}

/**
 * Filtre et réordonne `items` selon `slugs`. Les entrées `null` (relation
 * vidée dans l'admin) et les slugs introuvables sont ignorés en silence.
 */
function pickBySlugs<T extends { slug: string }>(items: T[], slugs?: (string | null)[]): T[] {
  const wanted = (slugs ?? []).filter((s): s is string => Boolean(s))
  if (wanted.length === 0) return items
  return wanted.flatMap((slug) => {
    const found = items.find((item) => item.slug === slug)
    return found ? [found] : []
  })
}

// ── Singletons ──

export async function getHeader(): Promise<Header | null> {
  try {
    const raw = await reader.singletons.header.read({ resolveLinkedFiles: true })
    if (!raw) return null
    return raw as unknown as Header
  } catch {
    return null
  }
}

export async function getFooter(): Promise<Footer | null> {
  try {
    const raw = await reader.singletons.footer.read({ resolveLinkedFiles: true })
    if (!raw) return null
    return raw as unknown as Footer
  } catch {
    return null
  }
}

export async function getCoordonnees(): Promise<Coordonnees | null> {
  try {
    const raw = await reader.singletons.coordonnees.read({ resolveLinkedFiles: true })
    if (!raw) return null
    return raw as unknown as Coordonnees
  } catch {
    return null
  }
}
