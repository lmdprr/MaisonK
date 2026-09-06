import type { ReactNode } from 'react'

interface Props {
  /** 1 pour le premier module d'une page, 2 ensuite. Calculé par ModuleRenderer. */
  level: 1 | 2 | 3
  children: ReactNode
  className?: string
}

/**
 * Titre de section. Le niveau est piloté par la position du module, jamais
 * par l'éditeur : une page a toujours exactement un h1.
 *
 * Les tailles par défaut viennent de globals.css ; `className` permet à un
 * module de les ajuster (bandeau CTA, formulaire).
 */
export default function Heading({ level, children, className }: Props) {
  const Tag = `h${level}` as const
  return <Tag className={className}>{children}</Tag>
}
