'use client'

import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import ArrowLink from '@/components/ui/ArrowLink'
import Eyebrow from '@/components/ui/Eyebrow'
import Heading from '@/components/ui/Heading'
import { submitProjet } from '@/app/actions/submitProjet'
import { TILTS, plancheSummary } from '@/lib/planche'
import type { Icone, Lien } from '@/lib/types'
import { PlancheComposer } from './PlancheTeintes'
import { usePlanche } from './usePlanche'

export interface ProjetFormProps {
  eyebrow?: string | null
  icone: Icone
  titre: string
  intro?: string | null
  level: 1 | 2
  pieces: string[]
  ambiances: string[]
  max_ambiances: number
  photo_activee: boolean
  label_envoi?: string | null
  note_envoi?: string | null
  confirmation: { titre?: string | null; texte?: string | null; etapes: string[]; lien: Lien }
  /** Lien de la confirmation déjà résolu côté serveur. */
  confirmationLien: { label: string; url: string; external: boolean } | null
  pageSlug: string
  /** Adresse destinataire chiffrée au pré-rendu ; null si FORM_TOKEN_SECRET manque. */
  recipientToken: string | null
}

const AUTRE = 'Autre…'
const PHOTO_MAX_PX = 1600
const PHOTO_QUALITY = 0.82

/**
 * Formulaire « Votre projet » : pièce (choix unique), ambiances (choix multiple
 * borné), photo redimensionnée dans le navigateur, coordonnées, planche de
 * teintes reprise du localStorage. L'envoi passe par la server action
 * `submitProjet` (Resend, photo en pièce jointe) ; la confirmation remplace le
 * formulaire sans changer de page.
 */
export default function ProjetForm(props: ProjetFormProps) {
  const { eyebrow, icone, titre, intro, level, pieces, ambiances, max_ambiances, photo_activee, label_envoi, note_envoi, confirmation, confirmationLien, pageSlug, recipientToken } = props
  const formId = useId()
  const planche = usePlanche()

  const [room, setRoom] = useState('')
  const [roomOther, setRoomOther] = useState('')
  const [moods, setMoods] = useState<string[]>([])
  const [moodOther, setMoodOther] = useState('')
  const [photo, setPhoto] = useState<{ preview: string; base64: string; filename: string; type: string } | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [boardEditing, setBoardEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.preview)
  }, [photo])

  const toggleMood = (m: string) =>
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : cur.length < max_ambiances ? [...cur, m] : cur))

  const onPhoto = async (file: File | undefined) => {
    setPhotoError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choisissez une image (JPG, PNG, HEIC…).')
      return
    }
    try {
      const resized = await resizeImage(file)
      if (photo) URL.revokeObjectURL(photo.preview)
      setPhoto({ preview: URL.createObjectURL(resized.blob), base64: resized.base64, filename: 'piece.jpg', type: 'image/jpeg' })
    } catch {
      setPhotoError("Impossible de lire cette photo. Essayez un autre fichier.")
    }
  }

  const clearPhoto = () => {
    if (photo) URL.revokeObjectURL(photo.preview)
    setPhoto(null)
  }

  const roomFinal = room === AUTRE ? roomOther.trim() : room
  const moodsFinal = moods.map((m) => (m === AUTRE ? moodOther.trim() : m)).filter(Boolean)
  const firstName = name.trim().split(/\s+/)[0] || ''

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!recipientToken) {
      setError('Formulaire mal configuré : écrivez-moi directement sur WhatsApp ou par e-mail.')
      return
    }
    setSending(true)
    const result = await submitProjet({
      recipient_token: recipientToken,
      page_slug: pageSlug,
      nom: name,
      telephone: phone,
      email,
      piece: roomFinal,
      ambiances: moodsFinal,
      planche: plancheSummary(planche.board),
      photo: photo ? { filename: photo.filename, content_type: photo.type, base64: photo.base64 } : null,
    })
    setSending(false)
    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'envoi.")
      return
    }
    setSent(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const etape = (num: string, label: string, hint?: string) => (
    <p className="flex flex-wrap items-baseline gap-3">
      <span className="num">{num}</span>
      <span className="font-serif text-[22px]">{label}</span>
      {hint && <span className="text-[13px] text-(--fg-muted)">{hint}</span>}
    </p>
  )

  const chip = (label: string, on: boolean, onClick: () => void, disabled = false) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
      className={`cursor-pointer rounded-full border px-[18px] py-[11px] text-sm transition-colors duration-250 disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? 'border-bordeaux bg-bordeaux text-creme' : 'border-(--line-strong) hover:border-encre'
      }`}
    >
      {label}
    </button>
  )

  const card = 'flex flex-col rounded-mk bg-creme p-[clamp(24px,3.5vw,44px)] shadow-[0_24px_50px_-30px_rgb(21_21_21/.35)]'

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[clamp(40px,6vw,96px)]">
      {/* Colonne gauche : intro + planche */}
      <div className="md:sticky md:top-24">
        {eyebrow && <Eyebrow icone={icone} className="mb-[22px]">{eyebrow}</Eyebrow>}
        <Heading level={level} className="text-[clamp(40px,4.6vw,68px)] leading-[1.04]">
          {titre}
        </Heading>
        {intro && <p className="lead mt-7 max-w-[44ch]">{intro}</p>}

        {boardEditing ? (
          <div className="mt-10 flex flex-col gap-[22px]">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-xs uppercase tracking-[.18em] text-(--fg-muted)">Composez votre planche</p>
              <button type="button" onClick={() => setBoardEditing(false)} className="cursor-pointer border-b border-bordeaux/40 text-[13px] text-bordeaux">
                Terminer
              </button>
            </div>
            <PlancheComposer board={planche.board} isFull={planche.isFull} pin={planche.pin} remove={planche.remove} pinLabel="Choisir la teinte" />
          </div>
        ) : planche.board.length > 0 ? (
          <div className="mt-10 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-xs uppercase tracking-[.18em] text-(--fg-muted)">Votre planche</p>
              <button type="button" onClick={() => setBoardEditing(true)} className="cursor-pointer border-b border-bordeaux/40 text-[13px] text-bordeaux">
                Modifier
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {planche.board.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => planche.remove(p.id)}
                  title="Retirer"
                  aria-label={`Retirer ${p.name}`}
                  className="relative size-[72px] cursor-pointer rounded-mk shadow-[0_6px_14px_-6px_rgb(21_21_21/.5)] transition-transform duration-300 hover:scale-[.96]"
                  style={{ background: p.bg, transform: TILTS[i] }}
                >
                  <span aria-hidden="true" className="absolute -top-[5px] left-1/2 size-2 -translate-x-1/2 rounded-full bg-bordeaux" />
                </button>
              ))}
            </div>
            <p className="font-serif text-base italic text-bordeaux">{planche.board.map((x) => x.name).join(' · ')}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBoardEditing(true)}
            className="mt-10 inline-flex w-max max-w-full cursor-pointer items-center gap-3 border-b border-bordeaux/40 pb-0.5 text-left font-serif text-[17px] italic text-bordeaux"
          >
            Envie de composer d’abord votre planche de teintes ? <span aria-hidden="true" className="not-italic">→</span>
          </button>
        )}
      </div>

      {/* Colonne droite : formulaire ou confirmation */}
      {sent ? (
        <div data-component="ProjetForm" data-state="success" className={`${card} gap-7`}>
          <p className="text-xs uppercase tracking-[.18em] text-(--fg-muted)">C’est noté</p>
          <h2 className="text-[clamp(28px,3vw,40px)] leading-[1.15]">
            {(confirmation.titre || 'Merci {prenom}, je prépare notre échange.').replace(/\s*\{prenom\}/g, firstName ? ` ${firstName}` : '')}
          </h2>
          <p className="lead max-w-[46ch] leading-[1.55]">
            {[
              `Votre ${roomFinal ? roomFinal.toLowerCase() : 'projet'}`,
              moodsFinal.length ? `ambiance ${moodsFinal.join(', ').toLowerCase()}` : null,
              planche.board.length ? `avec votre planche ${planche.board.map((x) => x.name.toLowerCase()).join(', ')}` : null,
            ]
              .filter(Boolean)
              .join(', ')}
            {' : '}
            {confirmation.texte || "j'ai tout ce qu'il me faut pour vous appeler avec de premières idées."}
          </p>
          {confirmation.etapes.length > 0 && (
            <ol className="flex flex-col gap-3.5 border-t border-(--line) pt-6">
              {confirmation.etapes.map((e, i) => (
                <li key={e} className="flex items-baseline gap-4">
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{e}</span>
                </li>
              ))}
            </ol>
          )}
          {confirmationLien && <ArrowLink {...confirmationLien} variant="italic" />}
        </div>
      ) : (
        <form onSubmit={onSubmit} data-component="ProjetForm" className={`${card} gap-11`}>
          <fieldset className="flex flex-col gap-4">
            <legend className="contents">{etape('01', 'Quelle pièce ?')}</legend>
            <div className="flex flex-wrap gap-2">
              {[...pieces, AUTRE].map((p) => chip(p, room === p, () => setRoom((cur) => (cur === p ? '' : p))))}
            </div>
            {room === AUTRE && (
              <input className="field max-w-[360px] py-2.5 text-[15px]" type="text" placeholder="Précisez la pièce" value={roomOther} onChange={(e) => setRoomOther(e.target.value)} />
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="contents">{etape('02', 'Quelle ambiance ?', `jusqu’à ${max_ambiances}`)}</legend>
            <div className="flex flex-wrap gap-2">
              {[...ambiances, AUTRE].map((m) => chip(m, moods.includes(m), () => toggleMood(m), !moods.includes(m) && moods.length >= max_ambiances))}
            </div>
            {moods.includes(AUTRE) && (
              <input className="field max-w-[360px] py-2.5 text-[15px]" type="text" placeholder="Votre mot à vous" value={moodOther} onChange={(e) => setMoodOther(e.target.value)} />
            )}
          </fieldset>

          {photo_activee && (
            <fieldset className="flex flex-col gap-4">
              <legend className="contents">{etape('03', 'Une photo de la pièce', 'facultatif, un seul cliché suffit')}</legend>
              <label className="relative flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-mk border border-dashed border-(--line-strong) bg-sable/35 p-[18px] text-center transition-colors duration-300 hover:border-bordeaux hover:bg-sable/60">
                <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} className="absolute inset-0 cursor-pointer opacity-0" />
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), hors loader
                  <img src={photo.preview} alt="Votre pièce" className="block max-h-[260px] w-full rounded-mk object-cover" />
                ) : (
                  <span className="font-serif text-[17px] italic text-bordeaux">Glissez une photo ici, ou cliquez pour choisir</span>
                )}
              </label>
              {photoError && <p className="text-[13px] text-bordeaux">{photoError}</p>}
              {photo && (
                <button type="button" onClick={clearPhoto} className="cursor-pointer self-start text-[13px] text-(--fg-muted) underline">
                  Retirer la photo
                </button>
              )}
            </fieldset>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className="contents">{etape(photo_activee ? '04' : '03', 'Coordonnées')}</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[18px]">
              <input id={`${formId}-nom`} className="field" required type="text" autoComplete="name" placeholder="Prénom et nom" aria-label="Prénom et nom" value={name} onChange={(e) => setName(e.target.value)} />
              <input id={`${formId}-tel`} className="field" required type="tel" autoComplete="tel" placeholder="Téléphone" aria-label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input id={`${formId}-email`} className="field" required type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            {error && (
              <p role="alert" className="text-[15px] text-bordeaux">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex cursor-pointer items-center justify-between gap-4 rounded-mk bg-bordeaux px-6 py-[18px] text-xs uppercase tracking-[.14em] text-creme transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-bordeaux-2 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{sending ? 'Envoi…' : label_envoi || 'Envoyer'}</span>
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </button>
            {note_envoi && <p className="text-[13px] leading-[1.45] text-(--fg-muted)">{note_envoi}</p>}
          </div>
        </form>
      )}
    </div>
  )
}

/**
 * Réduit la photo à 1 600 px max et la ré-encode en JPEG : l'e-mail reste léger
 * et rien n'est stocké côté serveur. Retourne aussi le base64 sans préfixe.
 */
async function resizeImage(file: File): Promise<{ blob: Blob; base64: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', PHOTO_QUALITY)
  )
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  return { blob, base64: dataUrl.slice(dataUrl.indexOf(',') + 1) }
}
