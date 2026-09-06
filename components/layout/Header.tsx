'use client'

import { useState } from 'react'
import Image from '@/components/ui/Img'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Coordonnees, Header as HeaderData } from '@/lib/types'
import { resolveLien } from '@/lib/links'
import Container from '@/components/ui/Container'
import PaintButton from '@/components/ui/PaintButton'

interface Props {
  data: HeaderData | null
  coordonnees: Coordonnees | null
}

/**
 * En-tête collant : logo, navigation (soulignement animé sur la page active),
 * bouton CTA. Sous 1000 px, un bouton burger ouvre le menu.
 *
 * Composant client uniquement pour l'état du menu mobile et `usePathname`.
 * Le point de rupture est en `min-[1000px]` plutôt qu'un breakpoint Tailwind :
 * c'est la largeur à partir de laquelle cinq liens tiennent sur une ligne.
 */
export default function Header({ data, coordonnees }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Singleton absent ou illisible : on garde la hauteur pour ne pas décaler la page.
  if (!data) {
    return (
      <header data-component="Header" data-state="empty" className="h-[76px]">
        <Container>
          <Link href="/">MaisonK</Link>
        </Container>
      </header>
    )
  }

  const cta = resolveLien(data.cta, coordonnees)
  const links = data.navigation_links ?? []
  // `/` redirige vers `/accueil` : les deux comptent comme la page d'accueil.
  const isActive = (url: string) => pathname === url || (url === '/accueil' && pathname === '/')

  return (
    <header
      data-component="Header"
      className="sticky top-0 z-50 border-b border-encre/8 bg-creme/86 backdrop-blur-[14px]"
    >
      <Container>
        <nav className="flex h-[76px] items-center justify-between gap-6">
          <Link href="/" aria-label="Maison K, accueil" className="flex items-center leading-none" onClick={() => setOpen(false)}>
            {data.logo ? (
              <Image src={data.logo} alt="maisonK par Carole Mondon" width={168} height={46} className="h-[46px] w-auto" priority />
            ) : (
              <span className="font-serif text-2xl">Maison K</span>
            )}
          </Link>

          <ul className="hidden items-center gap-[34px] text-[15px] uppercase tracking-[.02em] min-[1000px]:flex">
            {links.map((link) => {
              const active = isActive(link.url)
              return (
                <li key={`${link.url}-${link.label}`}>
                  <Link
                    href={link.url}
                    aria-current={active ? 'page' : undefined}
                    className={`relative whitespace-nowrap py-1.5 transition-colors hover:text-bordeaux ${active ? '' : 'opacity-[.78]'}`}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 h-px origin-left bg-bordeaux transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
                        active ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          {cta && (
            <div className="hidden min-[1000px]:block">
              <PaintButton {...cta} dot className="!px-[22px] !py-3" />
            </div>
          )}

          {/* Burger : deux traits qui se croisent à l'ouverture */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex size-11 flex-col justify-center gap-1.5 p-2 min-[1000px]:hidden"
          >
            <span className={`block h-[1.5px] bg-encre transition-transform duration-400 ${open ? 'translate-y-[3.75px] rotate-45' : ''}`} />
            <span className={`block h-[1.5px] bg-encre transition-transform duration-400 ${open ? '-translate-y-[3.75px] -rotate-45' : ''}`} />
          </button>
        </nav>
      </Container>

      {open && (
        <div className="border-t border-encre/8 min-[1000px]:hidden">
          <Container>
            <div className="flex flex-col gap-1.5 pb-8 pt-3">
              {links.map((link) => (
                <Link
                  key={`${link.url}-${link.label}`}
                  href={link.url}
                  onClick={() => setOpen(false)}
                  className="border-b border-encre/8 py-2 font-serif text-[32px]"
                >
                  {link.label}
                </Link>
              ))}
              {cta && (
                <div className="mt-[18px]">
                  <PaintButton {...cta} />
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
