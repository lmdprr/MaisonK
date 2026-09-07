/**
 * Schéma Keystatic du site : pages composées de modules, deux collections
 * (projets, prestations) et trois singletons (header, footer, coordonnées).
 *
 * Ce fichier est la source de vérité du modèle de contenu. Il est chargé à la
 * fois par le navigateur (admin) et par le reader au build : ne rien y importer
 * qui dépende de Node. Les types côté rendu sont transcrits dans `lib/types.ts`.
 *
 * Le découpage en modules et les arguments derrière chaque choix sont
 * documentés dans `docs/plan-modules-keystatic.md`.
 */

import { config, collection, singleton, fields } from '@keystatic/core'

/** Slug de la page servie sur `/`. */
export const HOME_SLUG = 'accueil'

/**
 * Stockage GitHub en production, local ailleurs.
 *
 * Cette config est aussi chargée par le navigateur (l'admin est une app
 * cliente) : seules des variables `NEXT_PUBLIC_` peuvent piloter le choix du
 * stockage. Le dépôt est une information publique ; les secrets
 * (`KEYSTATIC_SECRET`, client id/secret GitHub) ne sont lus que par le route
 * handler côté serveur.
 *
 * Tant que le dépôt n'est pas renseigné (dev local, preview sans secrets), on
 * retombe sur le stockage local : sans ce garde-fou, `next build` échoue.
 */
const useGitHubStorage = Boolean(
  process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER && process.env.NEXT_PUBLIC_GITHUB_REPO_NAME
)

// ─────────────────────────────────────────────────────────────────────────────
// Sous-schémas partagés
//
// Déclarés sous forme de fonctions : Keystatic exige une instance de champ
// distincte à chaque emplacement du schéma, on ne peut pas réutiliser un objet.
// ─────────────────────────────────────────────────────────────────────────────

/** Fond de section. Texte, accent et filets en découlent (rôles CSS de globals.css). */
const fond = (defaultValue: 'creme' | 'sable' | 'sombre' | 'rose' = 'creme') =>
  fields.select({
    label: 'Fond de section',
    options: [
      { label: 'Crème', value: 'creme' },
      { label: 'Sable', value: 'sable' },
      { label: 'Sombre', value: 'sombre' },
      { label: 'Rose', value: 'rose' },
    ],
    defaultValue,
  })

/**
 * Icône croquis, tracée par `components/decor/sketch-data.ts`. C'est la seule
 * décoration exposée à l'éditeur : elle fait partie de l'identité de chaque page.
 */
const icone = (label = 'Icône croquis') =>
  fields.select({
    label,
    options: [
      { label: 'Aucune', value: 'aucune' },
      { label: 'Fauteuil', value: 'fauteuil' },
      { label: 'Cadre', value: 'cadre' },
      { label: 'Plan', value: 'plan' },
      { label: 'Plante', value: 'plante' },
    ],
    defaultValue: 'aucune',
  })

/** Lien fléché (« Mon parcours → »). L'URL `whatsapp` est résolue depuis Coordonnées (lib/links.ts). */
const lien = (label = 'Lien fléché') =>
  fields.object(
    {
      label: fields.text({ label: 'Label' }),
      url: fields.text({ label: 'URL (ou « whatsapp »)' }),
    },
    { label }
  )

/** Bouton rouleau de peinture. Même forme que `lien`, rendu différent (PaintButton). */
const cta = (label = 'Bouton') =>
  fields.object(
    {
      label: fields.text({ label: 'Label' }),
      url: fields.text({ label: 'URL (ou « whatsapp »)' }),
    },
    { label }
  )

/** Tête de section : eyebrow + icône + titre + intro + lien. Rendue par `ui/SectionHead`. */
const enTeteSection = () =>
  fields.object(
    {
      eyebrow: fields.text({ label: 'Eyebrow (petit texte au-dessus du titre)' }),
      icone: icone(),
      titre: fields.text({ label: 'Titre' }),
      intro: fields.text({ label: "Texte d'introduction", multiline: true }),
      lien: lien(),
    },
    { label: 'Tête de section' }
  )

/*
 * Deux helpers plutôt qu'un booléen : le type de retour de `fields.image`
 * dépend de la présence de `validation.isRequired`, un paramètre optionnel
 * ferait perdre l'inférence.
 *
 * Arborescence imposée par Keystatic : `public/images/<directory>/<slug>/<fichier>`
 * pour une entrée de collection, `public/images/<directory>/<fichier>` pour un
 * singleton. Un fichier placé ailleurs s'affiche sur le site mais l'admin ne le
 * retrouve pas et refuse d'enregistrer l'entrée.
 */
const image = (label: string, directory: string) =>
  fields.image({
    label,
    directory: `public/images/${directory}`,
    publicPath: `/images/${directory}`,
  })

const imageRequise = (label: string, directory: string) =>
  fields.image({
    label,
    directory: `public/images/${directory}`,
    publicPath: `/images/${directory}`,
    validation: { isRequired: true },
  })

const positionImage = () =>
  fields.select({
    label: "Position de l'image",
    options: [
      { label: 'À gauche', value: 'gauche' },
      { label: 'À droite', value: 'droite' },
    ],
    defaultValue: 'droite',
  })

// ─────────────────────────────────────────────────────────────────────────────
// Modules de page
//
// Neuf blocs, dans l'ordre d'apparition sur le site. Le niveau de titre n'est
// pas un champ : le premier module d'une page rend un h1, les suivants un h2
// (ModuleRenderer). Le décor (croquis, papiers peints) n'est pas un champ non
// plus, il est assigné par le code selon le module et sa variante.
// ─────────────────────────────────────────────────────────────────────────────

const modules = fields.blocks(
  {
    // Premier écran de l'accueil. Seul module avec diaporama ; volontairement
    // séparé de `intro` pour ne pas y ajouter un conditionnel.
    hero: {
      label: 'Hero (accueil)',
      itemLabel: (props) => props.fields.titre.value || 'Hero',
      schema: fields.object({
        eyebrow: fields.text({ label: 'Eyebrow' }),
        titre: fields.text({
          label: 'Titre (la ligne italique vient de la slide active)',
          validation: { isRequired: true },
        }),
        texte: fields.text({ label: 'Paragraphe', multiline: true }),
        cta: cta('Bouton rouleau'),
        citation: fields.text({ label: 'Citation à côté du croquis', multiline: true }),
        lien: lien('Lien fléché'),
        slides: fields.array(
          fields.object({
            image: imageRequise('Image', 'hero'),
            alt: fields.text({ label: "Texte alternatif de l'image" }),
            libelle: fields.text({ label: 'Libellé (compteur : « Home staging · Le Tampon »)' }),
            ligne_titre: fields.text({
              label: 'Fin du titre (italique bordeaux : « chaleureux et lumineux »)',
              validation: { isRequired: true },
            }),
            legende: fields.text({ label: 'Légende sous le libellé', multiline: true }),
          }),
          { label: 'Slides', itemLabel: (props) => props.fields.ligne_titre.value || 'Slide' }
        ),
        defilement_auto: fields.checkbox({ label: 'Défilement automatique', defaultValue: true }),
      }),
    },

    // Bloc titre + texte + visuel : en-tête de toutes les autres pages, bloc
    // Carole de l'accueil, page Contact. Les variantes sont des branches du
    // composant, pas des schémas distincts.
    intro: {
      label: 'Intro (titre + texte + visuel)',
      itemLabel: (props) => props.fields.titre.value || 'Intro',
      schema: fields.object({
        eyebrow: fields.text({ label: 'Eyebrow' }),
        icone: icone(),
        titre: fields.text({ label: 'Titre', validation: { isRequired: true } }),
        titre_accent: fields.text({ label: 'Titre — partie italique bordeaux (optionnel)' }),
        contenu: fields.document({
          label: 'Contenu',
          formatting: {
            inlineMarks: { bold: true, italic: true },
            softBreaks: true,
          },
          links: true,
        }),
        signature: fields.text({ label: 'Signature (ex. « Carole »)' }),
        lien: lien(),
        fond: fond(),
        visuel: fields.conditional(
          fields.select({
            label: 'Visuel',
            options: [
              { label: 'Aucun', value: 'aucun' },
              { label: 'Motif (papier peint pop dessiné par le code)', value: 'motif' },
              { label: 'Image', value: 'image' },
              { label: 'Portrait (motif floral ajouté par le code)', value: 'portrait' },
            ],
            defaultValue: 'aucun',
          }),
          {
            aucun: fields.empty(),
            motif: fields.object({
              jeu: fields.select({
                label: "Jeu d'objets",
                description: 'Mobilier : ce qui a été livré (Réalisations). Atelier : les outils de ce qui est proposé (Prestations).',
                options: [
                  { label: 'Mobilier', value: 'mobilier' },
                  { label: 'Atelier', value: 'atelier' },
                ],
                defaultValue: 'mobilier',
              }),
            }),
            image: fields.object({
              image: imageRequise('Image', 'intro'),
              alt: fields.text({ label: 'Texte alternatif' }),
              position: positionImage(),
            }),
            portrait: fields.object({
              image: imageRequise('Portrait', 'portraits'),
              alt: fields.text({ label: 'Texte alternatif' }),
              position: positionImage(),
            }),
          }
        ),
        afficher_contact: fields.checkbox({
          label: 'Afficher les cartes de contact et les infos pratiques (depuis Coordonnées)',
          defaultValue: false,
        }),
      }),
    },

    // Items numérotés ou illustrés (Pour qui, Ma méthode, Ma démarche).
    grille_points: {
      label: 'Grille de points',
      itemLabel: (props) => props.fields.en_tete.fields.titre.value || 'Grille de points',
      schema: fields.object({
        en_tete: enTeteSection(),
        fond: fond(),
        style: fields.select({
          label: 'Style',
          options: [
            { label: 'Cellules (grille bordée)', value: 'cellules' },
            { label: 'Liste (bordure haute, grand numéro)', value: 'liste' },
          ],
          defaultValue: 'cellules',
        }),
        items: fields.array(
          fields.object({
            titre: fields.text({ label: 'Titre', validation: { isRequired: true } }),
            texte: fields.text({ label: 'Texte', multiline: true }),
            icone: icone('Icône (remplace le numéro si renseignée)'),
          }),
          { label: 'Éléments', itemLabel: (props) => props.fields.titre.value || 'Élément' }
        ),
        note_finale: fields.text({ label: 'Note finale sous la grille', multiline: true }),
      }),
    },

    // Liste depuis la collection Prestations. Le module ne porte aucun texte
    // de prestation : tout vient de la collection.
    prestations: {
      label: 'Prestations (collection)',
      itemLabel: (props) =>
        props.fields.en_tete.fields.titre.value || `Prestations — ${props.fields.affichage.value}`,
      schema: fields.object({
        en_tete: enTeteSection(),
        affichage: fields.select({
          label: 'Affichage',
          options: [
            { label: 'Aperçu (lignes numérotées)', value: 'apercu' },
            { label: 'Détail (articles alternés)', value: 'detail' },
          ],
          defaultValue: 'apercu',
        }),
        prestations: fields.array(
          fields.relationship({ label: 'Prestation', collection: 'prestations' }),
          { label: 'Prestations à afficher (vide = toutes)', itemLabel: (props) => props.value || 'Prestation' }
        ),
        fond: fond(),
      }),
    },

    // Projets (collection) ou images libres, quatre affichages. Le comparateur
    // avant / après est ici et non dans un module à part : même source, même
    // sélection, seul le rendu change.
    galerie: {
      label: 'Galerie',
      itemLabel: (props) =>
        props.fields.en_tete.fields.titre.value || `Galerie — ${props.fields.affichage.value}`,
      schema: fields.object({
        en_tete: enTeteSection(),
        fond: fond(),
        source: fields.conditional(
          fields.select({
            label: 'Source',
            options: [
              { label: 'Projets (collection Réalisations)', value: 'projets' },
              { label: 'Images libres', value: 'images' },
            ],
            defaultValue: 'projets',
          }),
          {
            projets: fields.object({
              projets: fields.array(
                fields.relationship({ label: 'Projet', collection: 'projets' }),
                { label: 'Projets à afficher (vide = tous)', itemLabel: (props) => props.value || 'Projet' }
              ),
              limite: fields.integer({ label: 'Nombre maximum (0 = sans limite)', defaultValue: 0 }),
            }),
            images: fields.object({
              images: fields.array(
                fields.object({
                  image: imageRequise('Image', 'galerie'),
                  alt: fields.text({ label: 'Texte alternatif' }),
                  url: fields.text({ label: 'Lien (optionnel)' }),
                }),
                { label: 'Images', itemLabel: (props) => props.fields.alt.value || 'Image' }
              ),
            }),
          }
        ),
        affichage: fields.select({
          label: 'Affichage',
          options: [
            { label: 'Cartes (image 4/5, titre, lieu)', value: 'cartes' },
            { label: 'Fiches (image 4/3, croquis, type, texte)', value: 'fiches' },
            { label: 'Comparateur avant / après', value: 'comparateur' },
            { label: 'Mosaïque (carrés sans texte)', value: 'mosaique' },
          ],
          defaultValue: 'cartes',
        }),
        texte_aide: fields.text({ label: "Texte d'aide du comparateur (« glissez »)" }),
      }),
    },

    // Villes lues dans le singleton Coordonnées : le module ne fait que les afficher.
    zone_intervention: {
      label: "Zone d'intervention (villes)",
      itemLabel: (props) => props.fields.en_tete.fields.titre.value || `Villes — ${props.fields.affichage.value}`,
      schema: fields.object({
        en_tete: enTeteSection(),
        affichage: fields.select({
          label: 'Affichage',
          options: [
            { label: 'Bandeau défilant', value: 'defilant' },
            { label: 'Nuage de pastilles', value: 'chips' },
          ],
          defaultValue: 'defilant',
        }),
        fond: fond('sable'),
      }),
    },

    // Bandeau d'appel à l'action, en bas de page.
    bandeau_cta: {
      label: 'Bandeau CTA',
      itemLabel: (props) => props.fields.titre.value || 'Bandeau CTA',
      schema: fields.object({
        titre: fields.text({ label: 'Titre', validation: { isRequired: true } }),
        titre_accent: fields.text({ label: 'Titre — partie italique bordeaux' }),
        texte: fields.text({ label: 'Texte', multiline: true }),
        cta: cta('Bouton rouleau'),
        fond: fond('rose'),
      }),
    },

    // Page « Votre projet » entière : intro, planche de teintes, formulaire en
    // quatre étapes, confirmation. La planche et la photo sont gérées par le code.
    formulaire_projet: {
      label: 'Formulaire projet',
      itemLabel: (props) => props.fields.titre.value || 'Formulaire projet',
      schema: fields.object({
        eyebrow: fields.text({ label: 'Eyebrow' }),
        icone: icone(),
        titre: fields.text({ label: 'Titre', validation: { isRequired: true } }),
        intro: fields.text({ label: "Texte d'introduction", multiline: true }),
        pieces: fields.array(fields.text({ label: 'Pièce' }), {
          label: 'Étape 01 — pièces proposées (« Autre… » est ajouté par le code)',
          itemLabel: (props) => props.value || 'Pièce',
        }),
        ambiances: fields.array(fields.text({ label: 'Ambiance' }), {
          label: 'Étape 02 — ambiances proposées',
          itemLabel: (props) => props.value || 'Ambiance',
        }),
        max_ambiances: fields.integer({
          label: "Nombre maximum d'ambiances",
          defaultValue: 3,
          validation: { min: 1, max: 10 },
        }),
        photo_activee: fields.checkbox({ label: 'Étape 03 — proposer une photo', defaultValue: true }),
        label_envoi: fields.text({ label: "Texte du bouton d'envoi", defaultValue: 'Envoyer ma demande' }),
        note_envoi: fields.text({ label: 'Note sous le bouton', multiline: true }),
        confirmation: fields.object(
          {
            titre: fields.text({ label: 'Titre (« {prenom} » est remplacé par le prénom)' }),
            texte: fields.text({ label: 'Texte', multiline: true }),
            etapes: fields.array(fields.text({ label: 'Étape' }), {
              label: 'Les prochaines étapes',
              itemLabel: (props) => props.value || 'Étape',
            }),
            lien: lien(),
          },
          { label: 'Confirmation après envoi' }
        ),
        // Chiffrée au pré-rendu par ModuleRenderer, jamais envoyée en clair au navigateur.
        email_to: fields.text({
          label: 'Email destinataire (jamais exposé côté client)',
          validation: { isRequired: true },
        }),
      }),
    },

    // Texte riche : mentions légales, pages libres. La soupape de tout CMS.
    texte: {
      label: 'Texte riche',
      schema: fields.object({
        contenu: fields.document({
          label: 'Contenu',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/content',
            publicPath: '/images/content',
          },
        }),
        largeur: fields.select({
          label: 'Largeur du contenu',
          options: [
            { label: 'Étroit (prose)', value: 'etroit' },
            { label: 'Moyen', value: 'moyen' },
            { label: 'Pleine largeur', value: 'pleine' },
          ],
          defaultValue: 'etroit',
        }),
      }),
    },
  },
  { label: 'Modules de la page' }
)

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export default config({
  storage: useGitHubStorage
    ? {
        kind: 'github',
        repo: {
          owner: process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER!,
          name: process.env.NEXT_PUBLIC_GITHUB_REPO_NAME!,
        },
        // Les branches créées depuis l'admin sont préfixées, pour les
        // distinguer des branches de dev dans les PR.
        branchPrefix: 'content/',
      }
    : { kind: 'local' },

  ui: {
    brand: { name: 'MaisonK' },
    navigation: {
      Contenu: ['pages', 'projets', 'prestations'],
      Site: ['header', 'footer', 'coordonnees'],
    },
  },

  collections: {
    // Une page = un fichier YAML + un dossier pour les contenus riches
    // (`content/pages/<slug>/modules/<index>/value/contenu.mdoc`).
    pages: collection({
      label: 'Pages',
      slugField: 'slug',
      path: 'content/pages/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.text({ label: 'Titre de la page', validation: { isRequired: true } }),
        slug: fields.text({ label: 'Slug URL', validation: { isRequired: true } }),
        status: fields.select({
          label: 'Statut',
          options: [
            { label: 'Publié', value: 'published' },
            { label: 'Brouillon', value: 'draft' },
            { label: 'Archivé', value: 'archived' },
          ],
          defaultValue: 'draft',
        }),
        seo_title: fields.text({ label: 'SEO — Titre (balise title)' }),
        seo_description: fields.text({ label: 'SEO — Description', multiline: true }),
        seo_no_index: fields.checkbox({
          label: 'Masquer des moteurs de recherche (noindex)',
          defaultValue: false,
        }),
        canonical_url: fields.url({ label: 'URL canonique (optionnel)' }),
        seo_image: image('SEO — Image Open Graph', 'seo'),
        modules,
      },
    }),

    // Réalisations. Affichées par le module galerie (cartes, fiches, comparateur).
    projets: collection({
      label: 'Projets (réalisations)',
      slugField: 'titre',
      path: 'content/projets/*',
      format: { data: 'yaml' },
      schema: {
        titre: fields.slug({ name: { label: 'Titre', validation: { isRequired: true } } }),
        lieu: fields.text({ label: 'Lieu (ex. Saint-Pierre)' }),
        type: fields.text({ label: 'Type (ex. 67 m² · résidence principale)' }),
        type_piece: fields.select({
          label: 'Type de pièce (choisit le croquis au trait)',
          options: [
            { label: 'Salon', value: 'salon' },
            { label: 'Cuisine', value: 'cuisine' },
            { label: 'Chambre', value: 'chambre' },
            { label: 'Séjour', value: 'sejour' },
            { label: 'Maison', value: 'maison' },
            { label: 'Autre', value: 'autre' },
          ],
          defaultValue: 'salon',
        }),
        texte: fields.text({ label: 'Description', multiline: true }),
        image_apres: imageRequise('Image après (réalisé)', 'projets'),
        image_avant: image('Image avant (3D) — requise pour le comparateur', 'projets'),
        note: fields.text({ label: 'Note italique sous le comparateur', multiline: true }),
        mis_en_avant: fields.checkbox({ label: "Mis en avant sur l'accueil", defaultValue: false }),
        ordre: fields.integer({ label: 'Ordre', defaultValue: 0 }),
      },
    }),

    // Prestations. Affichées par le module du même nom (aperçu, détail).
    prestations: collection({
      label: 'Prestations',
      slugField: 'titre',
      path: 'content/prestations/*',
      format: { data: 'yaml' },
      schema: {
        titre: fields.slug({ name: { label: 'Titre', validation: { isRequired: true } } }),
        accroche: fields.text({ label: "Accroche (ligne courte de l'aperçu)" }),
        description: fields.text({ label: 'Description', multiline: true }),
        livrables: fields.array(fields.text({ label: 'Livrable' }), {
          label: 'Livrables',
          itemLabel: (props) => props.value || 'Livrable',
        }),
        duree: fields.text({ label: 'Durée (ex. Phase technique · sur devis)' }),
        icone: icone(),
        image: image('Image', 'prestations'),
        // Seul endroit où un choix éditorial déclenche une décoration : c'est
        // du contenu (quelle prestation porte la planche), pas du style.
        encart: fields.select({
          label: 'Encart interactif',
          options: [
            { label: 'Aucun', value: 'aucun' },
            { label: "Planche de teintes (remplace l'image)", value: 'planche_teintes' },
            { label: 'Croquis 3D + citation (sous le texte)', value: 'croquis_3d' },
          ],
          defaultValue: 'aucun',
        }),
        ordre: fields.integer({ label: 'Ordre', defaultValue: 0 }),
      },
    }),
  },

  singletons: {
    // Le footer reprend les liens du header et les infos de Coordonnées :
    // rien n'est saisi deux fois.
    header: singleton({
      label: 'Header',
      path: 'content/global/header',
      format: { data: 'yaml' },
      schema: {
        logo: image('Logo', 'logo'),
        navigation_links: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            url: fields.text({ label: 'URL', validation: { isRequired: true } }),
          }),
          { label: 'Liens de navigation', itemLabel: (props) => props.fields.label.value || 'Lien' }
        ),
        cta: cta('Bouton (rouleau)'),
      },
    }),

    footer: singleton({
      label: 'Footer',
      path: 'content/global/footer',
      format: { data: 'yaml' },
      schema: {
        slogan: fields.text({ label: 'Slogan sous le logo', multiline: true }),
        copyright_text: fields.text({ label: 'Texte copyright' }),
        legal_links: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            url: fields.text({ label: 'URL', validation: { isRequired: true } }),
          }),
          { label: 'Liens légaux', itemLabel: (props) => props.fields.label.value || 'Lien' }
        ),
      },
    }),

    // Source unique pour le contact et les villes. Lu par header, footer,
    // intro (cartes contact), bandeau_cta, zone_intervention.
    coordonnees: singleton({
      label: 'Coordonnées',
      path: 'content/global/coordonnees',
      format: { data: 'yaml' },
      schema: {
        whatsapp: fields.text({ label: 'Numéro WhatsApp (international, ex. +262692000000)' }),
        telephone: fields.text({ label: 'Téléphone affiché (ex. 0692 00 00 00)' }),
        email: fields.text({ label: 'E-mail' }),
        instagram_handle: fields.text({ label: 'Instagram — handle (ex. @maisonk.re)' }),
        instagram_url: fields.url({ label: 'Instagram — URL' }),
        atelier: fields.text({ label: 'Atelier (ex. Le Tampon, La Réunion)' }),
        horaires: fields.text({ label: 'Horaires' }),
        villes: fields.array(fields.text({ label: 'Ville' }), {
          label: "Zone d'intervention (villes)",
          itemLabel: (props) => props.value || 'Ville',
        }),
      },
    }),
  },
})
