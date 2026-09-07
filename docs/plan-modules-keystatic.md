# Modèle de contenu : les modules Keystatic

Ce document explique le découpage du site en modules éditables et les
arguments derrière chaque choix de schéma. Le schéma lui-même est dans
`keystatic.config.ts`, les types côté rendu dans `lib/types.ts`.

Principes retenus :

- une page est une liste ordonnée de modules ; il n'y a pas de gabarit de page ;
- Réalisations et Prestations sont des **collections**, référencées par les modules ;
- tout l'interactif (avant / après, planche de teintes, formulaire avec photo) est conservé ;
- les décorations (croquis, papiers peints, rouleau de peinture, motif) restent **dans le code**,
  l'éditeur ne choisit jamais une couleur ni un ornement.

---

## 1. Inventaire des écrans

| Page | Sections |
|---|---|
| Accueil | Hero split + diaporama · Bandeau villes · Pour qui (3 cartes) · Carole (portrait + texte) · Prestations aperçu (4 lignes, fond sombre) · Réalisations teaser (4 cartes) · Bandeau CTA · Instagram (6 images) |
| Prestations | En-tête (titre + intro) · 4 prestations en articles alternés (image ou planche de teintes, liste de livrables, durée) · Ma méthode (4 étapes, fond sombre) · Bandeau CTA |
| Réalisations | En-tête · Comparateur avant / après (onglets projets + curseur) · Grille 6 projets (croquis, type, texte) · Bandeau CTA |
| À propos | En-tête avec portrait · Ma démarche (3 valeurs, fond sable) · Toute l'île (texte + nuage de villes) · Bandeau CTA |
| Contact | En-tête + 3 cartes de contact (WhatsApp, tél, e-mail) · image + infos (atelier, horaires, réseaux) |
| Votre projet | Intro sticky + planche de teintes · formulaire en 4 étapes (pièce, ambiance, photo, coordonnées) · état de confirmation |
| Global | Header (logo, 5 liens, CTA rouleau) · Footer (logo, navigation, contact, copyright, mentions) |

Soit 25 sections visibles. Elles se ramènent à **9 modules**, parce que la charte
répète cinq motifs : un bloc « eyebrow + titre + texte + visuel », une grille
d'items numérotés, une liste issue d'une collection, un bandeau, et un fond de
section qui change (crème, sable, sombre, rose).

---

## 2. Trois leviers de réutilisation

### 2.1 Un sélecteur `fond` partagé plutôt que des variantes « sombre »

Il n'y a pas de « module sombre » : c'est le même bloc avec un autre fond.
Un champ commun `fond : crème | sable | sombre | rose` est ajouté aux modules de
section. Les couleurs de texte, d'eyebrow et de bordure découlent du fond (rôles
CSS dans `globals.css`) : l'éditeur choisit un fond, jamais une couleur, et un
module reste identique quel que soit le fond.

### 2.2 Un sous-schéma `en_tete` partagé

Sept sections commencent par : eyebrow (avec icône croquis optionnelle) · titre ·
texte d'intro ou lien fléché. Il est déclaré une fois (`enTeteSection()` dans
`keystatic.config.ts`) et rendu par un seul composant (`ui/SectionHead`), qui
choisit sa disposition selon les champs remplis. Même chose pour `lien` (label +
url) et `cta` (label + url, rendu bouton rouleau).

### 2.3 Des collections pour ce qui apparaît plusieurs fois

Les projets sont affichés à quatre endroits (hero, teaser, comparateur, grille)
et les prestations à deux. Ce sont des entrées de collection ; les modules les
**référencent** (`fields.relationship`) au lieu de les recopier.

---

## 3. Les 9 modules de page

Le rendu d'un titre en `h1` ou `h2` est automatique : le premier module d'une
page rend un `h1` (`ModuleRenderer` passe `index`). Aucun champ « niveau de
titre » dans l'admin.

### 3.1 `hero` : premier écran de l'accueil (1 usage)

Module à part, volontairement : c'est le seul bloc avec un diaporama, une ligne
de titre qui change avec la slide, un bouton rouleau et un croquis animé. Le
garder hors de `intro` évite un conditionnel que l'intégrateur devrait démêler.

| Champ | Type | Note |
|---|---|---|
| `eyebrow` | text | « Conception & décoration d'intérieur · La Réunion » |
| `titre` | text | « Construire vos espaces de vie, » ; la ligne italique vient de la slide active |
| `texte` | text multiligne | paragraphe sous le titre |
| `cta` | objet partagé | bouton rouleau « Découvrir mes prestations » |
| `citation` | text | citation à côté du croquis |
| `lien` | objet partagé | lien fléché « Voir mes réalisations » |
| `slides[]` | `{ image, alt, libelle, ligne_titre, legende }` | `libelle` alimente le compteur « 01 / 04 · Home staging · Le Tampon » |
| `defilement_auto` | checkbox | autoplay, activé par défaut |

Composant client pour l'état de la slide et le minuteur. Le croquis animé et le
rouleau sont dans le code.

### 3.2 `intro` : bloc titre + texte + visuel (5 usages)

Couvre : en-tête Prestations · en-tête Réalisations · en-tête À propos · bloc
Carole (Accueil) · page Contact.

| Champ | Type | Note |
|---|---|---|
| `eyebrow`, `icone` | text, select (aucune, fauteuil, cadre, plan, plante) | seule décoration exposée : l'icône fait partie de l'identité de chaque page |
| `titre`, `titre_accent` | text | `titre_accent` = la partie italique (« Carole Mondon ») |
| `contenu` | document (gras, italique, paragraphes) | intro Prestations, paragraphes À propos, texte Carole |
| `signature` | text | « Carole » sur À propos, vide ailleurs |
| `lien` | objet partagé | lien fléché (« Mon parcours », « Composez votre planche ») |
| `fond` | select partagé | Carole = sable, les autres = crème |
| `visuel` | `fields.conditional` | voir ci-dessous |
| `afficher_contact` | checkbox | rend les 3 cartes WhatsApp / tél / e-mail + la liste atelier / horaires / réseaux, depuis le singleton Coordonnées |

`visuel` (conditionnel, l'admin n'affiche que les champs de la valeur choisie) :

- `aucun` : si `contenu` est rempli, titre en colonne gauche et contenu en
  colonne droite, calé sur le bas du titre (en-tête Prestations) ; sinon titre
  seul sur toute la ligne ;
- `motif` : titre à gauche, papier peint pop dessiné par le code dans la
  colonne droite (en-tête Réalisations). Le contenu éventuel passe sous le
  titre ;
- `image` : image + position (gauche / droite). Contact utilise `droite` ;
- `portrait` : image + position ; le motif floral et le fond bordeaux sont
  ajoutés par le code. Carole = gauche, À propos = droite.

Pourquoi un seul module pour ces cinq blocs : ils partagent tous leurs champs
texte et la même grille à deux colonnes. Les différences (portrait, image,
cartes de contact) sont des branches du composant React, pas des schémas
distincts. Composant serveur, aucun état.

### 3.3 `grille_points` : items numérotés ou illustrés (3 usages)

Couvre : Pour qui (3 cartes cellules) · Ma méthode (4 étapes, sombre) · Ma
démarche (3 valeurs, sable).

| Champ | Type |
|---|---|
| `en_tete` | sous-schéma partagé (eyebrow, titre, intro, lien) |
| `fond` | select partagé |
| `style` | select : `cellules` (grille bordée, papier peint au survol) · `liste` (bordure haute, grand numéro ou icône) |
| `items[]` | `{ titre, texte, icone? }` ; le numéro est calculé (01, 02…) ; si `icone` est renseignée elle remplace le numéro |
| `note_finale` | text, sous la grille |

Les papiers peints par carte (feuilles, arches, treillis) et leurs couleurs sont
assignés par index dans le code.

### 3.4 `prestations` : liste depuis la collection Prestations (2 usages)

Couvre : aperçu Accueil (4 lignes, fond sombre) · page Prestations (articles alternés).

| Champ | Type |
|---|---|
| `en_tete` | partagé (utilisé seulement en `apercu`) |
| `affichage` | select : `apercu` (numéro, titre, accroche, flèche) · `detail` (image ou encart, icône, description, livrables, durée) |
| `prestations[]` | `array(relationship)` ; vide = toutes, dans l'ordre de la collection |
| `fond` | select partagé |

Le module ne contient aucun texte de prestation : tout vient de la collection (section 4.2).

### 3.5 `galerie` : projets et images (4 usages)

Couvre : teaser Accueil (4 cartes 4/5) · grille Réalisations (6 fiches) ·
comparateur avant / après · mosaïque Instagram.

| Champ | Type |
|---|---|
| `en_tete` | partagé (Instagram : titre « Suivez les coulisses » + lien « @maisonk.re ↗ ») |
| `fond` | select partagé |
| `source` | conditionnel : `projets` → `{ projets[] (relationship, vide = tous), limite }` · `images` → `{ images[] { image, alt, url? } }` |
| `affichage` | select : `cartes` (image 4/5, titre, lieu) · `fiches` (image 4/3, croquis, titre, lieu, type, texte) · `comparateur` (onglets + curseur + note) · `mosaique` (carrés, sans texte) |
| `texte_aide` | text, « glissez » sur le comparateur |

Pourquoi le comparateur est ici et pas dans un module à part : même source
(collection Projets), même sélection ; seul le rendu change. Le composant client
du curseur n'est chargé que si `affichage = comparateur`, et il ne reçoit que les
projets ayant une `image_avant` réelle : pas d'« avant simulé » par désaturation.

### 3.6 `zone_intervention` : villes (2 usages)

Couvre : bandeau défilant (Accueil) · nuage de pastilles « Toute l'île » (À propos).

| Champ | Type |
|---|---|
| `en_tete` | partagé (vide pour le bandeau) |
| `affichage` | select : `defilant` · `chips` |
| `fond` | select partagé |

La liste des villes vit dans le singleton Coordonnées (une seule source), le
module ne fait que l'afficher. Le séparateur quadrilobe est dans le code.

### 3.7 `bandeau_cta` : appel à l'action (4 usages)

Couvre : « Envie de révéler le potentiel de votre intérieur ? » sur Accueil,
Prestations, Réalisations, À propos.

| Champ | Type |
|---|---|
| `titre`, `titre_accent` | text |
| `texte` | text |
| `cta` | partagé ; l'URL peut valoir `whatsapp` pour construire le lien depuis Coordonnées |
| `fond` | select partagé (rose par défaut) |

### 3.8 `formulaire_projet` : Votre projet (1 usage)

Couvre la page entière : intro sticky, planche de teintes, formulaire 4 étapes,
confirmation. L'adresse destinataire (`email_to`) est chiffrée au pré-rendu et
jamais exposée au client (voir README, « Formulaires »).

| Champ | Type |
|---|---|
| `eyebrow`, `icone`, `titre`, `intro` | comme `intro` |
| `pieces[]` | text ; chips de l'étape 01 (Salon, Chambre… ; « Autre… » géré par le code) |
| `ambiances[]`, `max_ambiances` | text, integer (3) |
| `photo_activee` | checkbox |
| `label_envoi`, `note_envoi` | text ; « Recevoir mon créneau d'échange », « Aucun engagement, aucune newsletter » |
| `confirmation` | objet : `titre` (avec `{prenom}`), `texte`, `etapes[]`, `lien` |
| `email_to` | text (requis) |

Hors schéma, dans le code :

- **Planche de teintes** : palette curatée de 18 teintes nommées (4 familles) + 8 matières (textures CSS) + couleur libre repliée.
  Bibliothèque fixe. L'état est persisté en `localStorage` pour survivre à la
  navigation entre la page Prestations (encart) et le formulaire. La planche est
  envoyée dans l'e-mail sous forme de liste « nom · hex ».
- **Photo** : redimensionnée côté client (max 1 600 px, < 1,5 Mo) puis envoyée en
  pièce jointe Resend (base64). Aucun stockage serveur, rien à purger côté RGPD.
- **Confirmation** : composant client qui remplace le formulaire après envoi (pas
  de page dédiée).

### 3.9 `texte` : texte riche (pages libres)

Mentions légales, politique de confidentialité, futurs articles. Un `document`
et une `largeur` (étroit / moyen / pleine). C'est la soupape de tout CMS.

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
| `accroche` | text ; ligne courte de l'aperçu |
| `description` | text multiligne |
| `livrables[]` | text |
| `duree` | text ; « Phase technique · sur devis » |
| `icone` | select (fauteuil, cadre, plan, plante) |
| `image` | image |
| `encart` | select : `aucun` · `planche_teintes` (remplace l'image par la planche interactive) · `croquis_3d` (ajoute le croquis plan + citation sous le texte) |
| `ordre` | integer |

`encart` est le seul endroit où un choix de l'éditeur déclenche une décoration :
c'est du contenu (quelle prestation porte la planche), pas du style.

---

## 5. Singletons

| Singleton | Contenu |
|---|---|
| `header` | logo, liens de navigation, CTA (label). L'URL du CTA peut valoir `whatsapp`. |
| `footer` | slogan, copyright, liens légaux. La colonne Navigation reprend `header`, la colonne Contact reprend `coordonnees` : rien n'est saisi deux fois. |
| `coordonnees` | numéro WhatsApp, téléphone, e-mail, Instagram (handle + url), atelier, horaires, `villes[]`. Lu par : header, footer, `intro` (cartes contact), `bandeau_cta`, `zone_intervention`. |

---

## 6. Ce qui reste dans le code (et pourquoi)

| Élément | Où | Raison |
|---|---|---|
| Tokens : crème #EDEAE4, sable #D7D0B4, sombre #151515, rose #E6D9D3, bordeaux #551020, terracotta #C07454, rose clair #C08A96, sauge #8BC1A9 ; Playfair Display + Manjari ; rayon 2 px | `globals.css` (`@theme`) | un seul endroit, jamais dans le YAML |
| Bouton rouleau de peinture, lien fléché, eyebrow, pilule | `components/ui` | primitives réutilisées par tous les modules |
| Croquis SVG (icônes, pièces, plan 3D), papiers peints, bandes de mur, filtre crayon, motif.png | `components/decor` | décoration pure, assignée par module / variante / index |
| Animations reveal, marquee, fade | CSS + `DecorRuntime` | respectent `prefers-reduced-motion` |
| Palette et textures des 8 matières de la planche | `lib/planche.ts` | ce sont des dégradés CSS, pas des images |

Assignation du décor par module :

| Module | Décor |
|---|---|
| `hero` | salon animé (`HeroSketch`) |
| `intro` portrait en h2 | frise basse (`Wall edge`) |
| `intro` portrait en h1 | médaillon d'angle (`Wall corner`) |
| `intro` contact | semis (`Wall seed`) |
| `intro` visuel motif | papier peint pop à tuiles retournables (`PopWallpaper`) |
| `grille_points` cellules | papier peint par index (`Wallpaper`) |
| `prestations` aperçu | fleur qui éclot (`BloomFlower`) |
| `prestations` détail, encart `croquis_3d` | plan qui bascule (`PlanSketch`) |
| `galerie` fiches | croquis par `type_piece` (`RoomSketch`) |
| `galerie` comparateur | semis de marge sur grand écran (`Wall marge`) |
| `bandeau_cta` | bande droite (`Wall band`) |
| `formulaire_projet` | semis (`Wall seed`) |
| eyebrows et prestations | icône par `icone` (`SketchIcon`) |

Trois attributs `data-*` pilotent le runtime client (`DecorRuntime`) :
`data-reveal` (apparition au défilement), `data-sketch` (croquis en pause
jusqu'à l'entrée dans l'écran), `data-paint` (rouleau de peinture sur les
boutons).

---

## 7. Composition des pages

| Page | Modules dans l'ordre |
|---|---|
| Accueil | `hero` · `zone_intervention` (défilant, sable) · `grille_points` (cellules) · `intro` (portrait gauche, sable) · `prestations` (aperçu, sombre) · `galerie` (projets, cartes) · `bandeau_cta` · `galerie` (images, mosaïque, sable) |
| Prestations | `intro` (aucun, intro à droite) · `prestations` (détail) · `grille_points` (liste, sombre) · `bandeau_cta` |
| Réalisations | `intro` (aucun) · `galerie` (projets, comparateur) · `galerie` (projets, fiches) · `bandeau_cta` |
| À propos | `intro` (portrait droite) · `grille_points` (liste, sable) · `zone_intervention` (chips) · `bandeau_cta` |
| Contact | `intro` (image droite, `afficher_contact`) |
| Votre projet | `formulaire_projet` |
| Mentions légales | `texte` |

Trois modules n'ont qu'un usage : `hero` (premier écran, volontairement isolé),
`formulaire_projet` et `texte` (pages à part entière).

---

## 8. Conventions de contenu

- **Images d'une entrée de collection** : Keystatic les range dans
  `<directory>/<slug>/<fichier>` et écrit `<publicPath>/<slug>/<fichier>` dans le
  YAML (ex. `public/images/hero/accueil/tampon-salon.jpg` →
  `/images/hero/accueil/tampon-salon.jpg`). Un chemin à plat s'affiche sur le
  site mais l'admin ne retrouve pas le fichier, considère le champ vide et
  refuse d'enregistrer (« Image is required »). Les singletons (header,
  coordonnées) n'ont pas de sous-dossier.
- Un texte YAML contenant « : » doit être entre guillemets.
- Le contenu riche (`fields.document`) d'un module vit dans un fichier à part :
  `content/pages/<slug>/modules/<index>/value/contenu.mdoc` (Markdoc).
- Après ajout d'une page, redémarrer `npm run dev` : la liste des slugs est
  figée au premier appel de `generateStaticParams`.

---

## 9. Questions ouvertes

- Faut-il des pages projet individuelles (`/realisations/[slug]`) ? La collection
  le permet sans changement de schéma ; le site n'en a pas besoin pour l'instant.
- Instagram : mosaïque manuelle (retenue) ou flux automatique (nécessite l'API
  Meta, hors périmètre gratuit).
- Quota Resend (100 e-mails / jour) : suffisant pour un site vitrine, à surveiller.
