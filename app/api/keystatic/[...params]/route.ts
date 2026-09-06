import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../keystatic.config'

/**
 * API de l'admin Keystatic (auth GitHub, lecture/écriture du contenu).
 *
 * Côté serveur uniquement : c'est ici que les secrets `KEYSTATIC_*` sont lus.
 * En stockage local (dev), le handler écrit directement dans `content/`.
 */
export const { GET, POST } = makeRouteHandler({ config })
