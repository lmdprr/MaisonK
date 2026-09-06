import Image from '@/components/ui/Img'
import Link from 'next/link'
import type { Coordonnees, Footer as FooterData, Header as HeaderData } from '@/lib/types'
import { whatsappUrl } from '@/lib/links'
import Container from '@/components/ui/Container'

interface Props {
  data: FooterData | null
  /** La colonne Navigation reprend les liens du header : rien n'est saisi deux fois. */
  header: HeaderData | null
  /** La colonne Contact reprend le singleton Coordonnées. */
  coordonnees: Coordonnees | null
}

const LINK = 'transition-colors hover:text-rose-clair'
const LABEL = 'mb-1.5 text-xs uppercase tracking-[.2em] text-(--fg-muted)'

/**
 * Pied de page, toujours sur fond sombre. Trois colonnes (marque, navigation,
 * contact) puis la ligne légale. Composant serveur.
 *
 * L'année du copyright est calculée au build : le site est redéployé à chaque
 * modification de contenu, c'est suffisant.
 */
export default function Footer({ data, header, coordonnees }: Props) {
  const year = new Date().getFullYear()

  // Singleton absent ou illisible : on garde un pied de page minimal plutôt
  // qu'une page tronquée.
  if (!data) {
    return (
      <footer data-component="Footer" data-fond="sombre" className="bg-(--bg) py-8 text-(--fg)">
        <Container>
          <p>© {year} Maison K</p>
        </Container>
      </footer>
    )
  }

  const wa = whatsappUrl(coordonnees)

  return (
    <footer data-component="Footer" data-fond="sombre" className="bg-(--bg) pb-8 pt-[clamp(48px,6vw,80px)] text-(--fg)">
      <Container>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start gap-10">
          <div>
            {header?.logo ? (
              // Même logo que le header, passé en crème par filtre CSS plutôt qu'un second fichier.
              <Image src={header.logo} alt="maisonK" width={196} height={54} className="h-[54px] w-auto brightness-0 invert-[.93]" />
            ) : (
              <span className="font-serif text-2xl">Maison K</span>
            )}
            {data.slogan && <p className="mt-[18px] max-w-[30ch] text-(--fg-2)">{data.slogan}</p>}
          </div>

          <div className="flex flex-col gap-2.5">
            <p className={LABEL}>Navigation</p>
            {(header?.navigation_links ?? []).map((link) => (
              <Link key={`${link.url}-${link.label}`} href={link.url} className={LINK}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <p className={LABEL}>Contact</p>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={LINK}>
                WhatsApp{coordonnees?.telephone ? ` · ${coordonnees.telephone}` : ''}
              </a>
            )}
            {coordonnees?.email && (
              <a href={`mailto:${coordonnees.email}`} className={LINK}>
                {coordonnees.email}
              </a>
            )}
            {coordonnees?.instagram_url && (
              <a href={coordonnees.instagram_url} target="_blank" rel="noopener noreferrer" className={LINK}>
                Instagram{coordonnees.instagram_handle ? ` · ${coordonnees.instagram_handle}` : ''}
              </a>
            )}
            {coordonnees?.atelier && <p className="text-(--fg-2)">{coordonnees.atelier}</p>}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-(--line) pt-[22px] text-[13px] text-(--fg-muted)">
          <p>{data.copyright_text || `© ${year} Maison K · Tous droits réservés`}</p>
          <ul className="flex gap-4">
            {(data.legal_links ?? []).map((link) => (
              <li key={`${link.url}-${link.label}`}>
                <Link href={link.url} className="text-creme/70 transition-colors hover:text-rose-clair">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
