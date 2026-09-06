'use client'

import { useState } from 'react'
import Image from '@/components/ui/Img'

/**
 * Sous-ensemble de `Projet` nécessaire au comparateur. Le module galerie
 * (serveur) ne transmet que ces champs au client.
 */
export interface ProjetComparable {
  slug: string
  titre: string
  lieu?: string | null
  type?: string | null
  image_apres: string | null
  image_avant: string | null
  note?: string | null
}

interface Props {
  /** Projets ayant une image « avant » (filtrés en amont). */
  projets: ProjetComparable[]
  /** Texte d'aide affiché sous la poignée jusqu'à la première manipulation. */
  aide?: string | null
}

/**
 * Comparateur avant / après.
 *
 * Onglets de projets, puis un curseur horizontal : un `input[type=range]`
 * invisible couvre toute l'image, ce qui donne le glisser à la souris, au
 * tactile et au clavier sans gestionnaire d'événements maison. L'image
 * « avant » (projet 3D) est rognée par `clip-path` à la position du curseur.
 */
export default function AvantApres({ projets, aide }: Props) {
  const [index, setIndex] = useState(0)
  /** Position du curseur en pourcentage. */
  const [pos, setPos] = useState(50)
  const [touched, setTouched] = useState(false)
  const actif = projets[index] ?? projets[0]
  if (!actif) return null

  // Changer de projet recentre le curseur.
  const select = (i: number) => {
    setIndex(i)
    setPos(50)
  }

  return (
    <div data-component="AvantApres">
      <div role="tablist" className="mb-[clamp(28px,3vw,40px)] flex gap-[clamp(20px,3vw,40px)] overflow-x-auto border-b border-(--line) [scrollbar-width:none]">
        {projets.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => select(i)}
            className={`relative flex cursor-pointer items-baseline gap-2.5 whitespace-nowrap pb-4 pt-1.5 font-serif text-[clamp(17px,1.4vw,21px)] transition-[opacity,color] duration-400 hover:opacity-100 hover:text-bordeaux ${
              i === index ? 'text-bordeaux' : 'opacity-60'
            }`}
          >
            <span className="font-sans text-xs tracking-[.14em] text-terracotta">{String(i + 1).padStart(2, '0')}</span>
            {p.titre}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-[1.5px] origin-left bg-bordeaux transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
                i === index ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="relative">
        {/* Cadre décalé derrière l'image, façon passe-partout */}
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-3.5 -right-3.5 left-3.5 top-3.5 rounded-mk border border-terracotta opacity-55" />
        <div className="relative aspect-video min-h-[320px] cursor-ew-resize select-none overflow-hidden rounded-mk bg-sable">
          {actif.image_apres && <Image src={actif.image_apres} alt="Après : réalisé" fill sizes="100vw" className="object-cover" priority />}
          {actif.image_avant && (
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <Image src={actif.image_avant} alt="Avant : projet 3D" fill sizes="100vw" className="object-cover" />
            </div>
          )}

          {/* Ligne de séparation et poignée : purement visuelles, le range en dessous reçoit les événements */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-[1.5px] -translate-x-px bg-creme shadow-[0_0_0_.5px_rgb(85_16_32/.35)]"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute left-1/2 top-1/2 flex size-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <svg viewBox="0 0 58 58" className="absolute inset-0 size-full drop-shadow-[0_6px_18px_rgb(21_21_21/.22)]">
                <path d="M29 3.5 Q54 3 54.4 29 Q54.8 54.6 29 54.5 Q3.4 54.4 3.6 29 Q3.8 3.6 29.4 3.5" fill="#EDEAE4" stroke="#551020" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M20 29 h18 M24 24.5 l-4.3 4.5 4.3 4.5 M34 24.5 l4.3 4.5 -4.3 4.5" fill="none" stroke="#C07454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {aide && (
              <p
                className="absolute left-1/2 top-[calc(50%+40px)] m-0 -translate-x-1/2 whitespace-nowrap font-serif text-[15px] italic text-creme transition-opacity duration-500 [text-shadow:0_1px_8px_rgb(21_21_21/.5)]"
                style={{ opacity: touched ? 0 : 1 }}
              >
                {aide}
              </p>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-[18px] left-[18px] flex flex-col rounded-mk bg-creme/90 px-4 pb-2 pt-2.5 text-encre">
            <span className="text-[11px] uppercase tracking-[.2em] text-terracotta">Avant</span>
            <span className="font-serif text-lg italic">Projet 3D</span>
          </div>
          <div className="pointer-events-none absolute bottom-[18px] right-[18px] flex flex-col items-end rounded-mk bg-bordeaux px-4 pb-2 pt-2.5 text-creme">
            <span className="text-[11px] uppercase tracking-[.2em] text-rose-clair">Après</span>
            <span className="font-serif text-lg italic">Réalisé</span>
          </div>

          {/* Styles plein cadre et poignée invisible dans globals.css (`.mk-ba`) */}
          <input
            className="mk-ba"
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => {
              setPos(Number(e.target.value))
              setTouched(true)
            }}
            aria-label="Comparer avant / après"
          />
        </div>
      </div>

      <div className="mt-[clamp(32px,3vw,44px)] grid grid-cols-[auto_1fr] items-start gap-[clamp(16px,3vw,40px)] md:grid-cols-[auto_1fr_auto]">
        <span className="num pt-2.5">
          {String(index + 1).padStart(2, '0')} / {String(projets.length).padStart(2, '0')}
        </span>
        <div>
          <h2 className="text-[clamp(26px,2.6vw,38px)] leading-[1.1]">{actif.titre}</h2>
          <p className="mt-2 text-[13px] uppercase tracking-[.12em] text-(--fg-muted)">{[actif.lieu, actif.type].filter(Boolean).join(' · ')}</p>
        </div>
        {actif.note && <p className="max-w-[34ch] pt-1.5 font-serif text-base italic leading-[1.45] text-bordeaux md:col-start-3">{actif.note}</p>}
      </div>
    </div>
  )
}
