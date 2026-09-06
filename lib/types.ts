/**
 * Types du contenu Keystatic tels que le reader les renvoie.
 *
 * Transcription manuelle du schéma de `keystatic.config.ts` : Keystatic infère
 * des types, mais ils sont trop profonds pour être utilisables directement en
 * props de composants. Toute modification du schéma se reporte ici.
 *
 * Conventions :
 * - un champ texte optionnel arrive en `string | null` (jamais `undefined`) ;
 * - un `fields.conditional` arrive en `{ discriminant, value }` ;
 * - un `fields.image` arrive en chemin public (`/images/...`) ou `null`.
 */

// ── Types communs ──

/** Chemin public d'un `fields.image` (ex. `/images/projets/salon.jpg`), ou `null`. */
export type ImageField = string | null

/**
 * Contenu d'un `fields.document` résolu par le reader. C'est un arbre
 * `DocumentElement[]` de Keystatic, typé large ici et casté à la frontière
 * de `DocumentRenderer`.
 */
export type DocumentContent = unknown[]

export type Fond = 'creme' | 'sable' | 'sombre' | 'rose'
export type Icone = 'aucune' | 'fauteuil' | 'cadre' | 'plan' | 'plante'
export type PositionImage = 'gauche' | 'droite'

/**
 * Lien fléché ou bouton rouleau. `url` peut valoir `whatsapp`, résolu depuis
 * Coordonnées par `lib/links.ts`.
 */
export interface Lien {
  label?: string | null
  url?: string | null
}

/** Tête de section partagée : eyebrow, icône, titre, intro, lien. */
export interface EnTeteSection {
  eyebrow?: string | null
  icone: Icone
  titre?: string | null
  intro?: string | null
  lien: Lien
}

// ── Modules ──

export interface HeroSlide {
  image: ImageField
  alt?: string | null
  /** Alimente le compteur : « 01 / 04 · Home staging · Le Tampon ». */
  libelle?: string | null
  /** Fin du titre en italique, change avec la slide. */
  ligne_titre: string
  legende?: string | null
}

export interface ModuleHero {
  eyebrow?: string | null
  titre: string
  texte?: string | null
  cta: Lien
  citation?: string | null
  lien: Lien
  slides: HeroSlide[]
  defilement_auto: boolean
}

export interface VisuelImage {
  image: ImageField
  alt?: string | null
  position: PositionImage
}

/** Vocabulaire du papier peint pop : ce qui a été livré, ou les outils de ce qui est proposé. */
export type JeuMotif = 'mobilier' | 'atelier'

export type IntroVisuel =
  | { discriminant: 'aucun'; value: null }
  /** Papier peint pop dessiné par le code, sur la moitié droite. */
  | { discriminant: 'motif'; value: { jeu: JeuMotif } }
  | { discriminant: 'image'; value: VisuelImage }
  | { discriminant: 'portrait'; value: VisuelImage }

export interface ModuleIntro {
  eyebrow?: string | null
  icone: Icone
  titre: string
  /** Partie italique du titre, sur une seconde ligne. */
  titre_accent?: string | null
  contenu?: DocumentContent | null
  signature?: string | null
  lien: Lien
  fond: Fond
  visuel: IntroVisuel
  /** Page Contact : cartes WhatsApp / tél / e-mail et infos pratiques depuis Coordonnées. */
  afficher_contact: boolean
}

export interface PointItem {
  titre: string
  texte?: string | null
  /** Remplace le numéro calculé si différent de `aucune`. */
  icone: Icone
}

export interface ModuleGrillePoints {
  en_tete: EnTeteSection
  fond: Fond
  style: 'cellules' | 'liste'
  items: PointItem[]
  note_finale?: string | null
}

export interface ModulePrestations {
  en_tete: EnTeteSection
  affichage: 'apercu' | 'detail'
  /** Slugs de la collection `prestations` ; vide = toutes, dans l'ordre de la collection. */
  prestations: (string | null)[]
  fond: Fond
}

export interface GalerieImage {
  image: ImageField
  alt?: string | null
  url?: string | null
}

export type GalerieSource =
  | { discriminant: 'projets'; value: { projets: (string | null)[]; limite: number } }
  | { discriminant: 'images'; value: { images: GalerieImage[] } }

export interface ModuleGalerie {
  en_tete: EnTeteSection
  fond: Fond
  source: GalerieSource
  affichage: 'cartes' | 'fiches' | 'comparateur' | 'mosaique'
  /** Texte d'aide du comparateur (« glissez »). */
  texte_aide?: string | null
}

export interface ModuleZoneIntervention {
  en_tete: EnTeteSection
  affichage: 'defilant' | 'chips'
  fond: Fond
}

export interface ModuleBandeauCta {
  titre: string
  titre_accent?: string | null
  texte?: string | null
  cta: Lien
  fond: Fond
}

export interface ModuleFormulaireProjet {
  eyebrow?: string | null
  icone: Icone
  titre: string
  intro?: string | null
  /** Chips de l'étape 01. « Autre… » est ajouté par le composant. */
  pieces: string[]
  ambiances: string[]
  max_ambiances: number
  photo_activee: boolean
  label_envoi?: string | null
  note_envoi?: string | null
  confirmation: {
    /** `{prenom}` est remplacé par le prénom saisi. */
    titre?: string | null
    texte?: string | null
    etapes: string[]
    lien: Lien
  }
  /**
   * Adresse destinataire. Ne franchit jamais la frontière serveur / client :
   * `ModuleRenderer` la retire des props et la remplace par un jeton chiffré.
   */
  email_to: string
}

export interface ModuleTexte {
  contenu: DocumentContent
  largeur: 'etroit' | 'moyen' | 'pleine'
}

// ── Union discriminée des modules (consommée par ModuleRenderer) ──

export type PageModule =
  | { discriminant: 'hero'; value: ModuleHero }
  | { discriminant: 'intro'; value: ModuleIntro }
  | { discriminant: 'grille_points'; value: ModuleGrillePoints }
  | { discriminant: 'prestations'; value: ModulePrestations }
  | { discriminant: 'galerie'; value: ModuleGalerie }
  | { discriminant: 'zone_intervention'; value: ModuleZoneIntervention }
  | { discriminant: 'bandeau_cta'; value: ModuleBandeauCta }
  | { discriminant: 'formulaire_projet'; value: ModuleFormulaireProjet }
  | { discriminant: 'texte'; value: ModuleTexte }

// ── Page ──

export interface Page {
  slug: string
  status: 'published' | 'draft' | 'archived'
  title: string
  seo_title?: string | null
  seo_description?: string | null
  seo_no_index?: boolean
  canonical_url?: string | null
  seo_image?: ImageField
  modules: PageModule[]
}

// ── Collections ──

/** Choisit le croquis au trait des fiches Réalisations (`components/decor/sketch-data.ts`). */
export type TypePiece = 'salon' | 'cuisine' | 'chambre' | 'sejour' | 'maison' | 'autre'

export interface Projet {
  slug: string
  titre: string
  lieu?: string | null
  /** Ligne descriptive libre (« 67 m² · résidence principale »). */
  type?: string | null
  type_piece: TypePiece
  texte?: string | null
  image_apres: ImageField
  /** Requise pour apparaître dans le comparateur avant / après. */
  image_avant?: ImageField
  note?: string | null
  /** Sélection par défaut du teaser de l'accueil quand le module ne précise rien. */
  mis_en_avant: boolean
  ordre: number
}

/** Encart interactif d'une prestation : seul choix éditorial qui déclenche une décoration. */
export type Encart = 'aucun' | 'planche_teintes' | 'croquis_3d'

export interface Prestation {
  slug: string
  titre: string
  accroche?: string | null
  description?: string | null
  livrables: string[]
  duree?: string | null
  icone: Icone
  image?: ImageField
  encart: Encart
  ordre: number
}

// ── Singletons ──

export interface NavigationLink {
  label: string
  url: string
}

export interface Header {
  logo?: ImageField
  navigation_links: NavigationLink[]
  cta: Lien
}

export interface Footer {
  slogan?: string | null
  copyright_text?: string | null
  legal_links: NavigationLink[]
}

/**
 * Source unique pour tout ce qui touche au contact et aux villes. Lu une fois
 * par page et transmis à chaque module.
 */
export interface Coordonnees {
  /** Numéro international sans espaces (`+262692000000`), base du lien wa.me. */
  whatsapp?: string | null
  /** Numéro tel qu'affiché (« 0692 00 00 00 »). */
  telephone?: string | null
  email?: string | null
  instagram_handle?: string | null
  instagram_url?: string | null
  atelier?: string | null
  horaires?: string | null
  villes: string[]
}
