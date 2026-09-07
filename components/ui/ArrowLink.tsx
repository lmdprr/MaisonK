import Link from 'next/link'

interface Props {
  label: string
  url: string
  /** Ouvre dans un nouvel onglet. Calculé par `resolveLien`. */
  external?: boolean
  /**
   * `underline` : filet bas (liens de section) ;
   * `plain` : sans filet (hero) ;
   * `italic` : serif italique accent (page Contact, confirmation du formulaire).
   */
  variant?: 'underline' | 'plain' | 'italic'
  className?: string
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  underline: 'text-[15px] uppercase tracking-[.03em] border-b border-(--line-strong) pb-1.5',
  plain: 'text-[15px] uppercase tracking-[.03em]',
  italic: 'font-serif italic text-[17px] text-(--accent) border-b border-(--accent)/40 pb-0.5 normal-case',
}

/**
 * Lien fléché « Mon parcours → ». Au survol, l'écart s'ouvre et la flèche
 * s'étire (transform sur le glyphe, pas d'icône SVG). Un lien externe porte
 * « ↗ » à la place : inutile de l'écrire dans le libellé.
 *
 * Largeur `fit-content` : le lien se replie sur son libellé mais accepte le
 * retour à la ligne. En `max-content`, un libellé long élargirait la colonne
 * de grille qui le contient au-delà de l'écran (page Contact sur mobile).
 */
export default function ArrowLink({ label, url, external = false, variant = 'underline', className = '' }: Props) {
  const classes = `group inline-flex w-fit max-w-full items-center gap-2.5 transition-[gap,color] duration-300 hover:gap-3.5 hover:text-(--accent) ${VARIANTS[variant]} ${className}`.trim()
  const arrow = (
    <span
      aria-hidden="true"
      className={`inline-block origin-left transition-transform duration-500 ease-[cubic-bezier(.5,0,.2,1)] ${
        external ? 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5' : 'group-hover:translate-x-1 group-hover:scale-x-[1.4]'
      }`}
      style={variant === 'italic' ? { fontStyle: 'normal' } : undefined}
    >
      {external ? '↗' : '→'}
    </span>
  )

  if (external) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" data-component="ArrowLink" className={classes}>
        {label} {arrow}
      </a>
    )
  }

  return (
    <Link href={url} data-component="ArrowLink" className={classes}>
      {label} {arrow}
    </Link>
  )
}
