import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

/**
 * Adaptateur Cloudflare Workers.
 *
 * Toutes les pages sont pré-rendues au build : une modification de contenu
 * passe par un commit Keystatic qui déclenche un nouveau déploiement. Il n'y a
 * donc aucune revalidation à l'exécution, et le cache incrémental peut être
 * servi depuis les Workers Static Assets (gratuit, sans bucket R2 ni KV dédié).
 *
 * @remarks
 * Si un jour du contenu doit être revalidé sans redéploiement (ISR), passer à
 * `r2IncrementalCache` et déclarer le binding `NEXT_INC_CACHE_R2_BUCKET`
 * dans wrangler.jsonc.
 */
export default {
  ...defineCloudflareConfig({
    incrementalCache: staticAssetsIncrementalCache,
  }),

  /**
   * Commande utilisée par OpenNext pour compiler Next.js. Par défaut il lance
   * `npm run build`, or c'est justement ce script qui appelle OpenNext (pour
   * que les commandes par défaut de Workers Builds fonctionnent) : sans cette
   * ligne, le build se relance lui-même à l'infini.
   */
  buildCommand: 'npx next build',
}
