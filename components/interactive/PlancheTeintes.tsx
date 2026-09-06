'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MATERIALS, PLANCHE_MAX, TILTS, hexToHsl, hslToHex, hueName, type PlancheItem } from '@/lib/planche'
import { usePlanche } from './usePlanche'

interface ComposerProps {
  board: PlancheItem[]
  isFull: boolean
  pin: (item: PlancheItem) => void
  remove: (id: string) => void
  /** Libellé du bouton d'épinglage d'une teinte. */
  pinLabel?: string
}

/**
 * Composeur : sélecteur teinte / clarté / hex, six matières, planche 2 × 2.
 * Sans état propre à part la couleur en cours : la planche vient du hook.
 */
export function PlancheComposer({ board, isFull, pin, remove, pinLabel = 'Épingler la teinte' }: ComposerProps) {
  const [hue, setHue] = useState(350)
  const [sat, setSat] = useState(42)
  const [light, setLight] = useState(38)
  const [hexInput, setHexInput] = useState<string | null>(null)

  const color = `hsl(${hue} ${sat}% ${light}%)`
  const hex = hexInput ?? hslToHex(hue, sat, light)
  const has = (id: string) => board.some((x) => x.id === id)

  const onHex = (raw: string) => {
    let v = raw.trim()
    if (v && v[0] !== '#') v = '#' + v
    setHexInput(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const c = hexToHsl(v)
      setHue(c.h)
      setSat(c.s)
      setLight(Math.max(15, Math.min(85, c.l)))
    }
  }

  const pinHue = () => pin({ id: `hue-${hue}-${sat}-${light}`, name: hueName(hue, light), bg: color, hex: hslToHex(hue, sat, light) })

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3.5">
          <div
            aria-hidden="true"
            className="size-[52px] flex-none rounded-full shadow-[0_0_0_2px_var(--color-creme),0_0_0_3.5px_rgb(85_16_32/.35)] transition-colors duration-200"
            style={{ background: color }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              type="range"
              className="mk-slider"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => {
                setHue(Number(e.target.value))
                setSat(42)
                setHexInput(null)
              }}
              aria-label="Teinte"
              style={{ background: 'linear-gradient(90deg,hsl(0 45% 50%),hsl(60 45% 50%),hsl(120 45% 50%),hsl(180 45% 50%),hsl(240 45% 50%),hsl(300 45% 50%),hsl(360 45% 50%))' }}
            />
            <input
              type="range"
              className="mk-slider"
              min={15}
              max={85}
              value={light}
              onChange={(e) => {
                setLight(Number(e.target.value))
                setHexInput(null)
              }}
              aria-label="Clarté"
              style={{ background: `linear-gradient(90deg,hsl(${hue} ${sat}% 15%),hsl(${hue} ${sat}% 50%),hsl(${hue} ${sat}% 85%))` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={hex}
            onChange={(e) => onHex(e.target.value)}
            placeholder="#551020"
            maxLength={7}
            spellCheck={false}
            aria-label="Code hexadécimal"
            className="field w-[110px] py-2.5 text-[15px] uppercase tracking-[.06em]"
          />
          <button
            type="button"
            onClick={pinHue}
            disabled={isFull}
            className="cursor-pointer whitespace-nowrap border border-encre px-5 py-[11px] text-xs uppercase tracking-[.14em] transition-colors duration-300 hover:bg-encre hover:text-creme disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pinLabel}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-xs uppercase tracking-[.18em] text-(--fg-muted)">Matières</p>
        <div className="flex flex-wrap gap-2.5">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pin(m)}
              disabled={isFull && !has(m.id)}
              aria-label={m.name}
              aria-pressed={has(m.id)}
              title={m.name}
              className="size-[46px] cursor-pointer rounded-mk transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: m.bg,
                boxShadow: has(m.id) ? '0 0 0 2px var(--color-creme), 0 0 0 3.5px var(--color-bordeaux)' : '0 0 0 1px rgb(21 21 21 / .15)',
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-3.5 rounded-mk p-[18px] shadow-[inset_0_0_0_1px_rgb(21_21_21/.08),0_14px_30px_-18px_rgb(21_21_21/.4)]"
        style={{ background: 'radial-gradient(rgba(0,0,0,.05) 1px,transparent 1px) 0 0/6px 6px, #C9B99A' }}
      >
        {Array.from({ length: PLANCHE_MAX }, (_, i) => {
          const p = board[i]
          return (
            <div key={i} className="relative flex items-center justify-center">
              {p ? (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Retirer ${p.name}`}
                  title="Retirer"
                  className="relative size-full cursor-pointer rounded-mk shadow-[0_6px_14px_-6px_rgb(21_21_21/.5)] transition-transform duration-300 hover:scale-[.97]"
                  style={{ background: p.bg, transform: TILTS[i] }}
                >
                  <span aria-hidden="true" className="absolute -top-1.5 left-1/2 size-[9px] -translate-x-1/2 rounded-full bg-bordeaux shadow-[0_1px_2px_rgb(0_0_0/.4)]" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-creme/92 px-[7px] py-[5px] text-left text-[10px] uppercase tracking-[.1em] text-encre">{p.name}</span>
                </button>
              ) : (
                <div className="flex size-full items-center justify-center rounded-mk border border-dashed border-encre/30 font-serif text-[13px] italic text-encre/45">
                  {i === 0 ? 'Votre première pièce' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Encart de la page Prestations : composeur + bouton « Continuer avec ma planche »
 * vers le formulaire, actif dès qu'une pièce est épinglée.
 */
export default function PlancheTeintes({ formUrl = '/votre-projet' }: { formUrl?: string }) {
  const { board, isFull, pin, remove } = usePlanche()
  const empty = board.length === 0

  return (
    <div data-component="PlancheTeintes" data-sketch="" className="flex flex-col gap-7">
      <div>
        <p className="text-xs uppercase tracking-[.18em] text-(--fg-muted)">Composez votre planche</p>
        <p className="mt-2 max-w-[26ch] font-serif text-[17px] italic leading-[1.35] text-bordeaux">
          Épinglez jusqu’à quatre teintes et matières : le moodboard commence ici.
        </p>
      </div>
      <PlancheComposer board={board} isFull={isFull} pin={pin} remove={remove} />
      <div className="flex flex-col gap-2.5">
        <Link
          href={formUrl}
          aria-disabled={empty}
          tabIndex={empty ? -1 : undefined}
          className={`inline-flex items-center justify-between gap-4 rounded-mk bg-bordeaux px-[22px] py-4 text-xs uppercase tracking-[.14em] text-creme transition-[opacity,background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-bordeaux-2 ${
            empty ? 'pointer-events-none opacity-45' : ''
          }`}
        >
          <span>Continuer avec ma planche</span>
          <span aria-hidden="true" className="text-lg leading-none">→</span>
        </Link>
        <p className="text-[13px] leading-[1.45] text-(--fg-muted)">
          {empty ? 'Épinglez au moins une teinte ou matière pour continuer.' : `Votre planche : ${board.map((x) => x.name).join(', ')}.`}
        </p>
      </div>
    </div>
  )
}
