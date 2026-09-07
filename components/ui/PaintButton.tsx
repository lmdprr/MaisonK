import Link from 'next/link'

interface Props {
  label: string
  url: string
  /** Ouvre dans un nouvel onglet. Calculé par `resolveLien`. */
  external?: boolean
  /** `bordeaux` (défaut), `encre` (hero), `outline`. */
  variant?: 'bordeaux' | 'encre' | 'outline'
  /** `lg` pour le bandeau CTA. */
  size?: 'md' | 'lg'
  className?: string
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  bordeaux: 'bg-bordeaux text-creme',
  encre: 'bg-encre text-creme',
  outline: 'border border-current text-(--fg) hover:bg-encre hover:text-creme',
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  md: 'px-7 py-4 text-[15px] tracking-[.03em]',
  lg: 'px-[34px] py-[22px] text-[15px] tracking-[.04em]',
}

/**
 * Bouton principal (pilule). À la souris, un rouleau de peinture suit le
 * curseur et laisse des traces terracotta dans la couche `[data-paint-layer]`.
 * Au tactile, c'est une pilule ordinaire.
 *
 * Le composant reste serveur : la position du rouleau est pilotée par les
 * variables `--mk-rx` / `--mk-ry` / `--mk-ro`, écrites par DecorRuntime sur
 * tout élément `[data-paint]`.
 */
export default function PaintButton({ label, url, external = false, variant = 'bordeaux', size = 'md', className = '' }: Props) {
  const classes = `relative isolate inline-flex items-center gap-2.5 overflow-hidden rounded-full uppercase whitespace-nowrap transition-transform duration-300 hover:-translate-y-0.5 ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()
  const content = (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
        {/* Couche des traces de peinture, remplie par DecorRuntime */}
        <span data-paint-layer="" className="absolute inset-0" />
        {/* Le rouleau : invisible (--mk-ro: 0) tant que la souris n'est pas dessus */}
        <svg
          viewBox="0 0 30 30"
          className="absolute size-[30px]"
          style={{
            left: 'var(--mk-rx,-40px)',
            top: 'var(--mk-ry,50%)',
            transform: 'translate(-50%,-50%) rotate(-18deg)',
            opacity: 'var(--mk-ro,0)',
            transition: 'opacity .25s',
            filter: 'drop-shadow(0 2px 4px rgba(21,21,21,.25))',
          }}
        >
          <rect x="3" y="4" width="22" height="11" rx="2.5" fill="#EDEAE4" stroke="#551020" strokeWidth="1.2" />
          <path d="M6 8 h16 M6 11 h16" fill="none" stroke="rgba(85,16,32,.25)" strokeWidth=".8" />
          <path d="M14 15 v4 h6 v8" fill="none" stroke="#551020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25 12 l3 -1 M4 15.5 l-1 2.5" fill="none" stroke="#C07454" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
      <span className="relative">{label}</span>
    </>
  )

  if (external) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" data-component="PaintButton" data-paint="" className={classes}>
        {content}
      </a>
    )
  }

  return (
    <Link href={url} data-component="PaintButton" data-paint="" className={classes}>
      {content}
    </Link>
  )
}
