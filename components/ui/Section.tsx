import type { ReactNode } from 'react'
import type { Fond } from '@/lib/types'
import Container from './Container'
import type { ContainerProps } from './Container'

interface Props {
  /** Nom du module, exposé en `data-module` pour le débogage et les tests. */
  module: string
  fond?: Fond
  children: ReactNode
  size?: ContainerProps['size']
  /**
   * `normal` : rythme de section ;
   * `tight` : en-tête de page (premier module) ;
   * `none` : le module gère son propre rythme vertical.
   */
  padding?: 'normal' | 'tight' | 'none'
  className?: string
}

const PADDINGS: Record<NonNullable<Props['padding']>, string> = {
  normal: 'py-section',
  tight: 'pt-section-sm pb-[clamp(48px,6vw,80px)]',
  none: '',
}

/**
 * Enveloppe commune de tous les modules.
 *
 * `data-fond` redéfinit les rôles de couleur (voir globals.css) : l'éditeur
 * choisit un fond, jamais une couleur, et le module reste identique quel que
 * soit le fond. Le `relative` permet aux modules de positionner leur décor
 * en absolu derrière le contenu.
 */
export default function Section({ module, fond = 'creme', children, size = 'full', padding = 'normal', className = '' }: Props) {
  return (
    <section
      data-module={module}
      data-fond={fond}
      className={`relative bg-(--bg) text-(--fg) ${PADDINGS[padding]} ${className}`.trim()}
    >
      <Container size={size}>{children}</Container>
    </section>
  )
}
