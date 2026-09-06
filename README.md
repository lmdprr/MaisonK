# MaisonK v2 — Next.js + Keystatic sur Cloudflare

Site MaisonK (rénovation intérieure). Contenu en YAML versionné dans le dépôt,
admin Keystatic intégrée, images sur Cloudflare R2, emails via Resend.
Objectif : **aucun frais d'hébergement**.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Hébergement | Cloudflare Workers via `@opennextjs/cloudflare` |
| CSS | Tailwind CSS v4, tokens de la charte dans `app/globals.css` (`@theme` + rôles par `data-fond`) |
| CMS | `@keystatic/core` + `@keystatic/next`, admin sur `/keystatic` |
| Contenu | fichiers YAML dans `content/` (committés) |
| Images | `public/images/**` → miroir Cloudflare R2 + transformations |
| Emails | `resend` via une server action |
| Analytics | Cloudflare Web Analytics (gratuit) |

> **Workers plutôt que Pages** : `@cloudflare/next-on-pages` est limité au runtime
> Edge, alors que `@opennextjs/cloudflare` tourne sur le runtime Node.js des
> Workers — c'est aujourd'hui la voie recommandée pour Next.js sur Cloudflare.
> Le déploiement reste connecté à GitHub comme sur Pages.

## Démarrer

```bash
npm install
cp .env.example .env.local     # renseigner FORM_TOKEN_SECRET et RESEND_API_KEY
npm run dev
```

- Site : http://localhost:3000
- Admin : http://localhost:3000/keystatic (stockage local, aucune variable GitHub requise)

`/` redirige vers `/accueil`. Seules les pages en `status: published` sont
rendues ; un brouillon renvoie 404 même en dev.

### Prévisualiser sur le vrai runtime Cloudflare

```bash
npm run preview     # build OpenNext + wrangler dev
```

À faire avant chaque mise en production : le runtime Workers n'est pas Node.js,
certaines bibliothèques n'y tournent pas (voir « Contraintes du runtime »).

> OpenNext avertit qu'il n'est pas pleinement compatible Windows. Le build local
> fonctionne, mais le déploiement réel doit passer par CI (Linux) — c'est le cas
> par défaut avec Cloudflare Workers Builds.

---

## Images

### Comment ça marche

Keystatic est un CMS **git-based** : `fields.image` écrit toujours le fichier dans
le dépôt, sous `public/images/<dossier>/<slug de l'entrée>/<fichier>` pour une
collection (page, projet, prestation) et `public/images/<dossier>/<fichier>` pour un
singleton. Le YAML contient le chemin public correspondant. Respecter cette
arborescence quand on ajoute une image à la main, sinon l'admin ne retrouve pas le
fichier et refuse d'enregistrer l'entrée. C'est ce qui permet la prévisualisation
dans l'admin et le versionnage du contenu — il n'existe pas d'adaptateur R2 natif
côté Keystatic. R2 sert donc d'**origine de diffusion**, alimentée après chaque build :

```
Éditeur → /keystatic → commit dans public/images/**
                          ↓  npm run sync:images
                       bucket R2
                          ↓  lib/imageLoader.ts
                    /cdn-cgi/image/... (redimensionnement + AVIF/WebP)
```

Les chemins stockés en YAML restent relatifs (`/images/hero/salon.jpg`) : le
contenu ne dépend pas de l'hébergeur, seul le loader décide de l'origine.

### Trois modes, pilotés par l'environnement

| Variables | Résultat |
|---|---|
| aucune | images servies depuis `/public` — fonctionne, sans redimensionnement |
| `NEXT_PUBLIC_IMAGE_CDN_URL` | images servies depuis le bucket R2 |
| + `NEXT_PUBLIC_IMAGE_TRANSFORMS=true` | passage par `/cdn-cgi/image` : redimensionnement + `format=auto` |

Le troisième mode exige que **Transformations** soit activé sur la zone Cloudflare,
donc un domaine custom (`maisonk.fr`) — cela ne fonctionne pas sur `*.workers.dev`.

### Synchroniser vers R2

```bash
npm run sync:images -- --dry-run    # voir ce qui serait envoyé
npm run sync:images                 # envoyer les fichiers nouveaux ou modifiés
```

Le script compare les ETag pour ne pas réenvoyer un fichier inchangé, et pose un
`Cache-Control: immutable` (les noms de fichiers Keystatic sont stables).

### Pourquoi pas l'optimiseur d'images de Next.js ?

`next/image` s'appuie sur un service d'optimisation propre à Vercel, inexistant sur
Cloudflare. Il est remplacé par un loader custom (`lib/imageLoader.ts`). L'autre
option serait le binding `images` d'OpenNext, qui consomme le même quota de
transformations mais ajoute un passage par le Worker : le loader est plus direct.

---

## Formulaires

Le formulaire « Votre projet » (`FormulaireProjet`) est un composant client, et la
server action ne peut pas relire le contenu Keystatic à l'exécution (pas de
système de fichiers sur Workers).
L'adresse destinataire est donc **chiffrée au pré-rendu** (AES-GCM, `lib/formToken.ts`)
et transmise au navigateur sous forme de jeton opaque, déchiffré par la server action.

Conséquences :
- l'adresse n'apparaît ni dans le HTML ni dans le payload React (pas de récolte à spam) ;
- personne ne peut détourner le formulaire pour écrire à une adresse arbitraire.

La server action est `app/actions/submitProjet.ts`. La photo éventuelle est réduite
dans le navigateur (1 600 px max, JPEG) puis jointe à l'e-mail en base64 : rien n'est
stocké côté serveur. La limite de corps des server actions est portée à 4 Mo dans
`next.config.ts` pour la laisser passer. La planche de teintes (`lib/planche.ts`,
`components/interactive/usePlanche.ts`) vit en localStorage et arrive dans l'e-mail
sous forme de texte (« Terracotta doux (#B5654A), Chêne clair »).

`FORM_TOKEN_SECRET` doit être identique au build et à l'exécution — c'est
automatiquement le cas dans un déploiement Cloudflare.

**Resend, plan gratuit** : 100 emails/jour, 3 000/mois, 3 domaines. Le domaine
d'envoi (`RESEND_FROM_EMAIL`) doit être vérifié dans Resend, sinon l'envoi est refusé.

---

## Contraintes du runtime Workers

À garder en tête avant d'ajouter une dépendance :

- **Pas de système de fichiers à l'exécution.** Le reader Keystatic ne fonctionne
  qu'au build. Toutes les pages de contenu sont donc pré-rendues, et
  `app/(site)/[slug]/page.tsx` déclare `dynamicParams = false` : un slug inconnu
  renvoie 404 sans jamais toucher au serveur.
- **Pas de jsdom.** Les bibliothèques qui en dépendent (`isomorphic-dompurify` par
  exemple) font planter le Worker (`MessagePort is not defined`). Aucun assainissement
  HTML n'est nécessaire ici : `fields.document` renvoie un arbre structuré rendu par
  `DocumentRenderer`, jamais du HTML brut.
- **Le layout racine est minimal**, car il sert aussi `/keystatic`. L'en-tête et le
  pied de page vivent dans `app/(site)/layout.tsx`, uniquement sur des routes
  pré-rendues.
- **Cache incrémental** servi depuis les Workers Static Assets (`open-next.config.ts`) :
  gratuit, adapté à un site sans revalidation. Pour de l'ISR, passer à
  `r2IncrementalCache` avec un binding dédié.

---

## Structure

```
app/
  layout.tsx                   layout racine minimal (+ beacon analytics)
  (site)/layout.tsx            Header / Footer du site public
  (site)/[slug]/page.tsx       rendu d'une page + métadonnées SEO
  (site)/page.tsx              redirection vers /accueil
  actions/submitProjet.ts      server action Resend (formulaire « Votre projet »)
  api/keystatic/[...params]/   route handler Keystatic
  keystatic/[[...params]]/     UI d'administration
components/
  layout/                      Header, Footer
  modules/                     ModuleRenderer + 9 modules de page
  interactive/                 composants clients : HeroSlides, AvantApres, PlancheTeintes, ProjetForm
  decor/                       croquis SVG, papiers peints, quadrilobes, filtre crayon, DecorRuntime
  ui/                          Section, Container, Heading, SectionHead, Eyebrow, ArrowLink, PaintButton, Pill, Img
content/
  pages/*.yaml                 une page = un fichier
  projets/*.yaml               collection Réalisations
  prestations/*.yaml           collection Prestations
  global/{header,footer,coordonnees}.yaml  singletons
docs/plan-modules-keystatic.md modèle de contenu (modules, collections, arguments)
lib/
  keystatic.ts                 reader API (build uniquement)
  links.ts                     résolution des liens (`whatsapp` → wa.me depuis Coordonnées)
  types.ts                     types TypeScript des modules
  imageLoader.ts               loader next/image → R2 + /cdn-cgi/image
  formToken.ts                 chiffrement de l'adresse destinataire
scripts/sync-r2.mjs            synchronisation public/images → R2
keystatic.config.ts            schéma complet du CMS
open-next.config.ts            adaptateur Cloudflare
wrangler.jsonc                 configuration du Worker
```

## Modules

Neuf modules couvrent l'ensemble du site (détail des champs et arguments dans
`docs/plan-modules-keystatic.md`) :

| Module | Rôle | Usages |
|---|---|---|
| `hero` | premier écran de l'accueil (diaporama) | accueil uniquement, en premier |
| `intro` | titre + texte + visuel (aucun / image / portrait) | premier module de toutes les autres pages, bloc Carole, page Contact |
| `grille_points` | items numérotés ou illustrés (cellules / liste) | Pour qui, Ma méthode, Ma démarche |
| `prestations` | collection Prestations (aperçu / détail) | accueil, page Prestations |
| `galerie` | projets ou images (cartes / fiches / comparateur / mosaïque) | teaser, grille, avant-après, Instagram |
| `zone_intervention` | villes de Coordonnées (défilant / chips) | accueil, À propos |
| `bandeau_cta` | appel à l'action | bas de quatre pages |
| `formulaire_projet` | page « Votre projet » | une page |
| `texte` | texte riche | mentions légales, pages libres |

Règles communes :
- les images passent par `components/ui/Img` (wrapper client de `next/image` avec le
  loader Cloudflare) : Turbopack n'applique pas `images.loaderFile` au rendu serveur en dev ;
- le contenu riche d'un module (`fields.document`) est stocké à part, en Markdoc :
  `content/pages/<slug>/modules/<index>/value/contenu.mdoc` ;
- le premier module d'une page rend un `h1`, les suivants un `h2` (`ModuleRenderer` passe `index`) ;
- le champ `fond` (crème, sable, sombre, rose) remplace toute variante de couleur ;
- une URL de lien ou de bouton peut valoir `whatsapp` : elle est résolue depuis le
  singleton Coordonnées (`lib/links.ts`) ;
- Coordonnées est lu une fois par page et transmis à chaque module ;
- le décor n'est jamais un champ Keystatic : il est assigné par le code selon le module,
  sa variante ou l'index de l'item (`components/decor/`, tableau d'assignation dans
  `docs/plan-modules-keystatic.md`, section 6). Trois
  attributs pilotent le runtime client : `data-reveal` (apparition au défilement),
  `data-sketch` (croquis en pause jusqu'à l'entrée dans l'écran), `data-paint` (rouleau
  de peinture sur les boutons). Tout respecte `prefers-reduced-motion` ;
- pas de coche sur le site : toute puce de liste ou marque de validation est le
  quadrilobe de la marque (`Flower` dans `components/decor/Wall.tsx`).

### Ajouter un module

1. Déclarer le bloc dans `keystatic.config.ts` (`modules: fields.blocks({...})`),
   en réutilisant les sous-schémas `fond`, `icone`, `lien`, `cta`, `enTeteSection`
2. Ajouter l'interface + l'entrée de `PageModule` dans `lib/types.ts`
3. Créer le composant dans `components/modules/` (enveloppé dans `ui/Section`)
4. Le brancher dans le `switch` de `components/modules/ModuleRenderer.tsx`

## Déploiement

1. Créer le Worker et le connecter au dépôt GitHub (Workers Builds), puis
   remplacer les commandes pré-remplies par le dashboard :
   - **Build command** : `npm run cf:build`
   - **Deploy command** : `npm run cf:deploy`

   Les valeurs par défaut (`npm run build` / `npx wrangler deploy`) ne
   produisent pas le dossier `.open-next/` et le déploiement échoue avec
   « Could not find compiled Open Next config ». La synchronisation R2 incluse
   dans `cf:build` est ignorée tant que les variables `R2_*` ne sont pas définies.
2. Créer le bucket R2, lui associer un domaine public (`cdn.maisonk.fr`).
3. Activer **Transformations** sur la zone Cloudflare.
4. Renseigner les variables de `.env.example` dans les paramètres du Worker.
   `NEXT_PUBLIC_GITHUB_REPO_*` active le stockage GitHub de Keystatic (l'admin est
   une app cliente, elle doit connaître le dépôt) et `KEYSTATIC_*` porte les secrets
   lus par le route handler ;
   tant qu'elles sont absentes, la config retombe sur le stockage local et le
   build reste vert.

Déploiement manuel : `npm run deploy`.

Les types des bindings Cloudflare se régénèrent avec `npm run cf-typegen`
(`cloudflare-env.d.ts` n'est pas versionné).

## Coûts

| Service | Palier gratuit | Usage attendu |
|---|---|---|
| Workers | 100 000 requêtes/jour | une page vue = une requête ; les fichiers statiques (`/_next/static`, `/images`) sont gratuits et illimités |
| R2 | 10 Go, 1 M opérations classe A, 10 M classe B, **égress gratuit** | quelques centaines de photos |
| Transformations d'images | 5 000 transformations uniques/mois | ≈ nombre de photos × nombre de tailles |
| Resend | 100 emails/jour, 3 000/mois | formulaire de contact |
| Cloudflare Web Analytics | gratuit | — |

Au-delà des 5 000 transformations, Cloudflare renvoie une erreur sur les
**nouvelles** transformations sans facturer — les images déjà mises en cache
continuent d'être servies. En cas de dépassement récurrent, réduire le nombre de
tailles générées (`sizes` sur `next/image`) ou passer `NEXT_PUBLIC_IMAGE_TRANSFORMS`
à `false`.
