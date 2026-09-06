# Plan : recréer le design v2 en modules Keystatic réutilisables

Référence : `Claude_Design/project/MaisonK v2.dc.html` (la v1 est un sous-ensemble, l'argumentaire n'est pas une page du site).
Décisions prises le 5 septembre 2026 :

- les 11 modules boilerplate actuels sont **remplacés** ;
- Réalisations et Prestations deviennent des **collections** ;
- on garde **tout l'interactif** (avant/après, planche de teintes, formulaire projet avec photo) ;
- les décorations (croquis, papiers peints, rouleau de peinture, motif) restent **dans le code**.

---

## 1. Inventaire des écrans de la maquette

| Page | Sections dans la maquette |
|---|---|
| Accueil | Hero split + diaporama · Marquee villes · Pour qui (3 cartes) · Carole (portrait + texte) · Prestations aperçu (4 lignes, fond sombre) · Réalisations teaser (4 cartes) · Bandeau CTA · Instagram (6 images) |
| Prestations | En-tête (titre + intro) · 4 prestations en articles alternés (image ou planche de teintes, liste de livrables, durée) · Ma méthode (4 étapes, fond sombre) · Bandeau CTA |
| Réalisations | En-tête · Comparateur avant/après (onglets projets + curseur) · Grille 6 projets (croquis, type, texte) · Bandeau CTA |
| À propos | En-tête avec portrait · Ma démarche (3 valeurs, fond sable) · Toute l'île (texte + nuage de villes) · Bandeau CTA |
| Contact | En-tête + 3 cartes de contact (WhatsApp, tél, e-mail) · image + infos (atelier, horaires, réseaux) |
| Votre projet | Intro sticky + planche de teintes · formulaire en 4 étapes (pièce, ambiance, photo, coordonnées) · état de confirmation |
| Global | Header (logo, 5 liens, CTA rouleau) · Footer (logo, navigation, contact, copyright, mentions) |

Soit 25 sections visibles. Elles se ramènent à **9 modules**, parce que la maquette répète cinq motifs :
un bloc « eyebrow + titre + texte + visuel », une grille d'items numérotés, une liste issue d'une collection,
un bandeau, et un fond de section qui change (crème, sable, sombre, rose).

---

## 2. Trois leviers de réutilisation (avant de lister les modules)

### 2.1 Un sélecteur `fond` partagé au lieu de variantes « sombre »
La maquette n'a pas de « module sombre » : c'est le même bloc avec un autre fond.
Un champ commun `fond : crème | sable | sombre | rose` est ajouté aux modules de section.
Les couleurs de texte, d'eyebrow et de bordure découlent du fond (tokens CSS), l'éditeur ne choisit jamais une couleur.

### 2.2 Un sous-schéma `en_tete_section` partagé
Sept sections commencent par : eyebrow (avec icône croquis optionnelle) · titre · texte d'intro ou lien fléché.
Il est déclaré une fois dans `keystatic.config.ts` (objet `fields.object`) et inclus dans les modules concernés.
Même chose pour `lien` (label + url) et `cta` (label + url, rendu bouton rouleau).

### 2.3 Des collections pour ce qui apparaît plusieurs fois
Les projets sont affichés 4 fois (hero, teaser, comparateur, grille) et les prestations 2 fois.
Ils deviennent des entrées de collection ; les modules les **référencent** (`fields.relationship`) au lieu de les recopier.

---

## 3. Les 9 modules de page

Le rendu d'un titre en `h1` ou `h2` est automatique : le premier module d'une page rend un `h1`.
Aucun champ « niveau de titre » dans l'admin.

### 3.1 `hero` — Premier écran de l'accueil (1 usage)

Module à part, volontairement : c'est le seul bloc avec un diaporama, une ligne de titre qui change avec la slide,
un bouton rouleau et un croquis animé. Le garder hors de `intro` évite un conditionnel que l'intégrateur devrait démêler.

| Champ | Type | Note |
|---|---|---|
| `eyebrow` | text | « Conception & décoration d'intérieur · La Réunion » |
| `titre` | text | « Construire vos espaces de vie, » ; la ligne italique bordeaux vient de la slide active |
| `texte` | text multiligne | paragraphe sous le titre |
| `cta` | objet partagé | bouton rouleau « Découvrir mes prestations » |
| `citation` | text | « Acheter moins, choisir juste… » à côté du croquis |
| `lien` | objet partagé | lien fléché « Voir mes réalisations » |
| `slides[]` | `{ image, alt, libelle, ligne_titre, legende }` | 4 slides dans la maquette ; `libelle` alimente le compteur « 01 / 04 · HOME STAGING · LE TAMPON » |
| `defilement_auto` | checkbox | autoplay, défaut activé |

Composant client (état de la slide, minuterie). Le croquis animé et le rouleau sont dans le code.

### 3.2 `intro` — Bloc titre + texte + visuel (5 usages)

Couvre : en-tête Prestations · en-tête Réalisations · en-tête À propos · bloc Carole (Accueil) · page Contact.

| Champ | Type | Note |
|---|---|---|
| `eyebrow`, `icone` | text, select (aucune, fauteuil, cadre, plan, plante) | seule décoration exposée : l'icône fait partie de l'identité de chaque page |
| `titre`, `titre_accent` | text | `titre_accent` = la partie italique bordeaux (« Carole Mondon ») |
| `contenu` | document (gras, italique, paragraphes) | intro Prestations, 2 paragraphes À propos, texte Carole |
| `signature` | text | « Carole » sur À propos, vide ailleurs |
| `lien` | objet partagé | lien fléché (« Mon parcours », « Composez votre planche ») |
| `fond` | select partagé | Carole = sable, les autres = crème |
| `visuel` | `fields.conditional` | voir ci-dessous |
| `afficher_contact` | checkbox | rend les 3 cartes WhatsApp / tél / e-mail + la liste atelier / horaires / réseaux, depuis le singleton Coordonnées |

`visuel` (conditionnel, l'admin n'affiche que les champs de la valeur choisie) :

- `aucun` : si `contenu` est rempli, il passe en colonne droite alignée en bas (en-tête Prestations) ; sinon titre seul (Réalisations).
- `image` : image + position (gauche / droite). Contact utilise `droite`.
- `portrait` : image + position ; le motif floral et le fond bordeaux sont ajoutés par le code. Carole = gauche, À propos = droite.

Pourquoi un seul module pour ces cinq blocs : ils partagent tous leurs champs texte et la même grille à deux colonnes.
Les différences (portrait, image, cartes de contact) sont des branches du composant React, pas des schémas distincts.
Composant serveur, aucun état.

### 3.3 `grille_points` — Items numérotés ou illustrés (3 usages)

Couvre : Pour qui (3 cartes cellules) · Ma méthode (4 étapes, sombre) · Ma démarche (3 valeurs, sable).

| Champ | Type |
|---|---|
| `en_tete_section` | sous-schéma partagé (eyebrow, titre, intro, lien) |
| `fond` | select partagé |
| `style` | select : `cellules` (grille bordée, papier peint au survol) · `liste` (bordure haute, grand numéro ou icône) |
| `items[]` | `{ titre, texte, icone? }` — le numéro est calculé (01, 02…) ; si `icone` est renseignée elle remplace le numéro (valeurs de À propos) |
| `note_finale` | text — « C'est cette rigueur qui différencie… » sous les étapes |

Les papiers peints par carte (feuilles, arches, treillis) et leurs couleurs sont assignés par index dans le code.

### 3.4 `prestations` — Liste depuis la collection Prestations (2 usages)

Couvre : aperçu Accueil (4 lignes, fond sombre) · page Prestations (articles alternés).

| Champ | Type |
|---|---|
| `en_tete_section` | partagé (utilisé seulement en `apercu`) |
| `affichage` | select : `apercu` (numéro, titre, accroche, flèche) · `detail` (image ou encart, icône, description, livrables, durée) |
| `prestations[]` | `array(relationship)` — vide = toutes, dans l'ordre de la collection |
| `fond` | select partagé |

Le module ne contient aucun texte de prestation : tout vient de la collection (section 4.2).

### 3.5 `galerie` — Projets et images (4 usages)

Couvre : teaser Accueil (4 cartes 4/5) · grille Réalisations (6 fiches) · comparateur avant/après · mosaïque Instagram.

| Champ | Type |
|---|---|
| `en_tete_section` | partagé (Instagram : titre « Suivez les coulisses » + lien « @maisonk.re ↗ ») |
| `fond` | select partagé |
| `source` | conditionnel : `projets` → `{ projets[] (relationship, vide = tous), limite }` · `images` → `{ images[] { image, alt, url? } }` |
| `affichage` | select : `cartes` (image 4/5, titre, lieu) · `fiches` (image 4/3, croquis, titre, lieu, type, texte) · `comparateur` (onglets + curseur + note) · `mosaique` (carrés, sans texte) |
| `texte_aide` | text — « glissez » sur le comparateur |

Pourquoi le comparateur est ici et pas dans un module à part : même source (collection Projets), même sélection ;
seul le rendu change. Le composant client du curseur n'est chargé que si `affichage = comparateur`.
Le comparateur n'affiche que les projets ayant une `image_avant` réelle : l'« avant simulé » (photo désaturée) de la maquette est abandonné, comme le recommande l'argumentaire.

### 3.6 `zone_intervention` — Villes (2 usages)

Couvre : marquee défilant (Accueil) · nuage de chips « Toute l'île » (À propos).

| Champ | Type |
|---|---|
| `en_tete_section` | partagé (vide pour le marquee) |
| `affichage` | select : `defilant` · `chips` |
| `fond` | select partagé |

La liste des villes vit dans le singleton Coordonnées (une seule source), le module ne fait que l'afficher.
Le séparateur floral du marquee est dans le code.

### 3.7 `bandeau_cta` — Appel à l'action (4 usages)

Couvre : « Envie de révéler le potentiel de votre intérieur ? » sur Accueil, Prestations, Réalisations, À propos.

| Champ | Type |
|---|---|
| `titre`, `titre_accent` | text |
| `texte` | text |
| `cta` | partagé ; l'URL peut valoir `whatsapp` pour construire le lien depuis Coordonnées |
| `fond` | select partagé (rose par défaut) |

Reprend `module_cta_banner` existant en le restylant ; on ajoute `titre_accent` et on retire `style`.

### 3.8 `formulaire_projet` — Votre projet (1 usage)

Couvre la page entière : intro sticky, planche de teintes, formulaire 4 étapes, confirmation.
Remplace `module_lead_form` et conserve son mécanisme de sécurité (`email_to` chiffré au pré-rendu, jamais exposé au client).

| Champ | Type |
|---|---|
| `eyebrow`, `icone`, `titre`, `intro` | comme `intro` |
| `pieces[]` | text — chips de l'étape 01 (Salon, Chambre… ; « Autre… » géré par le code) |
| `ambiances[]`, `max_ambiances` | text, integer (3) |
| `photo_activee` | checkbox |
| `label_envoi`, `note_envoi` | text — « Recevoir mon créneau d'échange », « Aucun engagement, aucune newsletter » |
| `confirmation` | objet : `titre` (avec `{prenom}`), `texte`, `etapes[]` (3 lignes), `lien` |
| `email_to` | text (requis) |

Hors schéma, dans le code :
- **Planche de teintes** : sélecteur teinte/clarté/hex + 6 matières (textures CSS). Bibliothèque fixe.
  L'état est persisté en `localStorage` pour survivre à la navigation entre la page Prestations (encart) et le formulaire.
  La planche est envoyée dans l'e-mail sous forme de liste « nom · hex ».
- **Photo** : redimensionnée côté client (max ~1 600 px, < 1,5 Mo) puis envoyée en pièce jointe Resend (base64).
  Aucun stockage serveur, rien à purger côté RGPD. R2 n'est pas nécessaire pour ça.
- **Confirmation** : composant client qui remplace le formulaire après envoi (pas de page dédiée).

### 3.9 `texte` — Texte riche (0 usage dans la maquette, indispensable)

Mentions légales, politique de confidentialité, futurs articles.
Reprend `module_rich_text` (document + `largeur`), restylé avec la typo du site. C'est la soupape de tout CMS.

---

## 4. Collections

### 4.1 `projets` (Réalisations)

| Champ | Type | Sert à |
|---|---|---|
| `titre`, `slug` | text | tout |
| `lieu` | text (« Saint-Pierre ») | cartes, fiches, comparateur |
| `type` | text (« 67 m² · résidence principale ») | fiches, comparateur |
| `type_piece` | select : salon, cuisine, chambre, séjour, maison, autre | choisit le croquis au trait des fiches (code) |
| `texte` | text multiligne | fiches |
| `image_apres` | image (requis) | tout |
| `image_avant` | image (optionnel, 3D) | comparateur seulement |
| `note` | text | phrase italique sous le comparateur |
| `mis_en_avant` | checkbox | teaser Accueil quand `projets[]` est vide |
| `ordre` | integer | tri |

### 4.2 `prestations`

| Champ | Type |
|---|---|
| `titre`, `slug` | text |
| `accroche` | text — ligne courte de l'aperçu |
| `description` | text multiligne |
| `livrables[]` | text — 3 lignes cochées |
| `duree` | text — « Phase technique · sur devis » |
| `icone` | select (fauteuil, cadre, plan, plante) |
| `image` | image |
| `encart` | select : `aucun` · `planche_teintes` (remplace l'image par la planche interactive) · `croquis_3d` (ajoute le croquis plan + citation sous le texte) |
| `ordre` | integer |

`encart` est le seul endroit où un choix de l'éditeur déclenche une décoration : c'est du contenu (quelle prestation porte la planche), pas du style.

---

## 5. Singletons

| Singleton | Statut | Contenu |
|---|---|---|
| `header` | existant, conservé | logo, liens de navigation, CTA (label). L'URL du CTA peut valoir `whatsapp`. |
| `footer` | existant, allégé | slogan, copyright, liens légaux. La colonne Navigation reprend `header`, la colonne Contact reprend `coordonnees` : rien n'est saisi deux fois. |
| `coordonnees` | **nouveau** | numéro WhatsApp, téléphone, e-mail, Instagram (handle + url), atelier, horaires, `villes[]`. Lu par : header, footer, `intro` (cartes contact), `bandeau_cta`, `zone_intervention`, `formulaire_projet` (adresse d'envoi par défaut). |

---

## 6. Ce qui reste dans le code (et pourquoi)

| Élément | Où | Raison |
|---|---|---|
| Tokens : crème #EDEAE4, sable #D7D0B4, sombre #151515, rose #E6D9D3, bordeaux #551020, terracotta #C07454, rose clair #C08A96, sauge #8BC1A9 ; Playfair Display + Manjari ; rayon 2 px | `globals.css` (`@theme`) | un seul endroit, jamais dans le YAML |
| Bouton rouleau de peinture, lien fléché, eyebrow, pilule | `components/ui` | primitives réutilisées par tous les modules |
| Croquis SVG (icônes, pièces, plan 3D), papiers peints, bandes de mur, filtre crayon, motif.png | `components/decor` | décoration pure, assignée par module / variante / index |
| Animations reveal, marquee, fade | CSS + petit hook | respectent `prefers-reduced-motion` |
| Textures des 6 matières de la planche | `lib/planche.ts` | ce sont des dégradés CSS, pas des images |

---

## 7. Composition des pages avec ces modules

| Page | Modules dans l'ordre |
|---|---|
| Accueil | `hero` · `zone_intervention` (défilant, sable) · `grille_points` (cellules) · `intro` (portrait gauche, sable) · `prestations` (aperçu, sombre) · `galerie` (projets, cartes) · `bandeau_cta` · `galerie` (images, mosaïque, sable) |
| Prestations | `intro` (aucun, intro à droite) · `prestations` (détail) · `grille_points` (liste, sombre) · `bandeau_cta` |
| Réalisations | `intro` (aucun) · `galerie` (projets, comparateur) · `galerie` (projets, fiches) · `bandeau_cta` |
| À propos | `intro` (portrait droite) · `grille_points` (liste, sable) · `zone_intervention` (chips) · `bandeau_cta` |
| Contact | `intro` (image droite, `afficher_contact`) |
| Votre projet | `formulaire_projet` |
| Mentions légales | `texte` |

Toutes les sections de la maquette sont couvertes. Trois modules n'ont qu'un usage : `hero` (premier écran, volontairement isolé), `formulaire_projet` et `texte` (pages à part entière).

---

## 8. Correspondance avec les modules boilerplate

| Ancien | Devient |
|---|---|
| `module_hero`, `hero_slides` | `hero` |
| `module_image_text` | `intro` |
| `module_features_grid`, `module_stats` | `grille_points` |
| `module_cta_banner` | `bandeau_cta` |
| `module_lead_form` | `formulaire_projet` |
| `module_rich_text` | `texte` |
| `module_testimonials`, `module_faq`, `module_logo_cloud` | supprimés (absents de la maquette ; récupérables depuis l'historique si besoin) |

---

## 9. Ordre d'implémentation proposé

Avancement au 5 septembre 2026 : les sept étapes sont faites. Schéma, types, readers,
admin vérifiée, assets migrés, sept pages et deux collections remplies, tokens et polices
dans `globals.css`, primitives `ui/` stylées, les neuf modules mis en page, les quatre
composants clients dans `components/interactive/` (diaporama, comparateur, planche de
teintes persistée, formulaire avec envoi Resend), et le décor dans `components/decor/` :
moteur `Sketch` (traits qui se dessinent, aplats, fantômes), bibliothèque `sketch-data.ts`
portée de la maquette (icônes, croquis de pièces, salon du hero, plan 3D, quadrilobe),
`Wall` (frise, semis, médaillon, bande), `Wallpaper` (feuilles, arches, treillis au survol),
`PencilFilter`, et `DecorRuntime` (client, monté une fois dans le layout : apparitions au
défilement `data-reveal`, déclenchement des croquis `data-sketch`, rouleau de peinture
`data-paint`). Reste le nettoyage final (étape 8) et les placeholders de contenu.

Assignation du décor par module (décidé dans le code, section 6) :
`intro` portrait h2 → frise basse ; portrait h1 → médaillon d'angle ; contact → semis ;
`bandeau_cta` → bande droite ; `formulaire_projet` → semis ; `prestations` aperçu → fleur
qui éclot ; `grille_points` cellules → papier peint par index ; `galerie` fiches → croquis
par `type_piece` ; `hero` → salon animé ; eyebrows et prestations → icône par `icone`.

Tokens en place : couleurs (`creme`, `sable`, `sable-2`, `sombre`, `rose`, `bordeaux`,
`terracotta`, `rose-clair`, `sauge`, `fleur`, `encre`, `gris`, `muted`), rythmes
(`gutter`, `section`, `section-sm`, `head`), rayon `mk`. Le fond d'un module redéfinit les
rôles `--bg`, `--fg`, `--fg-2`, `--fg-muted`, `--accent`, `--num`, `--line`, `--line-strong`.

Conventions de contenu apprises en route :
- **images d'une entrée de collection** : Keystatic les range dans `<directory>/<slug>/<fichier>`
  et écrit `<publicPath>/<slug>/<fichier>` dans le YAML (ex. `public/images/hero/accueil/tampon-salon.jpg`
  → `/images/hero/accueil/tampon-salon.jpg`). Un chemin à plat s'affiche sur le site mais l'admin
  ne retrouve pas le fichier, considère le champ vide et refuse d'enregistrer (« Image is required »).
  Les singletons (header, coordonnées) n'ont pas de sous-dossier ;
- un texte YAML contenant « : » doit être entre guillemets ;
- le contenu riche (`fields.document`) d'un module vit dans un fichier à part :
  `content/pages/<slug>/modules/<index>/value/contenu.mdoc` (Markdoc) ;
- après ajout d'une page, redémarrer `npm run dev` : la liste des slugs est figée au premier appel.

1. **Fondations** : tokens dans `globals.css`, polices, primitives `ui/` (Section avec `fond`, Eyebrow, Heading, ArrowLink, PaintButton, Pill). ✅
2. **Schéma** : singleton `coordonnees`, collections `projets` et `prestations`, sous-schémas partagés, puis les 9 modules. Mettre à jour `lib/types.ts` et `ModuleRenderer` (qui passe désormais `index` pour le h1 automatique). ✅
3. **Migration des assets** : `Claude_Design/project/assets/**` vers `public/images/{hero,projets,prestations,portraits,logo,galerie,intro}`, puis `npm run sync:images` au déploiement. ✅ (copie locale faite)
4. **Contenu** : les textes de la maquette sont déjà structurés dans le script v2 (`services`, `projectsBase`, `steps`, `values`, `audiences`, `hero`). Les transcrire en YAML dans `content/`. ✅
5. **Modules statiques** d'abord : `intro`, `grille_points`, `prestations`, `galerie` (cartes, fiches, mosaïque), `zone_intervention`, `bandeau_cta`, `texte`. ✅
6. **Modules clients** ensuite : `hero` (diaporama), comparateur, planche de teintes, `formulaire_projet` (+ server action avec pièce jointe). ✅
7. **Décor** en dernier : croquis, papiers peints, rouleau, animations. Le site est déjà complet et éditable avant cette étape. ✅
8. **Nettoyage** : suppression des 11 anciens composants et des entrées de schéma, mise à jour du README.

---

## 10. Points à trancher plus tard (n'empêchent pas de démarrer)

- Coordonnées réelles (WhatsApp, téléphone, adresse) et portrait définitif : placeholders dans la maquette.
- Faut-il des pages projet individuelles (`/realisations/[slug]`) ? La collection le permet sans changement de schéma ; la maquette ne les prévoit pas.
- Instagram : mosaïque manuelle (proposé) ou flux automatique (nécessite l'API Meta, hors périmètre gratuit).
- Taille maximale de la photo jointe et quota Resend (100 e-mails / jour) : suffisant pour un site vitrine, à surveiller.
