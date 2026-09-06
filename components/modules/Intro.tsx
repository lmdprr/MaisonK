import Image from '@/components/ui/Img'
import { DocumentRenderer } from '@keystatic/core/renderer'
import type { Coordonnees, ModuleIntro } from '@/lib/types'
import { resolveLien, whatsappUrl } from '@/lib/links'
import Section from '@/components/ui/Section'
import Heading from '@/components/ui/Heading'
import Eyebrow from '@/components/ui/Eyebrow'
import ArrowLink from '@/components/ui/ArrowLink'
import Wall from '@/components/decor/Wall'

type Props = ModuleIntro & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Bloc titre + texte + visuel : en-têtes de page, bloc Carole, page Contact.
 * Composant serveur, aucun état.
 *
 * Disposition, choisie par le contenu :
 * - visuel `aucun` + contenu : contenu en colonne droite, aligné en bas (Prestations) ;
 * - visuel `aucun` sans contenu : titre seul (Réalisations) ;
 * - sans `titre_accent`, le titre s'étale sur toute la ligne ; en visuel
 *   `aucun` il prend les deux colonnes et le contenu passe dessous, à droite ;
 * - visuel `image` / `portrait` : deux colonnes, l'image du côté choisi. Le
 *   portrait ajoute le fond bordeaux et le motif floral.
 *
 * Le premier module (h1) utilise le rythme « en-tête de page », les suivants
 * le rythme de section.
 */
export default function Intro({
  eyebrow,
  icone,
  titre,
  titre_accent,
  contenu,
  signature,
  lien,
  fond,
  visuel,
  afficher_contact,
  level,
  coordonnees,
}: Props) {
  const lienFleche = resolveLien(lien, coordonnees)
  const hasContenu = Array.isArray(contenu) && contenu.length > 0
  const image = visuel.discriminant === 'aucun' ? null : visuel.value
  const isPortrait = visuel.discriminant === 'portrait'
  const imageLeft = image?.position === 'gauche'
  const document = contenu as Parameters<typeof DocumentRenderer>[0]['document']
  // Sans partie italique, le titre n'est plus plafonné en `ch` : il occupe
  // toute la largeur disponible (la colonne, ou la ligne entière sans visuel).
  const titreSeul = !titre_accent

  const texte = (
    <div className="flex flex-col items-start">
      {eyebrow && <Eyebrow icone={icone} className="mb-[22px]">{eyebrow}</Eyebrow>}
      <Heading level={level} className={level === 1 ? `${titreSeul ? '' : 'max-w-[18ch] '}text-[clamp(42px,5vw,76px)]` : ''}>
        {titre}
        {titre_accent && (
          <>
            <br />
            <em>{titre_accent}</em>
          </>
        )}
      </Heading>
      {hasContenu && image && (
        <div className="prose-mk lead mt-7">
          <DocumentRenderer document={document} />
        </div>
      )}
      {signature && <p className="mt-8 font-serif text-[26px] italic text-(--accent)">{signature}</p>}
      {lienFleche && (
        <ArrowLink
          {...lienFleche}
          variant={afficher_contact ? 'italic' : 'underline'}
          className={afficher_contact ? 'mt-7' : 'mt-9'}
        />
      )}
      {afficher_contact && <ContactCards coordonnees={coordonnees} />}
    </div>
  )

  // Décor assigné par variante : frise sous le bloc Carole (portrait en h2),
  // médaillon dans le coin de l'en-tête À propos (portrait en h1), semis de
  // fleurs derrière la page Contact.
  const decor = afficher_contact ? (
    <Wall variant="seed" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" />
  ) : isPortrait && level === 1 ? (
    <Wall
      variant="corner"
      className="pointer-events-none absolute right-0 top-0 -z-10 size-[min(38vw,420px)] [mask-image:radial-gradient(circle_at_100%_0,#000_40%,transparent_75%)]"
    />
  ) : isPortrait ? (
    <Wall
      variant="edge"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[clamp(90px,14vw,180px)] overflow-hidden [mask-image:linear-gradient(0deg,#000_30%,transparent)]"
    />
  ) : null

  return (
    <Section module="intro" fond={fond} padding={level === 1 ? 'tight' : 'normal'} className="isolate overflow-hidden">
      {decor}
      <div
        data-visuel={visuel.discriminant}
        className={`grid gap-[clamp(40px,6vw,96px)] md:grid-cols-2 ${afficher_contact ? 'md:items-start' : image ? 'md:items-center' : 'md:items-end'}`}
      >
        {image ? (
          <>
            <div className={`${imageLeft ? 'md:order-1' : 'md:order-2'} ${afficher_contact ? 'md:pt-[clamp(0px,4vw,60px)]' : ''}`}>
              <figure data-portrait={isPortrait} data-reveal="" className="relative mx-auto flex w-full max-w-[520px] flex-col gap-8">
                {isPortrait && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute aspect-square w-[65%] bg-contain bg-center bg-no-repeat opacity-50 ${
                      imageLeft ? '-right-[6%] -bottom-[6%] rotate-[15deg]' : '-left-[8%] -top-[8%] -rotate-[20deg]'
                    }`}
                    style={{ backgroundImage: 'url(/images/decor/motif.png)' }}
                  />
                )}
                {image.image && (
                  <div
                    className={`relative aspect-[4/5] overflow-hidden rounded-mk ${
                      isPortrait ? 'flex items-end justify-center bg-bordeaux' : 'bg-sable'
                    }`}
                  >
                    {isPortrait ? (
                      <Image src={image.image} alt={image.alt ?? ''} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain object-bottom p-[6%] pb-0" />
                    ) : (
                      <Image src={image.image} alt={image.alt ?? ''} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                    )}
                  </div>
                )}
                {afficher_contact && <ContactInfos coordonnees={coordonnees} />}
              </figure>
            </div>
            <div data-reveal="" className={imageLeft ? 'md:order-2' : 'md:order-1'}>
              {texte}
            </div>
          </>
        ) : (
          <>
            <div className={titreSeul ? 'md:col-span-2' : ''}>{texte}</div>
            {hasContenu && (
              <div className={`prose-mk lead max-w-[48ch] md:self-end ${titreSeul ? 'md:col-start-2' : ''}`}>
                <DocumentRenderer document={document} />
              </div>
            )}
          </>
        )}
      </div>
    </Section>
  )
}

/** Cartes WhatsApp / téléphone / e-mail — page Contact. */
function ContactCards({ coordonnees }: { coordonnees: Coordonnees | null }) {
  if (!coordonnees) return null
  const wa = whatsappUrl(coordonnees)
  const tel = coordonnees.telephone?.replace(/\s/g, '')
  const card = 'flex items-center justify-between gap-4 rounded-mk px-[26px] py-[22px] transition-[background-color,border-color,transform] duration-300'
  const outline = `${card} border border-(--line-strong) hover:border-encre hover:bg-sable-2`

  return (
    <ul data-component="ContactCards" className="mt-10 flex w-full max-w-[440px] flex-col gap-3.5">
      {wa && (
        <li>
          <a href={wa} target="_blank" rel="noopener noreferrer" className={`${card} bg-bordeaux text-creme hover:-translate-y-0.5`}>
            <span className="flex flex-col">
              <span className="text-xs uppercase tracking-[.2em] opacity-80">WhatsApp</span>
              <span className="mt-1 font-serif text-2xl">Écrire à Carole</span>
            </span>
            <span aria-hidden="true" className="text-2xl">→</span>
          </a>
        </li>
      )}
      {coordonnees.telephone && (
        <li>
          <a href={`tel:${tel}`} className={outline}>
            <span className="flex flex-col">
              <span className="text-xs uppercase tracking-[.2em] text-(--fg-muted)">Téléphone</span>
              <span className="mt-1 font-serif text-2xl">{coordonnees.telephone}</span>
            </span>
            <span aria-hidden="true" className="text-2xl">→</span>
          </a>
        </li>
      )}
      {coordonnees.email && (
        <li>
          <a href={`mailto:${coordonnees.email}`} className={outline}>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs uppercase tracking-[.2em] text-(--fg-muted)">E-mail</span>
              <span className="mt-1 truncate font-serif text-[22px]">{coordonnees.email}</span>
            </span>
            <span aria-hidden="true" className="text-2xl">→</span>
          </a>
        </li>
      )}
    </ul>
  )
}

/** Liste atelier / horaires / réseaux — sous l'image de la page Contact. */
function ContactInfos({ coordonnees }: { coordonnees: Coordonnees | null }) {
  if (!coordonnees) return null
  const dt = 'pt-[3px] text-[13px] uppercase tracking-[.14em] text-(--fg-muted)'

  return (
    <dl data-component="ContactInfos" className="grid grid-cols-[auto_1fr] gap-x-7 gap-y-3 text-base">
      {coordonnees.atelier && (
        <>
          <dt className={dt}>Atelier</dt>
          <dd>{coordonnees.atelier}</dd>
        </>
      )}
      {coordonnees.horaires && (
        <>
          <dt className={dt}>Horaires</dt>
          <dd>{coordonnees.horaires}</dd>
        </>
      )}
      {coordonnees.instagram_url && (
        <>
          <dt className={dt}>Réseaux</dt>
          <dd>
            <a href={coordonnees.instagram_url} target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:text-(--accent-hover)">
              Instagram {coordonnees.instagram_handle}
            </a>
          </dd>
        </>
      )}
    </dl>
  )
}
