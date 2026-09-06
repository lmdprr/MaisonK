# Flux Instagram sur l'accueil

Méthode pour remplacer les six images fixes de la mosaïque « Suivez les
coulisses » par les derniers posts de @maisonk.re, sans rien changer à
l'hébergement (Workers, plan Free) ni à la façon dont Carole édite le site.
Rien n'est appliqué : ce document sert de plan de mise en œuvre le jour où
l'accès au compte Meta est disponible.

---

## 1. Ce qu'on veut, ce qui contraint

Objectifs :

1. la mosaïque affiche les 6 (ou 8) derniers posts, chaque tuile ouvre le post ;
2. mise à jour au plus une fois par jour, sans intervention ;
3. un rafraîchissement manuel possible, depuis une URL à mettre en favori ;
4. si Instagram ne répond pas, le site reste intact : les images d'aujourd'hui
   servent de secours.

Contraintes :

- **Instagram n'a plus de flux public.** Il faut l'API officielle, un compte
  professionnel (Business ou Créateur) et un jeton d'accès. Le jeton vit 60 jours
  et se renouvelle par un appel dédié ; les URL d'images renvoyées sont signées et
  expirent au bout de quelques jours. On ne peut donc rien figer au build.
- **Le site est entièrement pré-rendu** (`open-next.config.ts`, cache incrémental
  sur Static Assets, pas d'ISR). Un fetch dans un composant serveur ferait un
  instantané à la date du dernier commit Keystatic. Le flux doit être lu **à
  l'exécution**, par une route dynamique du Worker.
- **Pas de système de fichiers à l'exécution** : le cache du flux et le jeton
  courant vivent dans un namespace **KV** (inclus dans le plan Free).
- **Le module galerie existe déjà** (`components/modules/Galerie.tsx`, affichage
  `mosaique`). On lui ajoute une source, on ne crée pas de module.

---

## 2. Architecture

```
Visiteur ─ /accueil (pré-rendu) ─ <InstagramMosaique> (client)
                                       │ fetch
                                       ▼
                        GET /api/instagram  (route dynamique)
                                       │
                          KV « feed » à jour (< 24 h) ? ── oui ──▶ réponse
                                       │ non
                                       ├─▶ réponse immédiate avec le flux périmé
                                       └─▶ waitUntil : Meta → KV « feed »
                                                        (+ renouvellement du jeton
                                                         si > 30 jours, → KV « token »)

Carole ─ GET /api/instagram/rafraichir?cle=… ──▶ purge « feed », appel Meta
                                                 synchrone, récapitulatif
```

Décisions :

- **Lecture paresseuse plutôt que cron.** Le premier visiteur du jour déclenche
  la mise à jour, en tâche de fond (`ctx.waitUntil`) : il reçoit l'ancien flux
  sans attendre, le suivant reçoit le nouveau. Pas de `scheduled` handler, donc pas
  de Worker personnalisé à maintenir par-dessus celui que génère OpenNext. Revers
  connu : sans visite pendant trois jours, la mise à jour attend la visite suivante.
- **Le jeton est renouvelé au même endroit.** Meta accepte de rafraîchir un jeton
  long vécu dès qu'il a plus de 24 h et tant qu'il n'est pas expiré. On le
  rafraîchit dès qu'il a plus de 30 jours : marge d'un mois même sans trafic.
- **Le secret Cloudflare ne sert qu'à amorcer.** `INSTAGRAM_ACCESS_TOKEN` est lu
  uniquement si KV n'a pas encore de jeton. Ensuite KV fait foi : un Worker ne peut
  pas réécrire ses propres secrets, et le jeton change à chaque renouvellement.
- **Composant client, pas serveur.** La page reste statique ; seule la mosaïque
  se remplit après chargement. Pendant le fetch (et en cas d'erreur) elle affiche
  les images de secours de Keystatic, donc aucun saut de mise en page.
- **Images Instagram servies telles quelles**, sans passer par `/cdn-cgi/image` :
  la transformation d'une origine externe est désactivée par défaut sur une zone
  Cloudflare, et de toute façon ces URL changent tous les quelques jours. On pose
  `unoptimized` sur `next/image` pour ces tuiles.

---

## 3. Côté Meta (à faire une fois, avec les accès au compte)

L'interface de Meta for Developers change souvent, les intitulés ci-dessous sont
ceux de 2025-2026 ; le principe reste le même.

1. Vérifier que @maisonk.re est un **compte professionnel** (Instagram › Paramètres
   › Type de compte). Un compte perso ne peut pas être connecté. « Créateur » suffit.
2. Sur https://developers.facebook.com, **Créer une app**. Nommer `MaisonK site`,
   cas d'usage « Autre » / accès aux données Instagram selon ce qui est proposé.
3. Dans l'app, ajouter le produit **Instagram** puis ouvrir **« API setup with
   Instagram login »** (et non l'ancienne Basic Display, arrêtée fin 2024).
4. Étape « Generate access tokens » : **ajouter le compte @maisonk.re** (Carole se
   connecte à Instagram dans la fenêtre Meta), puis **Generate token**. Le jeton
   affiché est déjà un jeton **long vécu** (60 jours). Le copier une seule fois.
5. Ne pas soumettre l'app à la validation Meta : en mode développement, l'app
   lit le compte de ses propres testeurs, c'est exactement notre cas.

Vérification immédiate, dans un terminal (remplacer `TOKEN`) :

```bash
curl "https://graph.instagram.com/me?fields=id,username&access_token=TOKEN"
```

Réponse attendue : `{"id":"…","username":"maisonk.re"}`.

Noter quelque part de sûr (pas dans le dépôt) : l'identifiant de l'app, la date
de génération du jeton. Si un jour le jeton meurt (voir § 8), on revient à
l'étape 4.

---

## 4. Côté Cloudflare

### 4.1 Namespace KV

```bash
npx wrangler kv namespace create INSTAGRAM
```

La commande renvoie un `id` à reporter dans `wrangler.jsonc` :

```jsonc
"kv_namespaces": [
  // Cache du flux Instagram et jeton courant (voir docs/flux-instagram.md).
  { "binding": "INSTAGRAM", "id": "<id renvoyé>" }
]
```

Puis `npm run cf-typegen` pour que `CloudflareEnv` connaisse le binding.

### 4.2 Secrets

Deux secrets, posés dans le dashboard du Worker (Settings › Variables and Secrets)
ou en ligne de commande :

```bash
npx wrangler secret put INSTAGRAM_ACCESS_TOKEN
```

```bash
npx wrangler secret put INSTAGRAM_REFRESH_KEY
```

| Secret | Rôle |
|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | jeton long vécu de l'étape 3, lu seulement pour amorcer KV |
| `INSTAGRAM_REFRESH_KEY` | clé de l'URL de rafraîchissement manuel ; une chaîne aléatoire longue, générée comme `FORM_TOKEN_SECRET` |

Les ajouter à `.env.example` (valeurs vides, avec un commentaire), et en local
dans `.dev.vars` (déjà ignoré par git) pour `npm run preview`.

### 4.3 Bindings en développement

`getCloudflareContext()` a besoin d'un proxy en `next dev`. Dans `next.config.ts` :

```ts
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
initOpenNextCloudflareForDev()
```

En dev, KV est simulé localement par wrangler (`.wrangler/state`), aucune
donnée de prod n'est touchée.

---

## 5. Côté code

Cinq fichiers à créer ou modifier. L'ordre ci-dessous permet de compiler à
chaque étape.

### 5.1 `lib/instagram.ts` : accès à l'API et au cache

Module serveur pur, sans React. Il ne connaît ni Keystatic ni le rendu.

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare'

export interface InstagramPost {
  id: string
  permalink: string
  /** URL d'image (ou vignette pour une vidéo). Signée, expire : ne jamais la stocker ailleurs. */
  image: string
  caption: string | null
  timestamp: string
}

interface CachedFeed { posts: InstagramPost[]; fetched_at: number }
interface StoredToken { value: string; obtained_at: number }

const API = 'https://graph.instagram.com'
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
const FEED_TTL = 24 * 3600 * 1000
const TOKEN_REFRESH_AFTER = 30 * 24 * 3600 * 1000
/** Plafond demandé à Meta, quel que soit le module : un module ne dépasse jamais cette valeur. */
const MAX_POSTS = 12
```

Fonctions à écrire (signatures, la logique tient en quelques lignes chacune) :

| Fonction | Rôle |
|---|---|
| `getEnv()` | `getCloudflareContext().env` typé `CloudflareEnv` ; jette un message clair si `INSTAGRAM` (KV) est absent |
| `readToken(env)` | KV `token` ; sinon amorce depuis `env.INSTAGRAM_ACCESS_TOKEN` et l'écrit en KV avec `obtained_at = Date.now()` |
| `refreshTokenIfNeeded(env, token)` | si `Date.now() - obtained_at > TOKEN_REFRESH_AFTER` : `GET ${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=…`, écrit le nouveau jeton en KV. En cas d'échec, garde l'ancien et trace |
| `fetchFromMeta(token)` | `GET ${API}/me/media?fields=${FIELDS}&limit=${MAX_POSTS}&access_token=…` ; mappe chaque média : `image = media_type === 'VIDEO' ? thumbnail_url : media_url` ; ignore un média sans image |
| `refreshFeed(env)` | enchaîne `readToken` → `refreshTokenIfNeeded` → `fetchFromMeta`, écrit KV `feed` `{ posts, fetched_at }`, renvoie le flux |
| `getFeed()` | lit KV `feed`. Absent : `refreshFeed` synchrone. Présent mais périmé : renvoie l'ancien et lance `ctx.waitUntil(refreshFeed(env))`. Frais : renvoie tel quel |

Points d'attention :

- Les réponses d'erreur Meta sont en `{ error: { message, code } }` avec un statut
  400 : les lire et les remonter dans le message d'exception, c'est ce qu'on verra
  dans les logs du Worker et dans le récapitulatif manuel.
- Un `CAROUSEL_ALBUM` a un `media_url` (première image) : rien de spécial à faire.
- Pas de `try/catch` silencieux dans `refreshFeed` : la route décide quoi faire
  d'une erreur. En revanche `getFeed` en mode « périmé » ne doit jamais jeter, le
  `waitUntil` absorbe l'échec de fond (un `.catch(console.error)` suffit).

### 5.2 `app/api/instagram/route.ts` : lecture par le site

```ts
import { NextResponse } from 'next/server'
import { getFeed } from '@/lib/instagram'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const feed = await getFeed()
    return NextResponse.json(feed, {
      // Cinq minutes en cache navigateur / edge : évite une lecture KV par affichage.
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch (err) {
    console.error('[instagram]', err instanceof Error ? err.message : err)
    // 503 et pas 500 : le client comprend « garde le secours », pas « bug ».
    return NextResponse.json({ posts: [], fetched_at: 0 }, { status: 503 })
  }
}
```

`force-dynamic` est indispensable : sans lui, Next pré-rend la route au build et
le Worker renverrait toujours le même JSON.

### 5.3 `app/api/instagram/rafraichir/route.ts` : rafraîchissement manuel

Même squelette, avec :

- lecture de `?cle=` et comparaison **à temps constant** avec
  `env.INSTAGRAM_REFRESH_KEY` (`crypto.subtle.timingSafeEqual` n'existe pas
  partout ; comparer les deux chaînes octet par octet après avoir vérifié la
  longueur, ou passer par un HMAC des deux et comparer les hash). Clé absente ou
  fausse : 404 (pas 401, pour ne pas confirmer l'existence de la route) ;
- `refreshFeed(env)` **synchrone**, puis une petite page HTML lisible sur un
  téléphone : nombre de posts récupérés, date du plus récent, âge du jeton en
  jours, et en cas d'échec le message Meta tel quel. Pas de JSON ici, c'est
  Carole qui lit ;
- `Cache-Control: no-store`.

L'URL à mettre en favori est donc `https://<domaine>/api/instagram/rafraichir?cle=<INSTAGRAM_REFRESH_KEY>`.
La clé transite dans l'URL : c'est acceptable pour ce qu'elle protège (forcer une
lecture d'un flux public), et c'est ce qui rend la chose utilisable sans rien
installer. Si elle fuit, on la régénère.

### 5.4 Schéma Keystatic et types

Dans `keystatic.config.ts`, troisième option du `fields.conditional` de `source` :

```ts
{ label: 'Instagram (derniers posts)', value: 'instagram' },
```

```ts
instagram: fields.object({
  limite: fields.integer({ label: 'Nombre de posts', defaultValue: 6, validation: { min: 1, max: 12 } }),
  secours: fields.array(
    fields.object({
      image: imageRequise('Image', 'galerie'),
      alt: fields.text({ label: 'Texte alternatif' }),
    }),
    { label: 'Images de secours (affichées si Instagram ne répond pas)', itemLabel: (props) => props.fields.alt.value || 'Image' }
  ),
}),
```

Dans `lib/types.ts`, ajouter la branche à `GalerieSource` :

```ts
| { discriminant: 'instagram'; value: { limite: number; secours: GalerieImage[] } }
```

Le lien du bloc `en_tete` (« @maisonk.re ↗ ») reste tel quel : l'URL du profil
vient de Keystatic, on n'a pas besoin de la demander à l'API.

### 5.5 Rendu : `Galerie.tsx` et `InstagramMosaique.tsx`

Dans `Galerie.tsx`, la branche `mosaique` devient :

```tsx
if (source.discriminant === 'instagram') {
  return (
    <Section module="galerie" fond={fond} padding="none" className="py-[clamp(64px,8vw,110px)]">
      <SectionHead data={en_tete} level={level} coordonnees={coordonnees} className="!mb-7 md:items-baseline" />
      <InstagramMosaique limite={source.value.limite} secours={source.value.secours} />
    </Section>
  )
}
```

Les autres sources (`images`, `projets`) ne changent pas ; la source `instagram`
n'a de sens qu'en `mosaique`, les trois autres affichages l'ignorent (liste vide).

`components/interactive/InstagramMosaique.tsx`, composant client :

- état `posts: InstagramPost[] | null` ; au montage, `fetch('/api/instagram')`,
  on ne garde que `posts.slice(0, limite)` ; toute erreur ou 503 laisse `null` ;
- rendu : la même `<ul>` que la mosaïque actuelle (mêmes classes, mêmes
  `data-reveal`), alimentée par `posts ?? secours`. Une tuile Instagram est un
  `<a href={permalink} target="_blank" rel="noopener noreferrer">`, une tuile de
  secours un `<span>` ;
- `<Image … unoptimized>` pour les tuiles Instagram (URL absolue, non
  transformable), le loader habituel pour les tuiles de secours ;
- `alt` : les 80 premiers caractères de `caption`, sinon `''` ;
- extraire de `Galerie.tsx` la tuile carrée actuelle dans un petit composant
  `Tuile` partagé plutôt que la dupliquer.

Le `limite` du module reste inférieur à `MAX_POSTS` : un seul appel Meta sert
tous les modules qui utiliseraient la source, quelle que soit leur limite.

### 5.6 Contenu

Dans `content/pages/accueil.yaml`, le dernier module passe de
`source.discriminant: images` à `instagram`, avec `limite: 6` et les six images
actuelles reprises en `secours`. **Attention au chemin des fichiers** : Keystatic
nomme le dossier d'après le chemin du champ, les images doivent donc être
déplacées de `…/source/value/images/N/image.jpg` vers
`…/source/value/secours/N/image.jpg` (un `git mv` par fichier), sinon l'admin
considère le champ vide. Le plus simple est de faire ce changement depuis
`/keystatic` en local, qui déplace les fichiers lui-même.

---

## 6. Vérifier

En local, avec `.dev.vars` renseigné :

```bash
npm run preview
```

1. `http://localhost:8787/api/instagram` renvoie `{ posts: [...], fetched_at }` ;
   un second appel est instantané (KV) ;
2. `http://localhost:8787/api/instagram/rafraichir?cle=…` affiche le
   récapitulatif ; avec une mauvaise clé, 404 ;
3. sur `/accueil`, la mosaïque montre d'abord les images de secours puis les
   posts ; couper le réseau (onglet Network › Offline) et recharger : les
   images de secours restent ;
4. `npx wrangler kv key list --binding INSTAGRAM --preview` liste `feed` et
   `token`.

En production, après déploiement : ouvrir l'URL de rafraîchissement une fois,
elle amorce KV et confirme que le jeton fonctionne. Puis vérifier l'accueil.

---

## 7. Coûts et limites

| | Palier gratuit | Usage attendu |
|---|---|---|
| KV lectures | 100 000 / jour | 1 par affichage de l'accueil non couvert par le `max-age` de 5 min |
| KV écritures | 1 000 / jour | 1 par jour, plus les rafraîchissements manuels |
| API Instagram | 200 appels / heure / compte | 1 par jour |
| Poids des tuiles | | Meta ne fournit pas de vignette pour les images : ~100-200 Ko chacune, 6 tuiles en lazy loading |

---

## 8. Exploitation

**La mosaïque montre les images de secours alors que le site est en ligne.**
Ouvrir l'URL de rafraîchissement : le message Meta s'affiche en clair. Les deux
causes vues en pratique :

- *code 190, jeton expiré ou invalide* : plus de deux mois sans aucun rafraîchissement
  réussi, ou Carole a changé son mot de passe Instagram (Meta invalide alors les
  jetons). Regénérer un jeton (§ 3, étape 4), le poser dans
  `INSTAGRAM_ACCESS_TOKEN`, **supprimer la clé `token` du KV** pour forcer le
  réamorçage, puis rouvrir l'URL de rafraîchissement :

  ```bash
  npx wrangler kv key delete token --binding INSTAGRAM
  ```

- *le compte est repassé en personnel* : le remettre en professionnel, le jeton
  redevient valide.

**Changer la clé de rafraîchissement** : nouveau `wrangler secret put`, mettre à
jour le favori. Rien d'autre.

**Retour en arrière** : repasser le module sur la source « Images libres » dans
Keystatic suffit, le code Instagram reste en place sans être appelé.

---

## 9. Récapitulatif des fichiers

| Fichier | Action |
|---|---|
| `wrangler.jsonc` | binding KV `INSTAGRAM` |
| `next.config.ts` | `initOpenNextCloudflareForDev()` |
| `.env.example` | documenter les deux secrets |
| `lib/instagram.ts` | nouveau : API Meta, KV, jeton |
| `app/api/instagram/route.ts` | nouveau : lecture avec cache |
| `app/api/instagram/rafraichir/route.ts` | nouveau : rafraîchissement manuel |
| `keystatic.config.ts` | source `instagram` du module galerie |
| `lib/types.ts` | branche `instagram` de `GalerieSource` |
| `components/modules/Galerie.tsx` | branche `instagram`, tuile extraite |
| `components/interactive/InstagramMosaique.tsx` | nouveau : composant client |
| `content/pages/accueil.yaml` | module Instagram avec images de secours |
| `README.md` | une ligne dans « Structure » et dans « Coûts », renvoi vers ce document |
