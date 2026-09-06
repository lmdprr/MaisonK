import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../keystatic.config'

/**
 * API de l'admin Keystatic (auth GitHub, lecture/écriture du contenu).
 *
 * Côté serveur uniquement : c'est ici que les secrets `KEYSTATIC_*` sont lus.
 * En stockage local (dev), le handler écrit directement dans `content/`.
 *
 * Le handler est créé à la première requête et non au chargement du module :
 * en mode GitHub, `makeRouteHandler` refuse de démarrer sans les secrets, et
 * Next évalue ce module pendant `next build` (« Collecting page data »). Les
 * secrets n'existent qu'à l'exécution sur Workers, pas au build.
 */
let handler: ReturnType<typeof makeRouteHandler> | undefined
const routes = () => (handler ??= makeRouteHandler({ config }))

export const GET = (request: Request) => routes().GET(request)
export const POST = (request: Request) => routes().POST(request)
