'use server'

/**
 * Server action du formulaire « Votre projet » : valide le payload, déchiffre
 * l'adresse destinataire et envoie l'e-mail via Resend, photo en pièce jointe.
 *
 * Rien n'est stocké côté serveur : pas de base, pas de bucket, rien à purger.
 *
 * @see lib/formToken.ts pour le jeton destinataire
 * @see components/interactive/ProjetForm.tsx pour le client
 */

import { Resend } from 'resend'
import { decryptRecipient } from '@/lib/formToken'

/**
 * Instanciation paresseuse : le constructeur Resend jette si la clé est
 * absente, ce qui casserait le build tant que `RESEND_API_KEY` n'est pas
 * configurée (preview, CI sans secrets).
 */
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export interface ProjetPayload {
  /** Adresse destinataire chiffrée au pré-rendu. Jamais l'adresse en clair. */
  recipient_token: string
  /** Slug de la page d'origine, repris dans le corps de l'e-mail. */
  page_slug: string
  nom: string
  telephone: string
  email: string
  piece: string
  ambiances: string[]
  /** Résumé texte de la planche de teintes (« Terracotta doux (#B5654A), Chêne clair »). */
  planche: string
  /** Photo redimensionnée côté client, en base64 sans préfixe `data:`. */
  photo?: { filename: string; content_type: string; base64: string } | null
}

/**
 * Garde-fou serveur sur la taille de la photo (~1,5 Mo décodés). Le client
 * réduit l'image bien en dessous ; cette limite ne sert qu'à rejeter un
 * payload forgé.
 */
const MAX_PHOTO_BASE64 = 2_000_000

/**
 * Envoie la demande de projet par e-mail.
 *
 * Les messages d'erreur retournés sont destinés à l'affichage : ils restent
 * génériques, le détail part dans les logs du Worker.
 *
 * @returns `{ success: true }` ou `{ success: false, error }` avec un message affichable.
 */
export async function submitProjet(payload: ProjetPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend()
    if (!resend) {
      console.error('[submitProjet] RESEND_API_KEY manquante')
      return { success: false, error: "Service d'envoi indisponible. Réessayez plus tard, ou écrivez-moi sur WhatsApp." }
    }

    const emailTo = await decryptRecipient(payload.recipient_token)
    if (!emailTo) {
      console.error('[submitProjet] jeton destinataire invalide ou FORM_TOKEN_SECRET manquante')
      return { success: false, error: 'Formulaire mal configuré : destinataire introuvable.' }
    }

    // Validation minimale : les champs sont déjà `required` côté client, on
    // se protège seulement d'un appel direct à l'action.
    const nom = payload.nom.trim()
    const email = payload.email.trim()
    const telephone = payload.telephone.trim()
    if (!nom || !email || !telephone) return { success: false, error: 'Nom, téléphone et e-mail sont nécessaires pour vous rappeler.' }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { success: false, error: "L'adresse e-mail semble incorrecte." }
    if (payload.photo && payload.photo.base64.length > MAX_PHOTO_BASE64) {
      return { success: false, error: 'La photo est trop lourde. Réessayez avec une image plus petite.' }
    }

    const lignes = [
      `Nom : ${nom}`,
      `Téléphone : ${telephone}`,
      `E-mail : ${email}`,
      '',
      `Pièce : ${payload.piece || 'non précisée'}`,
      `Ambiance : ${payload.ambiances.length ? payload.ambiances.join(', ') : 'non précisée'}`,
      `Planche : ${payload.planche || 'aucune'}`,
      `Photo : ${payload.photo ? 'jointe' : 'aucune'}`,
    ]

    // E-mail texte brut : lu sur téléphone, réponse directe au client via replyTo.
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'contact@maisonk.fr',
      to: emailTo,
      replyTo: email,
      subject: `Nouveau projet — ${payload.piece || 'pièce à préciser'} (${nom})`,
      text: `Nouvelle demande depuis /${payload.page_slug}\n\n${lignes.join('\n')}`,
      attachments: payload.photo
        ? [{ filename: payload.photo.filename, content: payload.photo.base64, contentType: payload.photo.content_type }]
        : undefined,
    })

    if (error) {
      console.error('[submitProjet] resend', error)
      return { success: false, error: "Erreur lors de l'envoi. Veuillez réessayer." }
    }

    return { success: true }
  } catch (err) {
    console.error('[submitProjet]', err)
    return { success: false, error: "Erreur lors de l'envoi. Veuillez réessayer." }
  }
}
