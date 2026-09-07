'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PublishError, PublishResult, PublishStatus } from '@/lib/publish'

interface Props {
  colorScheme: 'light' | 'dark'
}

/**
 * Bouton « Mettre en ligne » de l'admin Keystatic.
 *
 * Keystatic n'offre aucun point d'extension pour ajouter une action à son
 * interface, à une exception près : `ui.brand.mark` accepte un composant
 * React, rendu dans l'en-tête de la barre latérale. Ce composant s'y glisse,
 * affiche le petit logo attendu à cet endroit, et projette le bouton en bas à
 * droite de la page via un portail pour qu'il reste visible sur tous les
 * écrans de l'admin.
 *
 * L'en-tête est rendu deux fois (barre latérale bureau et tiroir mobile) :
 * seule la première instance montée porte le bouton, voir `useFirstInstance`.
 *
 * En stockage local (dev), il n'y a rien à publier : seul le logo est rendu.
 */
export default function PublishMark({ colorScheme }: Props) {
  return (
    <>
      <Mark />
      {GITHUB_STORAGE && <PublishButton colorScheme={colorScheme} />}
    </>
  )
}

const GITHUB_STORAGE = Boolean(
  process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER && process.env.NEXT_PUBLIC_GITHUB_REPO_NAME
)

/** Intervalle de rafraîchissement du compteur quand l'onglet reste ouvert. */
const POLL_MS = 60_000

/** Durée d'affichage de la confirmation après une mise en ligne. */
const CONFIRM_MS = 8_000

function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#551020" />
      <path d="M7.5 5.5h2.6v5.6l4.7-5.6h3.1l-5.1 6 5.5 7h-3.2l-4-5.3-1 1.2v4.1H7.5z" fill="#edeae4" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Instance unique
// ─────────────────────────────────────────────────────────────────────────────

const instances: Array<() => void> = []

/** Vrai pour la première instance montée ; réévalué à chaque montage/démontage. */
function useFirstInstance() {
  const [first, setFirst] = useState(false)
  useEffect(() => {
    const check = () => setFirst(instances[0] === check)
    instances.push(check)
    instances.forEach((fn) => fn())
    return () => {
      instances.splice(instances.indexOf(check), 1)
      instances.forEach((fn) => fn())
    }
  }, [])
  return first
}

// ─────────────────────────────────────────────────────────────────────────────
// Appels au route handler
// ─────────────────────────────────────────────────────────────────────────────

class PublishFailure extends Error {
  constructor(public readonly code: PublishError['error']) {
    super(code)
  }
}

/**
 * Appelle `/api/publier`. Le token GitHub de Keystatic expire après quelques
 * heures : sur un 401, on demande à Keystatic de le rafraîchir (son propre
 * endpoint, à partir du refresh token) et on réessaie une fois.
 */
async function api<T>(method: 'GET' | 'POST'): Promise<T> {
  const attempt = () => fetch('/api/publier', { method, credentials: 'same-origin' })
  let res = await attempt()
  if (res.status === 401) {
    const refreshed = await fetch('/api/keystatic/github/refresh-token', { method: 'POST', credentials: 'same-origin' })
    if (refreshed.ok) res = await attempt()
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as PublishError | null
    throw new PublishFailure(body?.error ?? 'upstream')
  }
  return (await res.json()) as T
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton
// ─────────────────────────────────────────────────────────────────────────────

type Phase =
  | { kind: 'loading' }
  | { kind: 'idle'; ahead: number | null }
  | { kind: 'publishing' }
  | { kind: 'published'; outcome: PublishResult['outcome'] }
  | { kind: 'error'; code: PublishError['error'] }

const ERROR_MESSAGES: Record<PublishError['error'], string> = {
  unauthenticated: 'Session expirée : rechargez la page.',
  forbidden: "Votre compte GitHub n'a pas le droit de publier.",
  conflict: 'Les branches ont divergé, une intervention manuelle est nécessaire.',
  unconfigured: '',
  upstream: "GitHub n'a pas répondu, réessayez dans un instant.",
}

function PublishButton({ colorScheme }: Props) {
  const first = useFirstInstance()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })

  const refresh = useCallback(async () => {
    try {
      const { ahead } = await api<PublishStatus>('GET')
      setPhase((current) => (current.kind === 'publishing' ? current : { kind: 'idle', ahead }))
    } catch (err) {
      const code = err instanceof PublishFailure ? err.code : 'upstream'
      setPhase({ kind: 'error', code })
    }
  }, [])

  // Compteur : au montage, au retour sur l'onglet, et périodiquement.
  useEffect(() => {
    if (!first) return
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [first, refresh])

  // La confirmation s'efface d'elle-même, puis le compteur repart de zéro.
  useEffect(() => {
    if (phase.kind !== 'published') return
    const timer = setTimeout(() => setPhase({ kind: 'idle', ahead: 0 }), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [phase])

  const publish = async () => {
    setPhase({ kind: 'publishing' })
    try {
      const { outcome } = await api<PublishResult>('POST')
      setPhase({ kind: 'published', outcome })
    } catch (err) {
      const code = err instanceof PublishFailure ? err.code : 'upstream'
      setPhase({ kind: 'error', code })
    }
  }

  if (!first || (phase.kind === 'error' && phase.code === 'unconfigured')) return null

  const busy = phase.kind === 'loading' || phase.kind === 'publishing'
  const nothingToPublish = phase.kind === 'idle' && phase.ahead === 0
  const disabled = busy || nothingToPublish

  const label =
    phase.kind === 'publishing' ? 'Mise en ligne…'
    : phase.kind === 'published' ? 'C’est parti'
    : nothingToPublish ? 'Site à jour'
    : 'Mettre en ligne'

  const hint =
    phase.kind === 'loading' ? 'Vérification des modifications…'
    : phase.kind === 'idle' && phase.ahead === null ? 'Première mise en ligne.'
    : phase.kind === 'idle' && phase.ahead && phase.ahead > 0
      ? `${phase.ahead} modification${phase.ahead > 1 ? 's' : ''} en attente.`
    : phase.kind === 'idle' ? 'Toutes les modifications sont en ligne.'
    : phase.kind === 'published' && phase.outcome === 'up-to-date' ? 'Le site était déjà à jour.'
    : phase.kind === 'published' ? 'Le site sera à jour dans quelques minutes.'
    : phase.kind === 'error' ? ERROR_MESSAGES[phase.code]
    : ''

  const dark = colorScheme === 'dark'

  return createPortal(
    <div
      data-component="PublishButton"
      className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-2 font-sans"
    >
      {hint && (
        <p
          role="status"
          className={`max-w-[260px] rounded-lg px-3 py-1.5 text-right text-[13px] leading-snug shadow-sm ${
            phase.kind === 'error'
              ? 'bg-bordeaux text-creme'
              : dark ? 'bg-gris text-creme' : 'bg-papier text-gris'
          }`}
        >
          {hint}
        </p>
      )}
      <button
        type="button"
        onClick={publish}
        disabled={disabled}
        aria-busy={busy}
        className={`rounded-full px-6 py-3 text-[14px] tracking-[.04em] uppercase shadow-md transition-opacity duration-300 ${
          phase.kind === 'published' ? 'bg-sauge text-encre' : 'bg-bordeaux text-creme'
        } ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:opacity-90'}`}
      >
        {label}
      </button>
    </div>,
    document.body
  )
}
