'use client'

import { useCallback, useEffect, useState } from 'react'
import { PLANCHE_MAX, PLANCHE_STORAGE_KEY, type PlancheItem } from '@/lib/planche'

/**
 * État de la planche de teintes, partagé entre l'encart de la page Prestations
 * et le formulaire « Votre projet » via localStorage.
 *
 * L'hydratation se fait après le montage pour que le rendu serveur (planche
 * vide) corresponde au premier rendu client ; `ready` permet d'attendre avant
 * d'afficher un état « vide » définitif.
 *
 * Le localStorage peut être indisponible (navigation privée, quota) : chaque
 * accès est protégé et la planche reste alors en mémoire pour la page courante.
 */
export function usePlanche() {
  const [board, setBoard] = useState<PlancheItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLANCHE_STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        // On ne valide pas la forme des éléments : c'est notre propre écriture,
        // et un élément malformé ne casse que son rendu.
        if (Array.isArray(parsed)) setBoard(parsed.slice(0, PLANCHE_MAX) as PlancheItem[])
      }
    } catch {
      // localStorage indisponible : la planche reste en mémoire.
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: PlancheItem[]) => {
    setBoard(next)
    try {
      window.localStorage.setItem(PLANCHE_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // idem
    }
  }, [])

  // `pin` et `remove` passent par la forme fonctionnelle de setState pour
  // rester corrects en cas de clics rapprochés ; l'écriture localStorage se
  // fait dans le même passage pour ne pas diverger de l'état.
  const pin = useCallback(
    (item: PlancheItem) => {
      setBoard((current) => {
        if (current.length >= PLANCHE_MAX || current.some((x) => x.id === item.id)) return current
        const next = [...current, item]
        try {
          window.localStorage.setItem(PLANCHE_STORAGE_KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    []
  )

  const remove = useCallback(
    (id: string) => {
      setBoard((current) => {
        const next = current.filter((x) => x.id !== id)
        try {
          window.localStorage.setItem(PLANCHE_STORAGE_KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    []
  )

  const clear = useCallback(() => persist([]), [persist])

  return { board, ready, pin, remove, clear, isFull: board.length >= PLANCHE_MAX }
}
