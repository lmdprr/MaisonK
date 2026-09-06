# Optimisation automatique des images

Plan d'outillage pour que les images du dépôt restent légères, sans changer la
façon dont Carole les ajoute (Keystatic), et sans doublon de logique avec la
diffusion R2 déjà en place. Rien n'est appliqué : ce document sert à décider.

---

## 1. Constat (6 septembre 2026)

| | |
|---|---|
| Fichiers | 28 (24 JPEG, 4 PNG), 3,8 Mo au total |
| Plus lourd | 375 Ko (portrait PNG avec transparence, 548 × 455) |
| Plus grande dimension | 1 400 px de large |
| Doublons binaires | 9 (Keystatic copie l'image dans le dossier de chaque entrée qui l'utilise) |
| Métadonnées | non vérifiées ; les photos de téléphone embarquent EXIF et souvent des coordonnées GPS |

Le dépôt est sain aujourd'hui parce que les visuels actuels sont des
placeholders déjà réduits. Le risque est devant nous : la première photo de
chantier déposée depuis un iPhone via `/keystatic` fait 4 à 12 Mo en 4 000 px,
elle part telle quelle dans un commit, et **git la garde pour toujours**, même
si on la remplace ensuite. Un dépôt de site vitrine peut atteindre plusieurs
centaines de Mo en un an de ce régime, ce qui ralentit les clones, les builds
Cloudflare et l'admin Keystatic (qui lit le dépôt via l'API GitHub).

Gain immédiat sur le lot actuel, simulé en mémoire avec les réglages de la
section 4 (aucun fichier modifié) :

| | Avant | Après | Gain |
|---|---|---|---|
| Total (28 fichiers) | 3 753 Ko | 2 183 Ko | -42 % |
| Portraits PNG (× 2) | 375 Ko | 102 Ko | -73 % |
| `logo/logo.png` | 129 Ko | 20 Ko | -84 % |
| JPEG 1 400 px (typique) | 190-229 Ko | 126-145 Ko | -35 % |
| JPEG déjà compressés (× 2) | 109 Ko | 95 Ko | -12 % |

Aucune image n'a été redimensionnée (toutes sont sous 2 000 px) : le gain vient
uniquement de la recompression. Ce n'est pas l'enjeu principal. L'enjeu est que
chaque image future soit optimisée **avant** d'entrer dans l'historique.

---

## 2. Objectifs et contraintes

Objectifs :

1. aucune image dans l'historique git au-dessus d'un plafond raisonnable
   (cible : 2 000 px sur le plus grand côté, ~300 Ko en JPEG) ;
2. métadonnées EXIF supprimées (poids, et vie privée : GPS de l'atelier ou du client) ;
3. zéro action manuelle pour Carole, zéro nouvelle étape pour un développeur ;
4. une seule chaîne vers R2, celle qui existe (`scripts/sync-r2.mjs`).

Contraintes qui cadrent la solution :

- **Keystatic est git-based** : le fichier doit rester dans `public/images/...`
  au chemin exact écrit dans le YAML, sinon l'admin considère le champ vide.
  On optimise donc **en place**, même nom, même extension. Pas de conversion
  JPEG → WebP dans le dépôt : ça casserait le chemin. La conversion de format
  est déjà faite à la diffusion par Cloudflare (`format=auto`, voir README).
- **On ne contrôle pas le commit Keystatic** : en mode GitHub, l'admin pousse
  directement sur la branche. Un hook local ne le verra jamais. L'outil doit
  donc tourner **côté GitHub**, après le push.
- **Ré-encoder un JPEG dégrade** : l'outil doit être idempotent, et ne jamais
  repasser sur un fichier qu'il a déjà produit.
- **Pas de LFS** : Keystatic lit les fichiers via l'API GitHub, LFS n'y est pas
  résolu. Écarté.

---

## 3. Architecture retenue

```
Carole → /keystatic → commit sur main (ou content/xxx)
                          │
                          ▼
             GitHub Action « optimize-images »
             (déclenchée si public/images/** change)
                          │  sharp : resize ≤ 2000 px, JPEG q80 mozjpeg,
                          │  PNG palette, EXIF supprimé, manifeste mis à jour
                          ▼
             commit « chore(images): optimise N fichiers »
                          │
                          ▼
             Cloudflare Workers Build (déjà connecté au dépôt)
             build → scripts/sync-r2.mjs → R2
```

Trois pièces, dans l'ordre de valeur :

| Pièce | Rôle | Obligatoire |
|---|---|---|
| `scripts/optimize-images.mjs` | le traitement, réutilisé partout | oui |
| `.github/workflows/optimize-images.yml` | l'exécute après chaque push qui touche les images, committe le résultat | oui, c'est ce qui couvre Keystatic |
| hook local `pre-commit` | même script sur les commits d'un développeur, pour ne pas dépendre de l'action | optionnel, confort |

L'upload R2 reste dans la chaîne de build Cloudflare : le commit de l'action
déclenche un build, le build synchronise. Aucun secret R2 à ajouter côté
GitHub. Si un jour on veut R2 à jour **avant** le déploiement (préchauffer le
CDN), il suffit d'ajouter une étape `node scripts/sync-r2.mjs` dans l'action
avec les quatre secrets R2 ; le script existant est déjà idempotent (ETag).

---

## 4. Le script `scripts/optimize-images.mjs`

### Règles de traitement

| Format | Traitement |
|---|---|
| JPEG | redimension si > 2 000 px (plus grand côté, sans agrandir), `mozjpeg`, qualité 80, progressif, chroma 4:2:0, métadonnées supprimées |
| PNG | redimension idem, quantification en palette (`palette: true`, qualité 70-90, équivalent pngquant), compression 9, métadonnées supprimées. La transparence est conservée. |
| SVG, GIF, WebP, AVIF | ignorés (pas de cas aujourd'hui ; à traiter si besoin) |
| `.gitkeep`, fichiers cachés | ignorés |

Pourquoi 2 000 px : le rendu le plus large du site est le hero à 50 vw, soit
~960 px CSS sur un écran 1 920, donc ~1 920 px physiques en Retina. Au-delà,
Cloudflare redimensionne de toute façon à la demande. Pourquoi qualité 80 :
c'est le point où mozjpeg n'a plus d'artefact visible sur des photos
d'intérieur, tout en divisant le poids par 2 à 4 par rapport à une sortie de
téléphone.

Garde-fou : on ne remplace le fichier que si la sortie est **plus petite d'au
moins 5 %**. Un fichier déjà bien compressé reste intact (et n'est pas dégradé).

### Idempotence : le manifeste

`public/images/.optimized.json` (versionné) associe chaque chemin au SHA-256 de
son contenu **après** optimisation :

```json
{
  "hero/accueil/modules/0/value/slides/0/image.jpg": "3f9c…",
  "portraits/a-propos/carole.png": "b21e…"
}
```

Au lancement, un fichier dont le hash courant est dans le manifeste est sauté.
Un fichier remplacé par Keystatic (nouveau contenu, même nom) a un autre hash :
il est traité. Un fichier supprimé est retiré du manifeste. C'est ce qui rend
l'action GitHub sûre : son propre commit ne relance pas de traitement.

### Interface

```
node scripts/optimize-images.mjs             # traite ce qui n'est pas dans le manifeste
node scripts/optimize-images.mjs --dry-run   # affiche les gains sans écrire
node scripts/optimize-images.mjs --check     # code de sortie 1 s'il reste des fichiers à traiter (CI)
node scripts/optimize-images.mjs --force     # ignore le manifeste (après changement des réglages)
```

Sortie : une ligne par fichier (`avant → après, -62 %`), un total. Format
identique à `sync-r2.mjs` pour rester cohérent.

### Code

`sharp` est déjà présent dans `node_modules` (dépendance transitive de Next),
mais il faut le déclarer explicitement en `devDependencies` pour ne pas dépendre
d'un détail interne de Next :

```bash
npm install --save-dev sharp
```

```js
#!/usr/bin/env node
/**
 * Optimise `public/images/**` en place : redimension, recompression, EXIF
 * supprimé. Idempotent grâce à `public/images/.optimized.json`.
 * Voir docs/optimisation-images.md.
 */
import { readdir, readFile, writeFile, stat, unlink, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.join(process.cwd(), 'public', 'images')
const MANIFEST = path.join(ROOT, '.optimized.json')
const MAX_SIDE = 2000
const JPEG_QUALITY = 80
const MIN_GAIN = 0.05
const DRY_RUN = process.argv.includes('--dry-run')
const CHECK = process.argv.includes('--check')
const FORCE = process.argv.includes('--force')

const sha = (buf) => createHash('sha256').update(buf).digest('hex')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(full)))
    else if (e.isFile() && !e.name.startsWith('.')) files.push(full)
  }
  return files
}

async function optimise(buf, ext) {
  const img = sharp(buf, { failOn: 'none' }).rotate() // applique l'orientation EXIF avant de la supprimer
  const meta = await img.metadata()
  if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_SIDE) {
    img.resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true }).toBuffer()
  }
  if (ext === '.png') {
    return img.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
  }
  return null // format non géré
}

async function main() {
  let manifest = {}
  try { manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) } catch {}

  const files = await walk(ROOT)
  const next = {}
  let pending = 0, saved = 0

  for (const file of files) {
    const key = path.relative(ROOT, file).split(path.sep).join('/')
    const ext = path.extname(file).toLowerCase()
    const before = await readFile(file)
    const hash = sha(before)

    if (!FORCE && manifest[key] === hash) { next[key] = hash; continue }

    const after = await optimise(before, ext)
    if (!after) { next[key] = hash; continue }

    const gain = 1 - after.length / before.length
    if (gain < MIN_GAIN) { next[key] = hash; continue } // déjà bon : on fige tel quel

    pending++
    saved += before.length - after.length
    console.log(`${key}  ${(before.length / 1024).toFixed(0)} → ${(after.length / 1024).toFixed(0)} Ko  (-${(gain * 100).toFixed(0)} %)`)
    if (DRY_RUN || CHECK) { next[key] = hash; continue }

    // Écriture atomique : pas de fichier tronqué si le process est tué.
    await writeFile(file + '.tmp', after)
    await rename(file + '.tmp', file)
    next[key] = sha(after)
  }

  if (!DRY_RUN && !CHECK) {
    await writeFile(MANIFEST, JSON.stringify(next, null, 2) + '\n')
  }
  console.log(`\n${pending} fichier(s) ${DRY_RUN || CHECK ? 'à optimiser' : 'optimisé(s)'}, ${(saved / 1024).toFixed(0)} Ko gagnés.`)
  if (CHECK && pending > 0) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
```

Points d'attention dans ce code :

- `.rotate()` sans argument applique l'orientation EXIF **avant** de supprimer
  les métadonnées, sinon les photos de téléphone prises en portrait
  s'afficheraient couchées.
- `withoutEnlargement` : on ne fabrique jamais de pixels.
- `.tmp` + `rename` : un Ctrl-C au mauvais moment ne laisse pas un JPEG à moitié écrit.
- Le manifeste enregistre aussi les fichiers non touchés (gain insuffisant,
  format ignoré) : ils ne seront pas ré-analysés à chaque run.

À ajouter dans `package.json` :

```json
"images:optimize": "node scripts/optimize-images.mjs",
"images:check": "node scripts/optimize-images.mjs --check"
```

---

## 5. L'action GitHub `.github/workflows/optimize-images.yml`

```yaml
name: Optimise les images

on:
  push:
    paths:
      - 'public/images/**'

permissions:
  contents: write

jobs:
  optimize:
    # Ne pas se relancer sur son propre commit
    if: github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref_name }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci --ignore-scripts

      - run: node scripts/optimize-images.mjs

      - name: Commit du résultat
        run: |
          git config user.name  'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add public/images
          if git diff --cached --quiet; then
            echo 'Rien à optimiser.'
          else
            n=$(git diff --cached --numstat | wc -l)
            git commit -m "chore(images): optimise $n fichier(s)"
            git push
          fi
```

Notes :

- `paths` limite le déclenchement aux pushs qui touchent les images : un
  commit de contenu texte ne coûte rien.
- `--ignore-scripts` évite les postinstall inutiles ; `sharp` embarque ses
  binaires pré-compilés, rien à builder.
- Le commit de l'action déclenche à son tour Workers Builds, qui déploie la
  version optimisée et synchronise R2. Le build intermédiaire (celui du commit
  Keystatic) aura déployé l'image lourde pendant quelques minutes : acceptable
  pour un site vitrine. Si ce n'est pas souhaité, activer dans Cloudflare
  l'option « skip build » sur un pattern de message, ou passer par des PR.
- **Branches Keystatic** (`content/*`) : l'action tourne aussi dessus. Si
  ensuite la PR est fusionnée en **squash**, seul le résultat optimisé entre
  dans l'historique de `main`. C'est le seul moyen de garantir l'objectif 1 à
  100 % ; en commit direct sur `main`, l'original lourd reste dans l'historique
  (petit, mais présent). À trancher : imposer le mode branche + PR dans
  Keystatic, ou accepter ce résidu.
- Le token par défaut suffit tant que `main` n'a pas de règle de protection qui
  bloque les bots. Si une règle est ajoutée plus tard, passer par une GitHub
  App ou un PAT stocké en secret.

---

## 6. Hook local (optionnel)

Pour qu'un développeur ne pousse jamais une image brute et n'attende pas
l'action :

```bash
npm install --save-dev husky
npx husky init
```

`.husky/pre-commit` :

```sh
if git diff --cached --name-only | grep -q '^public/images/'; then
  node scripts/optimize-images.mjs
  git add public/images
fi
```

Le script étant idempotent, un `git add` après coup ne provoque pas de second
traitement. Pas de `lint-staged` : le manifeste doit voir tout le dossier, pas
seulement les fichiers indexés.

---

## 7. Cas particuliers repérés dans le lot actuel

- **`logo/logo.png` (129 Ko, 1 340 × 530)** : la quantification le ramène à
  20 Ko, signe qu'il n'utilise que quelques couleurs. Un logo devrait être un
  SVG : le vrai gain est de récupérer le fichier vectoriel auprès du designer
  et de le déposer via l'admin. Le script ignore les SVG.
- **Portraits PNG avec transparence (375 Ko)** : la palette les ramène à
  102 Ko. À contrôler visuellement sur le dégradé de peau avant de valider
  (c'est le cas où la palette 256 couleurs peut poser un léger « banding » ;
  si c'est visible, monter `quality` à 100 pour les PNG, le gain restera
  au-dessus de 60 %). Si le fond bordeaux du portrait est définitif, une version
  JPEG détourée sur fond bordeaux serait plus légère encore, mais ça change
  l'extension : à faire depuis l'admin, pas par le script.
- **Doublons (9)** : conséquence du modèle Keystatic (une image par entrée).
  Sans impact sur R2 (le CDN cache par URL) ni sur le build. Ne pas essayer de
  dédupliquer : ça casserait l'admin.
- **`decor/motif.png`** : asset de code, pas de contenu. Il passe de 31 à 4 Ko
  dans le script, et à ce poids il pourrait vivre dans `components/decor` en
  data-URI si on veut vider `public/images` de tout ce qui n'est pas éditorial.

---

## 8. Nettoyer l'historique si une image lourde y est déjà entrée

À n'utiliser qu'en cas de besoin réel (clone qui devient lent), et **avant**
que d'autres personnes ne travaillent sur le dépôt, car ça réécrit les commits :

```bash
pip install git-filter-repo
git filter-repo --strip-blobs-bigger-than 2M
git push --force --all
```

Keystatic n'en souffre pas (il lit l'état courant), mais tous les clones
existants sont à refaire. Aujourd'hui, avant le premier push, la question ne
se pose pas.

---

## 9. Ordre de mise en œuvre proposé

1. `npm install --save-dev sharp`, créer `scripts/optimize-images.mjs`, ajouter
   les deux scripts npm. Lancer en `--dry-run`, vérifier visuellement trois ou
   quatre images produites (hero, portrait, logo) avant de committer.
2. Committer le lot actuel optimisé + le manifeste. C'est le bon moment : avant
   le premier push, l'historique ne gardera que les versions légères.
3. Ajouter l'action GitHub. Tester en déposant une photo de téléphone brute
   depuis `/keystatic` en production, vérifier le commit de l'action et le
   redéploiement.
4. Décider du mode Keystatic (commit direct ou branche + PR squash) selon la
   tolérance au résidu dans l'historique (section 5).
5. Hook husky, si l'équipe grandit.

Temps estimé : une demi-journée, tests inclus. Coût de fonctionnement : nul
(minutes GitHub Actions du plan gratuit, quelques secondes par run).
