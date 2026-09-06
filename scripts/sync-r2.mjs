#!/usr/bin/env node
/**
 * Synchronise `public/images/**` vers un bucket Cloudflare R2 (API S3).
 *
 *   node scripts/sync-r2.mjs            # envoie les fichiers manquants ou modifiés
 *   node scripts/sync-r2.mjs --dry-run  # affiche ce qui serait envoyé
 *   node scripts/sync-r2.mjs --force    # réenvoie tout
 *
 * Pourquoi un script et pas un upload direct depuis Keystatic ?
 * Keystatic est un CMS git-based : `fields.image` écrit toujours le fichier
 * dans le dépôt, c'est ce qui permet la prévisualisation dans l'admin et le
 * versionnage. R2 n'est qu'une origine de diffusion : on y pousse le contenu
 * de `public/images` après chaque build, et `lib/imageLoader.ts` sert les
 * images depuis le CDN.
 *
 * Lancé en fin de build par Workers Builds (voir README, « Déploiement »).
 * Exécution idempotente : un fichier inchangé n'est pas réenvoyé.
 *
 * Variables requises (voir .env.example) :
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Si aucune des quatre n'est définie, le script se termine sans erreur : c'est
 * le cas d'un déploiement sans R2 (images servies depuis /public), qui doit
 * rester possible. Une configuration partielle, elle, est une erreur.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { AwsClient } from 'aws4fetch'

const ROOT = path.join(process.cwd(), 'public', 'images')
/** Préfixe des clés dans le bucket : les URLs restent `/images/...` comme en local. */
const PREFIX = 'images'
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const R2_VARS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`✗ Variable d'environnement manquante : ${name}`)
    process.exit(1)
  }
  return value
}

/** Liste récursive des fichiers, dotfiles exclus (`.gitkeep`, `.DS_Store`). */
async function walk(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }

  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.isFile() && !entry.name.startsWith('.')) files.push(full)
  }
  return files
}

async function main() {
  if (R2_VARS.every((name) => !process.env[name])) {
    console.log('R2 non configuré (aucune variable R2_*) : synchronisation ignorée, les images seront servies depuis /public.')
    return
  }

  const accountId = requireEnv('R2_ACCOUNT_ID')
  const bucket = requireEnv('R2_BUCKET')
  const client = new AwsClient({
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    service: 's3',
    region: 'auto',
  })

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`
  const files = await walk(ROOT)

  if (files.length === 0) {
    console.log('Aucune image dans public/images — rien à synchroniser.')
    return
  }

  let uploaded = 0
  let skipped = 0

  for (const file of files) {
    // Clé POSIX quel que soit l'OS du build.
    const key = `${PREFIX}/${path.relative(ROOT, file).split(path.sep).join('/')}`
    const body = await readFile(file)
    const etag = createHash('md5').update(body).digest('hex')
    const url = `${endpoint}/${key}`

    if (!FORCE) {
      // L'ETag R2 d'un PUT simple est le MD5 du contenu : un HEAD (opération
      // classe B, quasi gratuite) suffit pour savoir si le fichier a changé.
      const head = await client.fetch(url, { method: 'HEAD' })
      if (head.ok && head.headers.get('etag')?.replace(/"/g, '') === etag) {
        skipped++
        continue
      }
    }

    const ext = path.extname(file).toLowerCase()
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'

    if (DRY_RUN) {
      const { size } = await stat(file)
      console.log(`→ ${key} (${contentType}, ${(size / 1024).toFixed(0)} Ko)`)
      uploaded++
      continue
    }

    const res = await client.fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': contentType,
        // Keystatic ne réutilise jamais un nom pour un contenu différent :
        // on peut mettre en cache un an et marquer immutable.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

    if (!res.ok) {
      console.error(`✗ ${key} — ${res.status} ${res.statusText}`)
      process.exitCode = 1
      continue
    }

    console.log(`✓ ${key}`)
    uploaded++
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}${uploaded} envoyé(s), ${skipped} inchangé(s), ${files.length} au total.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
