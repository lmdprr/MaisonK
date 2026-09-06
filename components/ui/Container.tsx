import type { ReactNode } from 'react'

export interface ContainerProps {
  children: ReactNode
  /**
   * `full` (défaut) : pleine largeur avec gouttières, c'est la règle de la charte ;
   * `bleed` : sans gouttières (bandeau défilant, articles Prestations) ;
   * `narrow` / `medium` : prose et formulaire ;
   * `grid` : plafond des grilles d'images, partagé avec le décor de marge (`--container-grid`).
   */
  size?: 'narrow' | 'grid' | 'medium' | 'full' | 'bleed'
  className?: string
}

const SIZES: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-[880px] px-gutter',
  grid: 'max-w-grid px-gutter',
  medium: 'max-w-[1160px] px-gutter',
  full: 'max-w-none px-gutter',
  bleed: 'max-w-none px-0',
}

/** Largeur et gouttières horizontales d'un bloc. Utilisé par `Section`, rarement seul. */
export default function Container({ children, size = 'full', className = '' }: ContainerProps) {
  return <div className={`mx-auto w-full ${SIZES[size]} ${className}`.trim()}>{children}</div>
}
