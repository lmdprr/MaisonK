/**
 * Résolution des liens saisis dans Keystatic.
 *
 * Un champ URL (lien fléché, bouton, CTA du header) accepte la valeur spéciale
 * `whatsapp` : le lien wa.me est alors construit depuis le singleton
 * Coordonnées, pour que le numéro ne soit saisi qu'à un seul endroit.
 */

import type { Coordonnees, Lien } from './types'

/**
 * @returns l'URL prête à l'emploi, ou `null` si vide ou non résolvable
 * (`whatsapp` sans numéro renseigné).
 */
export function resolveUrl(url: string | null | undefined, coordonnees: Coordonnees | null): string | null {
  if (!url) return null
  if (url.trim().toLowerCase() === 'whatsapp') return whatsappUrl(coordonnees)
  return url
}

/** Lien wa.me depuis le numéro international de Coordonnées (chiffres seuls). */
export function whatsappUrl(coordonnees: Coordonnees | null): string | null {
  const digits = coordonnees?.whatsapp?.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

/**
 * Lien affichable : label non vide et URL résolue. `external` pilote
 * `target="_blank"` dans les composants (`ArrowLink`, `PaintButton`).
 *
 * @returns `null` si le lien est incomplet, ce qui permet d'écrire
 * `{lien && <ArrowLink {...lien} />}` sans autre garde.
 */
export function resolveLien(
  lien: Lien | null | undefined,
  coordonnees: Coordonnees | null
): { label: string; url: string; external: boolean } | null {
  const label = lien?.label?.trim()
  const url = resolveUrl(lien?.url, coordonnees)
  if (!label || !url) return null
  return { label, url, external: /^(https?:|mailto:|tel:)/.test(url) }
}
