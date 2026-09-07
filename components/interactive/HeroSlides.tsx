'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from '@/components/ui/Img'
import type { HeroSlide } from '@/lib/types'
import Eyebrow from '@/components/ui/Eyebrow'
import PaintButton from '@/components/ui/PaintButton'
import ArrowLink from '@/components/ui/ArrowLink'
import { HeroSketch } from '@/components/decor/Sketches'

/** Lien déjà résolu côté serveur (`resolveLien`). */
interface LienResolu {
  label: string
  url: string
  external: boolean
}

interface Props {
  eyebrow?: string | null
  titre: string
  texte?: string | null
  bouton: LienResolu | null
  citation?: string | null
  lien: LienResolu | null
  slides: HeroSlide[]
  autoplay: boolean
}

/** Délai entre deux slides en lecture automatique (ms). */
const INTERVAL = 6000

/** Variables CSS `--mk-*` passées en style inline. */
const vars = (style: Record<string, string>) => style as CSSProperties

/**
 * Diaporama du hero. La fin du titre (italique accent), le compteur, la
 * légende et l'image changent ensemble à chaque slide.
 *
 * Lecture automatique : relancée après un clic sur un point (le minuteur
 * repart de zéro), mise en pause quand l'onglet est caché, désactivée en
 * `prefers-reduced-motion`. Les images sont toutes montées et superposées ;
 * seule l'opacité change, pour éviter un rechargement à chaque passage.
 *
 * Disposition : titre, image, puis texte et bouton, dans cet ordre. Sous
 * `lg` ils s'empilent, la photo arrive donc juste sous le titre et la légende
 * passe sous l'image. À partir de `lg`, grille à deux colonnes : la figure
 * occupe la colonne droite sur les deux rangs, le titre et le texte se
 * rejoignent au milieu de la colonne gauche, la légende revient en surimpression.
 */
export default function HeroSlides({ eyebrow, titre, texte, bouton, citation, lien, slides, autoplay }: Props) {
  const [index, setIndex] = useState(0)
  const timer = useRef<number | null>(null)
  const total = String(slides.length).padStart(2, '0')
  const active = slides[index] ?? slides[0]

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
  }, [])

  const start = useCallback(() => {
    stop()
    if (!autoplay || slides.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL)
  }, [autoplay, slides.length, stop])

  useEffect(() => {
    start()
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [start, stop])

  /** Navigation manuelle : on repart sur un cycle complet depuis la slide choisie. */
  const go = (i: number) => {
    setIndex(i)
    start()
  }

  return (
    <div
      data-autoplay={autoplay}
      className="flex min-h-[min(calc(82vh-76px),760px)] flex-col lg:grid lg:grid-cols-2 lg:content-center lg:gap-x-[clamp(24px,4vw,64px)]"
    >
      <div className="pt-[clamp(24px,4vh,72px)] lg:self-end lg:pt-[clamp(32px,5vh,72px)]">
        {eyebrow && <Eyebrow line className="mb-[26px]">{eyebrow}</Eyebrow>}
        <h1>
          {titre}
          {active?.ligne_titre && (
            <>
              <br />
              {/* `key` force un remontage : l'animation d'entrée rejoue à chaque slide */}
              <em key={index} className="fadein inline-block">
                {active.ligne_titre}
              </em>
            </>
          )}
        </h1>
      </div>

      {slides.length > 0 && (
        <div className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center lg:py-[clamp(20px,4vh,48px)]">
          <figure className="relative mx-auto w-full max-w-[544px]">
            <div className="relative aspect-[4/5] w-full max-h-[min(70vh,680px)] overflow-hidden rounded-mk bg-sable">
              {slides.map((s, i) =>
                s.image ? (
                  <Image
                    key={`${i}-${s.image}`}
                    src={s.image}
                    alt={s.alt ?? ''}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority={i === 0}
                    // Fondu de 1,4 s ; le zoom lent (7 s) court pendant toute la durée d'affichage
                    className={`object-cover transition-[opacity,scale] duration-[1400ms,7000ms] ease-[cubic-bezier(.4,0,.2,1),linear] ${
                      i === index ? 'scale-[1.06] opacity-100' : 'scale-100 opacity-0'
                    }`}
                  />
                ) : null
              )}
            </div>
            <figcaption className="flex flex-col gap-3 pt-3.5 text-encre lg:absolute lg:inset-x-0 lg:bottom-0 lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:bg-gradient-to-t lg:from-encre/55 lg:to-transparent lg:px-[26px] lg:py-[22px] lg:text-creme">
              <div>
                <p className="text-xs uppercase tracking-[.2em] opacity-85">
                  {String(index + 1).padStart(2, '0')} / {total}
                  {active?.libelle ? ` · ${active.libelle}` : ''}
                </p>
                {active?.legende && <p className="mt-1.5 font-serif text-xl italic">{active.legende}</p>}
              </div>
              {slides.length > 1 && (
                <div className="flex gap-2 lg:-my-5">
                  {slides.map((s, i) => (
                    // La zone tactile fait 42 px de haut ; le trait visible garde ses 2 px
                    <button
                      key={`${i}-${s.ligne_titre}`}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={s.libelle || `Image ${i + 1}`}
                      aria-current={i === index}
                      className="w-[34px] cursor-pointer py-5"
                    >
                      <span
                        className={`block h-0.5 w-full transition-colors duration-500 ${
                          i === index ? 'bg-encre lg:bg-creme' : 'bg-encre/25 hover:bg-encre/60 lg:bg-creme/35 lg:hover:bg-creme/70'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </figcaption>
          </figure>
        </div>
      )}

      <div className="pb-[clamp(32px,5vh,72px)] lg:self-start">
        {texte && <p className="lead mt-[34px] max-w-[46ch] text-[clamp(17px,1.25vw,20px)]">{texte}</p>}
        {bouton && (
          <div className="mt-10 flex flex-wrap gap-3.5">
            <PaintButton {...bouton} variant="encre" />
          </div>
        )}
        {(citation || lien) && (
          <div data-sketch="hero" className="mt-[clamp(36px,5vh,56px)] flex flex-wrap items-end gap-[22px]">
            <div className="w-[min(272px,60%)]">
              {/* Feuille de carton : entre en 0,6 × --mk-dur, puis le tracé démarre avec 0,5 de retard */}
              <div
                className="mk-papier rounded-mk p-3.5"
                style={vars({
                  '--mk-offset': 'calc(var(--mk-dur,1s) * .5)',
                  animation: 'mk-paper calc(var(--mk-dur,1s) * .6) cubic-bezier(.2,.7,.2,1) forwards',
                  animationPlayState: 'var(--mk-play,paused)',
                })}
              >
                <HeroSketch />
              </div>
            </div>
            <div className="mb-1.5 flex flex-col gap-3">
              {citation && <p className="max-w-[16ch] font-serif text-[17px] italic leading-[1.35] text-bordeaux">{citation}</p>}
              {lien && <ArrowLink {...lien} variant="plain" />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
