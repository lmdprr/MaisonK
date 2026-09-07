import Link from 'next/link'
import Image from '@/components/ui/Img'
import type { Coordonnees, ModulePrestations } from '@/lib/types'
import { getPrestations } from '@/lib/keystatic'
import Section from '@/components/ui/Section'
import SectionHead from '@/components/ui/SectionHead'
import PlancheTeintes from '@/components/interactive/PlancheTeintes'
import { PlanSketch, SketchIcon } from '@/components/decor/Sketches'
import { CornerBloom, Flower } from '@/components/decor/Wall'

type Props = ModulePrestations & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Liste depuis la collection Prestations. Deux rendus, même source :
 * - `apercu` : accueil, lignes numérotées vers l'ancre de la prestation,
 *   fleur qui éclot dans le coin ;
 * - `detail` : page Prestations, articles alternés (image ou encart à gauche,
 *   texte à droite, puis l'inverse) avec icône croquis, livrables et durée.
 *
 * En `detail`, l'encart d'une prestation peut remplacer l'image par la planche
 * de teintes (composant client, colonne texte rendue sticky) ou ajouter le
 * plan 3D animé sous le texte. Sur mobile, le texte précède la planche : on
 * lit à quoi sert l'outil avant de tomber dessus.
 */
export default async function Prestations({ en_tete, affichage, prestations, fond, level, coordonnees }: Props) {
  const items = await getPrestations(prestations)

  if (affichage === 'apercu') {
    return (
      <Section module="prestations" fond={fond} className="isolate overflow-hidden">
        <CornerBloom />
        <SectionHead data={en_tete} level={level} coordonnees={coordonnees} />
        <ol className="flex flex-col">
          {items.map((p, index) => (
            <li key={p.slug} data-reveal="" data-reveal-delay={`${index * 0.08}s`}>
              <Link
                href={`/prestations#${p.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-[clamp(20px,4vw,64px)] border-t border-(--line) py-[clamp(24px,3vw,40px)] transition-[padding-left,color] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] hover:pl-4 hover:text-(--accent)"
              >
                <span className="num w-8">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <h3 className="text-[clamp(24px,2.6vw,40px)]">{p.titre}</h3>
                  {p.accroche && <p className="mt-2 max-w-[60ch] text-base text-(--fg-2)">{p.accroche}</p>}
                </span>
                <span aria-hidden="true" className="inline-block origin-left text-2xl text-(--num) transition-transform duration-500 group-hover:translate-x-1 group-hover:scale-x-[1.4]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    )
  }

  return (
    <Section module="prestations" fond={fond} padding="none" size="bleed">
      <div className="flex flex-col">
        {items.map((p, index) => {
          const alt = index % 2 === 1
          // La planche est haute : le texte reste visible pendant qu'on la compose.
          const sticky = p.encart === 'planche_teintes'
          return (
            <article
              key={p.slug}
              id={p.slug}
              data-reveal=""
              data-encart={p.encart}
              className={`grid scroll-mt-24 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(28px,5vw,80px)] border-t border-(--line) px-gutter py-[clamp(48px,6vw,88px)] ${
                alt ? 'bg-sable-2' : ''
              } ${sticky ? 'items-start' : 'items-center'}`}
            >
              <div className={alt ? 'md:order-2' : ''}>
                {p.encart === 'planche_teintes' ? (
                  <PlancheTeintes />
                ) : (
                  p.image && (
                    <div className="group relative aspect-[5/4] overflow-hidden rounded-mk bg-sable">
                      <Image
                        src={p.image}
                        alt={p.titre}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                  )
                )}
              </div>

              <div className={`${sticky ? 'order-first ' : ''}${alt ? 'md:order-1' : sticky ? 'md:order-none' : ''} ${sticky ? 'md:sticky md:top-24' : ''}`}>
                <div className="flex items-center gap-4">
                  <SketchIcon name={p.icone} className="size-10" />
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="mt-3.5 text-[clamp(30px,3vw,48px)] leading-[1.1]">{p.titre}</h2>
                {p.description && <p className="lead mt-[22px]">{p.description}</p>}
                {p.livrables.length > 0 && (
                  <ul className="mt-6 flex flex-col gap-2.5">
                    {p.livrables.map((l) => (
                      <li key={l} className="flex items-center gap-3">
                        <Flower color="#C07454" className="size-3.5 shrink-0" />
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
                {p.duree && <p className="mt-[26px] text-[13px] uppercase tracking-[.14em] text-(--fg-muted)">{p.duree}</p>}
                {p.encart === 'croquis_3d' && (
                  <div data-component="CroquisPlan" data-sketch="" className="mt-[34px] flex flex-wrap items-center gap-6">
                    <div className="w-[min(220px,55%)] [perspective:700px]">
                      <PlanSketch />
                    </div>
                    <p className="max-w-[18ch] font-serif text-[17px] italic leading-[1.35] text-bordeaux">La projection rend la décision concrète.</p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
