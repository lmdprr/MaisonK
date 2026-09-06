import Link from 'next/link'
import Image from '@/components/ui/Img'
import type { Coordonnees, ModuleGalerie, Projet } from '@/lib/types'
import { getProjets } from '@/lib/keystatic'
import Section from '@/components/ui/Section'
import SectionHead from '@/components/ui/SectionHead'
import AvantApres from '@/components/interactive/AvantApres'
import { RoomSketch } from '@/components/decor/Sketches'
import Wall from '@/components/decor/Wall'

type Props = ModuleGalerie & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Semis de quadrilobes dans les marges laissées libres par le plafond `grid`
 * du comparateur avant / après (voir `--container-grid`). Uniquement au-dessus
 * de 1480 px : en dessous la marge est trop étroite et le semis chevaucherait
 * les images. La copie de droite est simplement retournée horizontalement.
 */
const MARGE = 'pointer-events-none absolute inset-y-0 -z-10 hidden w-[calc((100%-var(--container-grid))/2)] max-h-[1400px] min-[1480px]:block [mask-image:linear-gradient(#000_70%,transparent)]'
const marges = (
  <>
    <Wall variant="marge" className={`${MARGE} left-0`} />
    <Wall variant="marge" className={`${MARGE} right-0 -scale-x-100`} />
  </>
)

/** Zoom lent au survol d'une carte, commun aux cartes et aux fiches. */
const ZOOM = 'object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105'

/**
 * Projets (collection) ou images libres, quatre affichages :
 * - `cartes` : teaser de l'accueil, image 4/5, titre et lieu ;
 * - `fiches` : grille Réalisations, image 4/3, croquis de pièce, type, texte ;
 * - `comparateur` : avant / après, composant client ;
 * - `mosaique` : carrés sans texte (Instagram).
 *
 * Composant serveur asynchrone : la sélection des projets est faite ici, le
 * comparateur ne reçoit que les champs dont il a besoin et uniquement les
 * projets qui ont une vraie image « avant ».
 */
export default async function Galerie({ en_tete, fond, source, affichage, texte_aide, level, coordonnees }: Props) {
  const projets = source.discriminant === 'projets' ? await selectProjets(source.value, affichage) : []

  if (affichage === 'comparateur') {
    return (
      <Section module="galerie" fond={fond} size="grid" padding="none" className="isolate pb-[clamp(40px,5vw,64px)]">
        {marges}
        <SectionHead data={en_tete} level={level} coordonnees={coordonnees} />
        <AvantApres
          aide={texte_aide}
          projets={projets.map((p) => ({
            slug: p.slug,
            titre: p.titre,
            lieu: p.lieu,
            type: p.type,
            image_apres: p.image_apres,
            image_avant: p.image_avant ?? null,
            note: p.note,
          }))}
        />
      </Section>
    )
  }

  if (affichage === 'fiches') {
    return (
      <Section module="galerie" fond={fond}>
        <SectionHead data={en_tete} level={level} coordonnees={coordonnees} />
        {/* Auto-fit plafonné à trois colonnes : la largeur minimale d'une colonne ne descend jamais sous un tiers du conteneur. */}
        <ul className="grid [--gap:clamp(20px,3vw,48px)] grid-cols-[repeat(auto-fit,minmax(max(280px,calc((100%-2*var(--gap))/3)),1fr))] gap-(--gap)">
          {projets.map((p, index) => (
            <li key={p.slug} data-reveal="" data-reveal-delay={`${index * 0.1}s`} data-type-piece={p.type_piece} className="group">
              {p.image_apres && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-mk bg-sable">
                  <Image src={p.image_apres} alt={p.titre} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className={ZOOM} />
                </div>
              )}
              <RoomSketch kind={p.type_piece} className="mt-4 h-14 w-24" />
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <h3>{p.titre}</h3>
                {p.lieu && <span className="text-[13px] uppercase tracking-[.12em] text-(--fg-muted)">{p.lieu}</span>}
              </div>
              {p.type && <p className="mt-1 text-[13px] uppercase tracking-[.08em] text-terracotta">{p.type}</p>}
              {p.texte && <p className="mt-2.5 max-w-[50ch] text-(--fg-2)">{p.texte}</p>}
            </li>
          ))}
        </ul>
      </Section>
    )
  }

  if (affichage === 'mosaique') {
    // La mosaïque accepte les deux sources : images libres, ou image « après » des projets.
    const images = source.discriminant === 'images' ? source.value.images : projets.map((p) => ({ image: p.image_apres, alt: p.titre, url: null }))
    return (
      <Section module="galerie" fond={fond} padding="none" className="py-[clamp(64px,8vw,110px)]">
        <SectionHead data={en_tete} level={level} coordonnees={coordonnees} className="!mb-7 md:items-baseline" />
        <ul data-reveal="" className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
          {images.map((img, index) => {
            if (!img.image) return null
            const tile = (
              <span className="group relative block aspect-square overflow-hidden bg-creme">
                <Image
                  src={img.image}
                  alt={img.alt ?? ''}
                  fill
                  sizes="(min-width: 768px) 17vw, 33vw"
                  className="object-cover saturate-90 transition-[filter,transform] duration-1000 group-hover:scale-[1.04] group-hover:saturate-110"
                />
              </span>
            )
            return (
              <li key={`${index}-${img.image}`}>
                {img.url ? (
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    {tile}
                  </a>
                ) : (
                  tile
                )}
              </li>
            )
          })}
        </ul>
      </Section>
    )
  }

  // Par défaut : cartes. Le lien pointe vers l'ancre du projet sur la page Réalisations.
  return (
    <Section module="galerie" fond={fond}>
      <SectionHead data={en_tete} level={level} coordonnees={coordonnees} />
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[clamp(16px,2.5vw,36px)]">
        {projets.map((p, index) => (
          <li key={p.slug} data-reveal="" data-reveal-delay={`${index * 0.1}s`}>
            <Link href={`/realisations#${p.slug}`} className="group block">
              {p.image_apres && (
                <div className="relative aspect-[4/5] overflow-hidden rounded-mk bg-sable">
                  <Image src={p.image_apres} alt={p.titre} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className={ZOOM} />
                </div>
              )}
              <div className="mt-3.5 flex items-baseline justify-between gap-3">
                <h3 className="text-xl">{p.titre}</h3>
                {p.lieu && <span className="text-[13px] uppercase tracking-[.12em] text-(--fg-muted)">{p.lieu}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/**
 * Sélection des projets d'un module galerie.
 *
 * Ordre des règles : sélection explicite de l'éditeur, puis filtre propre à
 * l'affichage, puis limite. Sans sélection explicite, les cartes privilégient
 * les projets `mis_en_avant` s'il y en a (teaser de l'accueil).
 */
async function selectProjets(
  { projets, limite }: { projets: (string | null)[]; limite: number },
  affichage: ModuleGalerie['affichage']
): Promise<Projet[]> {
  let items = await getProjets(projets)
  if (affichage === 'comparateur') items = items.filter((p) => Boolean(p.image_avant))
  if (projets.filter(Boolean).length === 0 && affichage === 'cartes' && items.some((p) => p.mis_en_avant)) {
    items = items.filter((p) => p.mis_en_avant)
  }
  return limite > 0 ? items.slice(0, limite) : items
}
