#!/usr/bin/env node
/**
 * Produit la tuile « papier aquarelle » du hero à partir d'une photo de papier :
 * `public/images/decor/papier.webp`.
 *
 *   node scripts/gen-papier.mjs <photo> [x] [y]
 *
 * `photo` est un scan ou une photo de papier texturé ; `x` et `y` désignent le
 * coin haut gauche de la zone à prélever (par défaut 894, 464, calés sur la
 * photo de référence de Carole, un visuel Instagram dont la partie droite est
 * vierge). La photo source n'est pas versionnée : seule la tuile l'est.
 *
 * Traitement :
 *   1. prélèvement d'une zone de 320 × 320 px, passée en niveaux de gris ;
 *   2. aplanissement : on retire le flou large (éclairage inégal, vignettage)
 *      pour ne garder que le relief du grain ;
 *   3. raccord : les 64 px de marge gauche et haute sont fondus dans le bord
 *      opposé, la tuile de 256 px se répète alors sans couture ;
 *   4. recentrage autour du blanc : la tuile est posée en
 *      `background-blend-mode: multiply` sur une couleur unie (`.mk-papier`,
 *      globals.css), elle ne porte que le relief, jamais la teinte.
 *
 * Choisi en raster plutôt qu'en `feTurbulence` : un bitmap composité une fois
 * ne coûte rien pendant l'animation du croquis.
 */

import path from 'node:path'
import sharp from 'sharp'

const SIZE = 256
/** Marge fondue sur le bord opposé pour le raccord. */
const OVERLAP = 64
const OUT = path.join(process.cwd(), 'public', 'images', 'decor', 'papier.webp')

const [, , photo, argX = '894', argY = '464'] = process.argv
if (!photo) {
  console.error('usage : node scripts/gen-papier.mjs <photo> [x] [y]')
  process.exit(1)
}
const left = Number(argX) - OVERLAP
const top = Number(argY) - OVERLAP
const SRC = SIZE + OVERLAP

const region = sharp(photo).extract({ left, top, width: SRC, height: SRC }).grayscale()
const [fine, blurred] = await Promise.all([
  region.clone().raw().toBuffer(),
  region.clone().blur(14).raw().toBuffer(),
])

// Relief seul, centré sur 0, dans [-1, 1].
const relief = new Float32Array(SRC * SRC)
for (let i = 0; i < relief.length; i++) relief[i] = (fine[i] - blurred[i]) / 255

// Raccord : dans la bande de droite, on fond progressivement vers ce qui
// précède le bord gauche (marge négative), idem en bas vers le haut.
const at = (x, y) => relief[(y + OVERLAP) * SRC + (x + OVERLAP)]
const ramp = (x) => (x < SIZE - OVERLAP ? 0 : (x - (SIZE - OVERLAP)) / OVERLAP)
const tile = new Float32Array(SIZE * SIZE)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const wx = ramp(x)
    const wy = ramp(y)
    // Hors des bandes, le second terme n'est pas lu : son index serait négatif.
    const row = (yy) => (wx ? at(x, yy) * (1 - wx) + at(x - SIZE, yy) * wx : at(x, yy))
    tile[y * SIZE + x] = wy ? row(y) * (1 - wy) + row(y - SIZE) * wy : row(y)
  }
}

// Recentrage : blanc en moyenne, relief amplifié pour rester visible sous le
// multiply. Une valeur au-dessus de 1 est écrêtée, ce qui n'est pas visible.
const MEAN = 0.965
const GAIN = 1.9
const px = new Uint8Array(SIZE * SIZE)
for (let i = 0; i < px.length; i++) px[i] = Math.round(Math.max(0, Math.min(1, MEAN + tile[i] * GAIN)) * 255)

await sharp(Buffer.from(px), { raw: { width: SIZE, height: SIZE, channels: 1 } })
  .webp({ quality: 90, effort: 6 })
  .toFile(OUT)

console.log(`écrit ${path.relative(process.cwd(), OUT)} depuis ${path.basename(photo)} (${argX}, ${argY})`)
