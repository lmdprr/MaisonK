# Suivi des leads dans Google Drive

Idée en attente, à discuter avec Carole avant de l'engager. Ce document fixe la
démarche retenue pour qu'elle soit prête le jour où la décision est prise.

Aujourd'hui, une demande envoyée depuis « Votre projet » part par e-mail via
Resend (`app/actions/submitProjet.ts`) et n'est stockée nulle part. L'objectif
est de garder en parallèle une trace de chaque lead dans un tableur, pour
retrouver l'ordre des demandes et rattraper celles qui attendent.

---

## 1. Choix retenu : un Google Sheet alimenté par un Apps Script

- **Un tableur plutôt qu'un dossier de fichiers** : une ligne par lead, triable
  et filtrable, avec un lien vers la photo rangée dans un dossier Drive à côté.
- **Apps Script plutôt que l'API Google Sheets** : pas de projet Google Cloud,
  pas de compte de service, pas de clé privée à stocker dans le Worker. Le
  Worker fait un simple `fetch` vers l'URL du script.
- **Le compte de Carole, pas celui du développeur** : ce sont les données de
  ses clients. `maisonk.re@gmail.com` est déjà un compte Google.
- **L'e-mail reste la source de vérité** : si Google ne répond pas, Carole
  reçoit quand même le lead et le visiteur voit la confirmation normalement.

Alternative écartée : API Sheets avec compte de service et signature JWT dans
le Worker. Plus robuste, mais trop de plomberie pour un site vitrine.

---

## 2. Démarche

### Étape 1 — Côté Google (compte de Carole)

1. Créer un Sheet « Leads Maison K » avec les colonnes : date, nom, téléphone,
   e-mail, pièce, ambiances, planche, page d'origine, lien photo.
2. Créer un dossier Drive « Leads — photos » et relever son identifiant dans l'URL.
3. Dans le Sheet : Extensions → Apps Script. Coller un script `doPost` qui :
   - refuse la requête si le secret partagé du corps JSON ne correspond pas ;
   - ajoute une ligne au Sheet ;
   - si une photo est présente (base64), la reconstitue dans le dossier Drive
     et place son lien dans la ligne.
4. Déployer → Nouveau déploiement → Application Web, exécutée « en tant que
   moi », accès « Tout le monde ». Copier l'URL en `/exec`.
5. Ajouter le développeur comme éditeur du Sheet.

### Étape 2 — Configuration

Deux variables à ajouter dans `.env.example`, `.env.local` et les secrets du
Worker Cloudflare :

| Variable | Rôle |
|---|---|
| `LEADS_WEBHOOK_URL` | URL `/exec` du script |
| `LEADS_WEBHOOK_SECRET` | secret partagé, vérifié par le script |

Sans ces variables, l'enregistrement est désactivé, sur le même modèle que
Resend sans `RESEND_API_KEY`.

### Étape 3 — Code

- Nouveau module `lib/leadsSheet.ts` : une fonction qui envoie le lead en JSON
  à l'URL du script, avec un délai maximal de quelques secondes
  (`AbortSignal.timeout`), et qui ne lève jamais : en cas d'échec, une ligne de
  log et c'est tout.
- Dans `app/actions/submitProjet.ts` : appeler cette fonction après l'envoi
  Resend réussi. La photo redimensionnée est déjà en base64 dans le payload,
  elle part telle quelle.
- Le script Apps Script répond par une redirection 302 vers
  `script.googleusercontent.com` ; le `fetch` du Worker la suit par défaut.

### Étape 4 — Données personnelles et documentation

- Le README affirme que rien n'est stocké côté serveur : à corriger.
- Règle de conservation à fixer avec Carole. Proposition : un déclencheur
  mensuel dans le même Apps Script qui supprime lignes et photos de plus de
  douze mois.
- Les mentions légales ne disent rien du formulaire. Ajouter dans Keystatic,
  dans la voix de Carole, une phrase sur l'usage des coordonnées et la durée de
  conservation.

### Étape 5 — Test

1. En local, URL et secret dans `.env.local`, envoi depuis « Votre projet ».
2. Vérifier la ligne dans le Sheet et la photo dans le dossier.
3. Secrets Cloudflare, déploiement, second test en production.

---

## 3. Limites à connaître

- Apps Script ajoute une à deux secondes à l'envoi. Acceptable ; contournable
  plus tard avec `waitUntil` du Worker pour répondre avant l'écriture.
- Un changement dans le script impose un redéploiement depuis le compte de
  Carole. Rare une fois le script stable.
- Drive gratuit : 15 Go. À 300 Ko par photo, ce n'est pas une contrainte.
- Quotas Apps Script du plan gratuit largement au-dessus du trafic d'un site
  vitrine.
