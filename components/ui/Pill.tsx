import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  active?: boolean
  className?: string
}

/**
 * Pastille (villes de la zone d'intervention). Au survol ou active : bordeaux plein.
 * Élément inerte ; les chips cliquables du formulaire sont des `<button>` à part.
 */
export default function Pill({ children, active = false, className = '' }: Props) {
  return (
    <span
      data-active={active}
      className={`inline-flex items-center rounded-full border px-4 py-2.5 text-sm tracking-[.04em] transition-colors duration-300 ${
        active ? 'border-bordeaux bg-bordeaux text-creme' : 'border-(--line-strong) hover:border-bordeaux hover:bg-bordeaux hover:text-creme'
      } ${className}`.trim()}
    >
      {children}
    </span>
  )
}
