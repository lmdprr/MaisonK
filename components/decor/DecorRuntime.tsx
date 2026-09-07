'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Runtime des décorations, monté une fois dans le layout du site.
 *
 * Trois comportements, pilotés par des attributs `data-*` posés par les
 * composants serveur :
 *
 * 1. `[data-reveal]` : les blocs sous la ligne de flottaison apparaissent en
 *    glissant vers le haut quand ils entrent dans l'écran. `data-reveal-delay`
 *    décale une carte par rapport à sa voisine.
 * 2. `[data-sketch]` : les croquis et papiers peints restent en pause tant
 *    qu'ils ne sont pas visibles ; on passe `--mk-play` à `running` à l'entrée.
 *    Sur mobile et en `prefers-reduced-motion`, la durée est rabattue à ~0
 *    (le dessin apparaît d'un coup), sauf le croquis du hero.
 * 3. `[data-paint]` : le rouleau de peinture suit la souris sur les boutons et
 *    laisse des traces terracotta dans `[data-paint-layer]`.
 *
 * Aucun état React : le runtime observe le DOM, ce qui laisse les modules en
 * composants serveur. Il rescanne à chaque navigation (`pathname`) et à chaque
 * mutation du DOM (menu mobile, confirmation du formulaire).
 *
 * @see app/globals.css pour les keyframes et les variables `--mk-*`
 */
export default function DecorRuntime() {
  const pathname = usePathname()

  // Apparitions et croquis.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth < 1000
    // Un élément n'est traité qu'une fois, même s'il survit à plusieurs scans.
    const seen = new WeakSet<Element>()

    const pendingReveal = new Set<HTMLElement>()
    const pendingSketch = new Set<HTMLElement>()

    const reveal = (el: HTMLElement) => {
      el.style.opacity = '1'
      el.style.transform = 'none'
      pendingReveal.delete(el)
      revealIo.unobserve(el)
    }

    const revealIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) reveal(e.target as HTMLElement)
      },
      { threshold: 0.12 }
    )

    const play = (el: HTMLElement) => {
      if (reduced || (mobile && el.dataset.sketch !== 'hero')) el.style.setProperty('--mk-dur', '0.01s')
      el.style.setProperty('--mk-play', 'running')
      pendingSketch.delete(el)
      sketchIo.unobserve(el)
    }

    const sketchIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) play(e.target as HTMLElement)
      },
      { threshold: 0.35 }
    )

    /** Part visible d'un élément, de 0 à 1, sans attendre l'observateur. */
    const visibleRatio = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      if (r.height <= 0) return 0
      return Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) / r.height
    }

    const scan = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        if (reduced) return
        // Seuls les blocs sous la ligne de flottaison sont masqués : ce qui est
        // déjà visible au chargement ne doit jamais clignoter.
        if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
          el.style.opacity = '0'
          el.style.transform = 'translateY(28px)'
          el.style.transition = 'opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1)'
          if (el.dataset.revealDelay) el.style.transitionDelay = el.dataset.revealDelay
          pendingReveal.add(el)
          revealIo.observe(el)
        }
      })
      document.querySelectorAll<HTMLElement>('[data-sketch]').forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        // Déjà à l'écran au chargement (croquis du hero) : on n'attend pas le
        // premier rappel de l'observateur, qui peut tarder.
        if (visibleRatio(el) >= 0.35) play(el)
        else {
          pendingSketch.add(el)
          sketchIo.observe(el)
        }
      })
    }

    // Filet de sécurité : si l'IntersectionObserver tarde (webview, onglet
    // restauré, défilement très rapide), un contrôle synchrone au scroll fait
    // le même travail. Un bloc masqué qui resterait invisible est le pire
    // scénario pour ce genre d'effet.
    let ticking = false
    // Un bloc dont le haut est entré dans l'écran, ou déjà dépassé vers le
    // haut (ancre, retour arrière), compte comme atteint.
    const reached = (el: HTMLElement, threshold: number) => {
      const r = el.getBoundingClientRect()
      return r.bottom < 0 || r.top < window.innerHeight * (1 - threshold) || visibleRatio(el) >= threshold
    }
    const check = () => {
      ticking = false
      for (const el of pendingReveal) if (reached(el, 0.12)) reveal(el)
      for (const el of pendingSketch) if (reached(el, 0.35)) play(el)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    scan()
    // Rescan groupé par frame : une navigation client produit des dizaines de
    // mutations d'un coup.
    let raf = 0
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(scan)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mo.disconnect()
      revealIo.disconnect()
      sketchIo.disconnect()
    }
  }, [pathname])

  // Rouleau de peinture. Indépendant de la navigation : les écouteurs sont sur
  // `document` et retrouvent le bouton par `closest('[data-paint]')`.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Dernière position et nombre de traces par bouton, pour espacer les
    // traces et plafonner le nombre de nœuds ajoutés.
    const last = new WeakMap<HTMLElement, { x: number; y: number; n: number }>()

    /** Ajoute une trace de rouleau, et parfois une éclaboussure à côté. */
    const stamp = (layer: HTMLElement, x: number, y: number) => {
      const d = document.createElement('span')
      d.style.cssText = `position:absolute;left:${x - 17}px;top:${y - 16}px;width:34px;height:32px;border-radius:8px;transform:rotate(-18deg);background:#C07454 repeating-linear-gradient(90deg,rgba(237,234,228,.09) 0 1px,transparent 1px 4px,rgba(85,16,32,.07) 4px 5px,transparent 5px 9px)`
      layer.appendChild(d)
      if (Math.random() < 0.22) {
        const sx = Math.round((Math.random() - 0.5) * 64)
        const sy = Math.round((Math.random() - 0.5) * 44)
        const ss = 2 + Math.round(Math.random() * 3)
        const o = document.createElement('span')
        o.style.cssText = `position:absolute;left:${x + sx}px;top:${y + sy}px;width:${ss}px;height:${ss}px;border-radius:50%;background:${ss > 3 ? 'rgba(85,16,32,.45)' : '#C07454'};opacity:.9`
        layer.appendChild(o)
      }
    }

    const onMove = (e: PointerEvent) => {
      // Au tactile il n'y a pas de survol : le rouleau reste caché.
      if (e.pointerType !== 'mouse') return
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-paint]')
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      el.style.setProperty('--mk-rx', `${x}px`)
      el.style.setProperty('--mk-ry', `${y}px`)
      el.style.setProperty('--mk-ro', '1')
      const prev = last.get(el)
      // Une trace tous les 5 px, 700 au maximum par bouton.
      if (prev && Math.hypot(x - prev.x, y - prev.y) < 5) return
      const n = (prev?.n ?? 0) + 1
      last.set(el, { x, y, n })
      // Couverture approximative (0→1), lue par le libellé pour s'éclaircir à
      // mesure que la terracotta gagne sur le fond sombre.
      el.style.setProperty('--mk-pc', String(Math.min(1, n / 80)))
      if (n > 700) return
      const layer = el.querySelector<HTMLElement>('[data-paint-layer]')
      if (layer) stamp(layer, x, y)
    }

    const onOut = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-paint]')
      if (!el || el.contains(e.relatedTarget as Node | null)) return
      el.style.setProperty('--mk-ro', '0')
      const prev = last.get(el)
      if (prev) last.set(el, { ...prev, x: -999, y: -999 })
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])

  return null
}
