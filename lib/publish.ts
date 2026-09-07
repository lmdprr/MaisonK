/**
 * Mise en ligne du site : constantes et contrat partagés entre le bouton de
 * l'admin (`components/admin/PublishButton.tsx`) et son route handler
 * (`app/api/publier/route.ts`).
 *
 * Principe : Keystatic écrit sur `SOURCE_BRANCH` à chaque sauvegarde, mais
 * Cloudflare ne construit que `TARGET_BRANCH`. Mettre en ligne consiste à
 * avancer `TARGET_BRANCH` sur `SOURCE_BRANCH` (fast-forward), ce qui déclenche
 * un seul build quel que soit le nombre de sauvegardes accumulées.
 *
 * Ce module est chargé par le navigateur : aucun import Node ici.
 */

/** Branche sur laquelle Keystatic enregistre les modifications. */
export const SOURCE_BRANCH = 'main'

/** Branche construite et déployée par Cloudflare Workers Builds. */
export const TARGET_BRANCH = 'production'

/** Réponse de `GET /api/publier`. */
export interface PublishStatus {
  /** Commits en attente sur la source. `null` si la branche cible n'existe pas encore. */
  ahead: number | null
}

/** Réponse de `POST /api/publier`. */
export interface PublishResult {
  /**
   * - `published` : la cible a été avancée, le build démarre.
   * - `created` : première mise en ligne, la branche cible vient d'être créée.
   * - `up-to-date` : rien à publier.
   */
  outcome: 'published' | 'created' | 'up-to-date'
}

/** Corps d'erreur renvoyé par le route handler (statut HTTP ≠ 2xx). */
export interface PublishError {
  /**
   * - `unauthenticated` : pas de session GitHub, ou token expiré.
   * - `forbidden` : le compte n'a pas le droit d'écrire sur le dépôt.
   * - `conflict` : la cible a divergé de la source, fusion manuelle nécessaire.
   * - `unconfigured` : stockage local, la mise en ligne n'a pas de sens.
   * - `upstream` : GitHub a répondu autre chose que prévu.
   */
  error: 'unauthenticated' | 'forbidden' | 'conflict' | 'unconfigured' | 'upstream'
}
