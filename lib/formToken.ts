/**
 * Jeton opaque transportant l'adresse destinataire d'un formulaire.
 *
 * Le formulaire « Votre projet » est un composant client et, sur Cloudflare
 * Workers, la server action ne peut pas relire le contenu Keystatic (pas de
 * système de fichiers à l'exécution). L'adresse saisie dans l'admin est donc
 * chiffrée au pré-rendu, transmise au navigateur sous forme de chaîne opaque,
 * puis déchiffrée par la server action.
 *
 * Ce que ça garantit :
 * - l'adresse n'apparaît ni dans le HTML ni dans le payload React, donc pas de
 *   récolte par les robots à spam ;
 * - un tiers ne peut pas détourner le formulaire vers une adresse arbitraire,
 *   seul un jeton chiffré avec `FORM_TOKEN_SECRET` est accepté.
 *
 * AES-GCM via Web Crypto, disponible sous Node 20+ comme sur Workers. Le secret
 * doit être identique au build et à l'exécution (le cas dans un déploiement
 * Cloudflare, où les deux tournent avec les mêmes variables).
 *
 * @see app/actions/submitProjet.ts
 * @see components/modules/ModuleRenderer.tsx
 */

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** Taille du vecteur d'initialisation AES-GCM (12 octets, valeur recommandée). */
const IV_LENGTH = 12

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * Dérive la clé AES depuis le secret (SHA-256 : le secret peut être de
 * n'importe quelle longueur). Retourne `null` si le secret n'est pas défini,
 * pour que le build passe sans variable d'environnement.
 */
async function getKey(): Promise<CryptoKey | null> {
  const secret = process.env.FORM_TOKEN_SECRET
  if (!secret) return null

  const material = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Chiffre une adresse destinataire en jeton base64url (IV + chiffré).
 *
 * @returns le jeton, ou `null` si `FORM_TOKEN_SECRET` est absent.
 */
export async function encryptRecipient(email: string): Promise<string | null> {
  const key = await getKey()
  if (!key) return null

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(email))
  )

  const payload = new Uint8Array(iv.length + ciphertext.length)
  payload.set(iv)
  payload.set(ciphertext, iv.length)

  return toBase64Url(payload)
}

/**
 * Déchiffre un jeton produit par {@link encryptRecipient}.
 *
 * @returns l'adresse, ou `null` si le jeton est invalide, forgé ou chiffré
 * avec un autre secret (GCM authentifie le contenu : toute altération échoue).
 */
export async function decryptRecipient(token: string): Promise<string | null> {
  const key = await getKey()
  if (!key) return null

  try {
    const payload = fromBase64Url(token)
    const iv = payload.slice(0, IV_LENGTH)
    const ciphertext = payload.slice(IV_LENGTH)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return decoder.decode(plaintext)
  } catch {
    return null
  }
}
