'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MATERIALS, PLANCHE_MAX, TILTS, TINT_FAMILIES, freeTint, type PlancheItem } from '@/lib/planche'
import { usePlanche } from './usePlanche'

/** État et actions de la planche, fournis par `usePlanche`. */
interface ComposerProps {
  board: PlancheItem[]
  isFull: boolean
  pin: (item: PlancheItem) => void
  remove: (id: string) => void
  clear: () => void
}

const LABEL = 'text-xs uppercase tracking-[.18em] text-(--fg-muted)'
const TEXT_LINK = 'cursor-pointer border-b border-bordeaux/40 text-[13px] text-bordeaux'

/**
 * La planche seule : quatre emplacements sur une ligne, sur fond liège, avec
 * compteur, croix de retrait et bouton « Vider ». Sert dans le composeur et
 * comme résumé dans la colonne du formulaire.
 */
export function PlancheBoard({ board, remove, clear }: Pick<ComposerProps, 'board' | 'remove' | 'clear'>) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <p className={LABEL}>
          Votre planche <span className="ml-1.5 normal-case tracking-normal text-encre/60">{board.length} / {PLANCHE_MAX}</span>
        </p>
        {board.length > 0 && (
          <button type="button" onClick={clear} className={TEXT_LINK}>
            Vider
          </button>
        )}
      </div>
      <div
        className="grid grid-cols-4 gap-2.5 rounded-mk p-3 shadow-[inset_0_0_0_1px_rgb(21_21_21/.08),0_14px_30px_-18px_rgb(21_21_21/.4)]"
        style={{ background: 'radial-gradient(rgba(0,0,0,.05) 1px,transparent 1px) 0 0/6px 6px, #C9B99A' }}
      >
        {Array.from({ length: PLANCHE_MAX }, (_, i) => {
          const p = board[i]
          return p ? (
            // `key` sur l'id : une pièce nouvelle est montée et joue l'animation,
            // les autres restent en place quand une voisine est retirée.
            <div key={p.id} className="mk-pin relative aspect-square rounded-mk shadow-[0_6px_14px_-6px_rgb(21_21_21/.5)]" style={{ background: p.bg, transform: TILTS[i] }}>
              <span aria-hidden="true" className="absolute -top-1.5 left-1/2 size-[9px] -translate-x-1/2 rounded-full bg-bordeaux shadow-[0_1px_2px_rgb(0_0_0/.4)]" />
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Retirer ${p.name}`}
                title="Retirer"
                className="absolute -right-1.5 -top-1.5 flex size-[22px] cursor-pointer items-center justify-center rounded-full bg-creme text-[15px] leading-none text-encre shadow-[0_1px_4px_rgb(21_21_21/.35)] transition-colors duration-200 hover:bg-bordeaux hover:text-creme"
              >
                ×
              </button>
              <span className="absolute inset-x-0 bottom-0 truncate bg-creme/92 px-1.5 py-1 text-left text-[10px] uppercase tracking-[.08em] text-encre">{p.name}</span>
            </div>
          ) : (
            <div key={`empty-${i}`} aria-hidden="true" className="flex aspect-square items-center justify-center rounded-mk border border-dashed border-encre/30 font-serif text-xl text-encre/40">
              +
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Composeur : planche, palette de teintes nommées, matières, couleur libre
 * repliée. Compact à dessein (moins de 520 px de haut) pour tenir entier dans
 * une colonne sticky : on doit voir la planche pendant qu'on la remplit.
 *
 * Partagé entre l'encart Prestations et le formulaire. Son seul état propre
 * est la couleur libre en cours de saisie et le nom survolé ; la planche
 * elle-même vient du hook, donc du localStorage.
 */
export function PlancheComposer({ board, isFull, pin, remove, clear }: ComposerProps) {
  const has = (id: string) => board.some((x) => x.id === id)
  const toggle = (item: PlancheItem) => (has(item.id) ? remove(item.id) : pin(item))

  // Nom de la pastille survolée ou focalisée, affiché à côté du libellé « Teintes ».
  const [hint, setHint] = useState<string | null>(null)
  // Couleur libre : on garde ce que l'utilisateur tape dans le champ hex, même
  // incomplet, et le sélecteur natif ne bouge que sur une valeur valide.
  const [free, setFree] = useState('#B5654A')
  const [freeInput, setFreeInput] = useState<string | null>(null)
  const freeItem = freeTint(free)

  const onHex = (raw: string) => {
    let v = raw.trim()
    if (v && v[0] !== '#') v = '#' + v
    setFreeInput(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setFree(v.toUpperCase())
  }

  const left = PLANCHE_MAX - board.length
  const status = isFull
    ? 'Planche complète : retirez une pièce pour en changer.'
    : board.length === 0
      ? 'Cliquez sur une teinte ou une matière pour l’épingler.'
      : `Encore ${left} emplacement${left > 1 ? 's' : ''}, ou continuez ainsi.`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <PlancheBoard board={board} remove={remove} clear={clear} />
        <p className="text-[13px] leading-[1.45] text-(--fg-muted)" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className={LABEL}>
          Teintes
          <span className="ml-2 min-h-[1em] font-serif normal-case italic tracking-normal text-bordeaux" aria-live="polite">
            {hint}
          </span>
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {TINT_FAMILIES.map((fam) => (
            <div key={fam.name} role="group" aria-label={fam.name} className="flex gap-2">
              {fam.items.map((t) => {
                const on = has(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t)}
                    onMouseEnter={() => setHint(t.name)}
                    onMouseLeave={() => setHint(null)}
                    onFocus={() => setHint(t.name)}
                    onBlur={() => setHint(null)}
                    disabled={isFull && !on}
                    aria-label={t.name}
                    aria-pressed={on}
                    title={t.name}
                    className="size-10 cursor-pointer rounded-full transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{
                      background: t.bg,
                      boxShadow: on ? '0 0 0 2px var(--color-creme), 0 0 0 3.5px var(--color-bordeaux)' : '0 0 0 1px rgb(21 21 21 / .15)',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className={LABEL}>Matières</p>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => {
            const on = has(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m)}
                disabled={isFull && !on}
                aria-pressed={on}
                className={`flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13px] transition-colors duration-250 disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? 'border-bordeaux bg-bordeaux text-creme' : 'border-(--line-strong) hover:border-encre'
                }`}
              >
                <span aria-hidden="true" className="size-7 flex-none rounded-full shadow-[inset_0_0_0_1px_rgb(21_21_21/.12)]" style={{ background: m.bg }} />
                {m.name}
              </button>
            )
          })}
        </div>
      </div>

      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 font-serif text-[15px] italic text-bordeaux [&::-webkit-details-marker]:hidden">
          <span className="not-italic transition-transform duration-300 group-open:rotate-90" aria-hidden="true">
            →
          </span>
          Une autre couleur ?
        </summary>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="color"
            className="mk-color"
            value={free}
            onChange={(e) => {
              setFree(e.target.value.toUpperCase())
              setFreeInput(null)
            }}
            aria-label="Choisir une couleur libre"
          />
          <input
            type="text"
            value={freeInput ?? free}
            onChange={(e) => onHex(e.target.value)}
            placeholder="#B5654A"
            maxLength={7}
            spellCheck={false}
            aria-label="Code hexadécimal"
            className="field w-[104px] py-2 text-[15px] uppercase tracking-[.06em]"
          />
          <span className="font-serif text-[15px] italic text-bordeaux">{freeItem.name}</span>
          <button
            type="button"
            onClick={() => pin(freeItem)}
            disabled={isFull || has(freeItem.id)}
            className="cursor-pointer whitespace-nowrap border border-encre px-4 py-2.5 text-xs uppercase tracking-[.14em] transition-colors duration-300 hover:bg-encre hover:text-creme disabled:cursor-not-allowed disabled:opacity-40"
          >
            Épingler
          </button>
        </div>
      </details>
    </div>
  )
}

/**
 * Encart de la page Prestations : composeur + bouton « Continuer avec ma
 * planche » vers le formulaire, actif dès qu'une pièce est épinglée. Le
 * formulaire retrouve la planche via le localStorage.
 */
export default function PlancheTeintes({ formUrl = '/votre-projet' }: { formUrl?: string }) {
  const planche = usePlanche()
  const empty = planche.board.length === 0

  return (
    <div data-component="PlancheTeintes" data-sketch="" className="flex flex-col gap-7">
      <div>
        <p className={LABEL}>Composez votre planche</p>
        <p className="mt-2 max-w-[30ch] font-serif text-[17px] italic leading-[1.35] text-bordeaux">
          Cliquez sur une teinte ou une matière pour l’épingler, jusqu’à quatre : le moodboard commence ici.
        </p>
      </div>
      <PlancheComposer {...planche} />
      <div className="flex flex-col gap-2.5">
        <Link
          href={formUrl}
          aria-disabled={empty}
          tabIndex={empty ? -1 : undefined}
          className={`inline-flex items-center justify-between gap-4 rounded-mk bg-bordeaux px-[22px] py-4 text-xs uppercase tracking-[.14em] text-creme transition-[opacity,background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-bordeaux-2 ${
            empty ? 'pointer-events-none opacity-45' : ''
          }`}
        >
          <span>Décrire ma pièce avec cette planche</span>
          <span aria-hidden="true" className="text-lg leading-none">→</span>
        </Link>
        <p className="text-[13px] leading-[1.45] text-(--fg-muted)">
          {empty ? 'Épinglez au moins une teinte ou matière pour continuer.' : `Votre planche : ${planche.board.map((x) => x.name).join(', ')}.`}
        </p>
      </div>
    </div>
  )
}
