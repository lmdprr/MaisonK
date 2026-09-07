import type { Coordonnees, ModuleGrillePoints } from '@/lib/types'
import Section from '@/components/ui/Section'
import SectionHead from '@/components/ui/SectionHead'
import Wallpaper from '@/components/decor/Wallpaper'
import { SketchIcon } from '@/components/decor/Sketches'
import { Flower } from '@/components/decor/Wall'
import { CELL_COLORS, CELL_WALLPAPERS } from '@/components/decor/sketch-data'

type Props = ModuleGrillePoints & { level: 1 | 2; coordonnees: Coordonnees | null }

/**
 * Items numérotés ou illustrés. Deux styles :
 * - `cellules` : grille bordée (Pour qui). Chaque cellule porte un papier
 *   peint au trait (feuilles, arches, treillis) qui se dessine au survol, dans
 *   la couleur de son numéro ; motif et couleur sont assignés par index. Les
 *   filets sont portés par les cellules elles-mêmes : une rangée incomplète
 *   ne laisse pas de case vide, et la hauteur minimale n'existe qu'à partir
 *   de `md` pour ne pas creuser de vide sous le numéro sur mobile ;
 * - `liste` : bordure haute et grand numéro (Ma méthode, Ma démarche).
 *
 * Le numéro est calculé (01, 02...) ; une icône renseignée le remplace.
 */
export default function GrillePoints({ en_tete, fond, style, items, note_finale, level, coordonnees }: Props) {
  return (
    <Section module="grille_points" fond={fond}>
      <SectionHead data={en_tete} level={level} coordonnees={coordonnees} />

      {style === 'cellules' ? (
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] border-t border-l border-(--line)">
          {items.map((item, index) => {
            const color = CELL_COLORS[index % CELL_COLORS.length]
            return (
              <li
                key={`${index}-${item.titre}`}
                data-reveal=""
                data-reveal-delay={`${index * 0.1}s`}
                data-icone={item.icone}
                data-wallpaper={CELL_WALLPAPERS[index % CELL_WALLPAPERS.length]}
                className="relative flex flex-col gap-[18px] overflow-hidden border-b border-r border-(--line) bg-(--bg) p-[clamp(28px,3vw,44px)] transition-colors duration-500 hover:bg-(--hover-bg) md:min-h-[280px]"
              >
                {/* Papier peint derrière le contenu ; le `relative` des enfants les fait passer devant */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <Wallpaper kind={CELL_WALLPAPERS[index % CELL_WALLPAPERS.length]} color={color} />
                </span>
                {item.icone === 'aucune' ? (
                  <span className="num relative" style={{ color }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                ) : (
                  <SketchIcon name={item.icone} className="relative size-9" />
                )}
                <h3 className="relative mt-auto text-[28px]">{item.titre}</h3>
                {item.texte && <p className="relative text-(--fg-2)">{item.texte}</p>}
              </li>
            )
          })}
        </ol>
      ) : (
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[clamp(24px,3vw,40px)]">
          {items.map((item, index) => (
            <li key={`${index}-${item.titre}`} data-reveal="" data-reveal-delay={`${index * 0.12}s`} data-icone={item.icone} className="border-t border-(--line-strong) pt-[22px]">
              {item.icone === 'aucune' ? (
                <span className="block font-serif text-[clamp(40px,4vw,64px)] leading-none text-(--num)">
                  {String(index + 1).padStart(2, '0')}
                </span>
              ) : (
                <SketchIcon name={item.icone} className="size-10" />
              )}
              <h3 className={item.icone === 'aucune' ? 'mt-[18px]' : 'mt-4 text-[26px]'}>{item.titre}</h3>
              {item.texte && <p className="mt-3 text-base text-(--fg-2)">{item.texte}</p>}
            </li>
          ))}
        </ol>
      )}

      {note_finale && (
        <p data-reveal="" className="mt-[clamp(40px,5vw,64px)] flex items-center gap-3.5 text-(--accent)">
          <Flower className="size-3.5 shrink-0" color="currentColor" />
          {note_finale}
        </p>
      )}
    </Section>
  )
}
