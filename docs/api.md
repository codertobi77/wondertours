# API Wonder Tours — Documentation

Référence complète des endpoints REST pour le développeur front.
Base locale : `http://localhost:3000`. Toutes les réponses sont en JSON.

## Conventions

* **Pagination** : `?page=1&pageSize=20` (max 100). Réponse liste : `{ items, total, page, pageSize }`.
* **Recherche** : `?q=` (insensible à la casse, sur les champs texte principaux).
* **Succès** : `200` (GET/PUT/PATCH/DELETE), `201` (POST).
* **Erreurs** : `{ "error": "message" }` avec `400` (validation), `404` (introuvable), `409` (unicité violée), `500` (serveur), `503` (service externe non configuré, ex. DeepL sans `DEEPL_API_KEY`). La validation renvoie `{ "error": "Données invalides", "details": [...] }` (issues zod).
* **Filtres actifs** : les endpoints publics ne renvoient que les éléments actifs/publiés ; les endpoints dashboard voient tout.
* Les identifiants sont des UUID ; les slugs servent aux URLs publiques.
* Les champs `BigInt` (`MediaFile.size`) sont sérialisés en chaîne.

---

## API publique

### Circuits

#### `GET /api/circuits`
Liste paginée des circuits actifs (relations `destination` et `category` incluses).

Query params (tous optionnels) :
| Param | Type | Description |
|---|---|---|
| `page`, `pageSize` | int | Pagination |
| `q` | string | Recherche titre/description |
| `destination` | string | Slug de destination |
| `category` | string | Slug de catégorie |
| `featured` | `true`/`false` | Circuits à la une |
| `maxPrice` | number | Prix maximum (XOF) |
| `maxDuration` | number | Durée maximum (jours) |

```json
{
  "items": [{ "id": "uuid", "slug": "…", "title": "…", "price": 45000, "destination": {…}, "category": {…} }],
  "total": 6, "page": 1, "pageSize": 20
}
```
Tri : `isFeatured desc`, `createdAt desc`.

#### `GET /api/circuits/[slug]`
Circuit actif par slug (relations incluses). `404` si inconnu ou inactif.

### Destinations / Catégories / Services / Témoignages

* `GET /api/destinations` — destinations actives, tri `name asc`.
* `GET /api/categories` — catégories actives, tri `sortOrder asc, name asc`.
* `GET /api/services` — services actifs, tri `sortOrder asc, createdAt asc`.
* `GET /api/testimonials` — témoignages actifs, featured en tête, puis `date desc`.

Tous acceptent `page`, `pageSize`, `q`.

### Blog

* `GET /api/blog` — articles publiés. Query : `page`, `pageSize`, `q`, `category` (slug catégorie blog), `featured`. Tri : `isFeatured desc`, `publishedAt desc`. Relation `category` incluse.
* `GET /api/blog/[slug]` — article publié par slug, **incrémente `views`** à chaque appel.

### Contact

#### `POST /api/contact`
Soumission du formulaire public.

```json
{
  "name": "Nom visiteur",
  "email": "email@exemple.com",
  "phone": "optionnel",
  "subject": "optionnel",
  "requestType": "circuit|sejour|stay|hotel|info|autre|other",
  "travelDate": "2026-12-15",
  "travelers": 2,
  "message": "Message (10 caractères min)"
}
```
* `sejour` et `autre` (valeurs envoyées par le front actuel) sont mappés en `stay` / `other`.
* `travelDate` accepte `""` (formulaire vide).
* Réponse `201` : `{ "message": "Demande envoyée avec succès", "id": "uuid" }`.

### Réservations

#### `POST /api/bookings`
```json
{
  "circuitId": "uuid optionnel",
  "type": "circuit|stay|hotel",
  "name": "Nom client",
  "email": "email@exemple.com",
  "phone": "optionnel",
  "travelDate": "2026-12-15",
  "returnDate": "2026-12-20",
  "participants": 2,
  "notes": "optionnel"
}
```
* Si `circuitId` est fourni, il doit exister et être **actif** (sinon `400`).
* `totalPrice` = prix du circuit × participants (participants = 1 si absent).
* Réponse `201` :
```json
{
  "message": "Réservation enregistrée avec succès",
  "id": "uuid",
  "bookingReference": "WT-AB12CD",
  "totalPrice": 90000,
  "currency": "XOF",
  "status": "pending"
}
```

---

## Authentification

Sessions JWT stockées dans le cookie httpOnly `wt_session` (7 jours, signées avec `AUTH_SECRET`). Trois rôles : `admin`, `editor`, `viewer`. Le seed crée l'admin (`ADMIN_*`) et un éditeur (`EDITOR_*`) depuis le `.env` ; l'admin crée les autres comptes depuis `/dashboard/users/new`.

#### `POST /api/auth/login`
```json
{ "email": "admin@wondertours.bj", "password": "motdepasse" }
```
* Réponse `200` : `{ "user": { "id", "email", "name", "role" } }` + cookie de session `wt_session` (httpOnly).
* Identifiants invalides ou compte désactivé → `401` avec un message générique (ne révèle pas si l'email existe).

#### `POST /api/auth/logout`
Supprime le cookie de session. Réponse `200` : `{ "success": true }`.

#### `POST /api/auth/forgot-password`
```json
{ "email": "admin@wondertours.bj" }
```
* Réponse `200` **identique que l'email existe ou non** (anti-énumération) : `{ "message": "Si un compte actif existe avec cet email, un lien de réinitialisation vient d'être envoyé." }`.
* Si un compte actif existe : un token à usage unique (validité 1 h, seul son hash SHA-256 est stocké en base) est créé et un email contenant le lien `/dashboard/reset-password?token=…` est envoyé via Resend (silencieusement ignoré si `RESEND_API_KEY` est absente).
* Une nouvelle demande invalide les liens précédents non consommés de l'utilisateur.

#### `POST /api/auth/reset-password`
```json
{ "token": "64 caractères hexadécimaux", "password": "8 caractères min" }
```
* Réponse `200` : `{ "message": "Mot de passe modifié avec succès" }` — mot de passe re-hashé (bcrypt) et email de confirmation envoyé au compte.
* Token inconnu, expiré ou déjà utilisé → `400` `{ "error": "Lien invalide ou expiré…" }` ; la consommation est atomique (`used_at`), le token ne peut servir qu'une fois.

## API dashboard (`/api/dashboard/*`)

> 🔒 **Authentification requise** — sans session → `401`, rôle insuffisant → `403` :
> * **GET** : tous les rôles authentifiés, sauf `users/**` (admin) ;
> * **Écritures** (POST/PATCH/DELETE) : `admin` et `editor`, sauf `users/**` (admin) ;
> * les pages `/dashboard/**` sont gardées par `proxy.ts` : sans session → redirection vers `/dashboard/login` ; `/dashboard/users**` → admin.

### CRUD générique

Les ressources **circuits**, **destinations**, **categories**, **testimonials**, **services**, **blog**, **blog-categories** suivent le même schéma :

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/` | Liste paginée (`page`, `pageSize`, `q`) — inclut inactifs/brouillons |
| `POST` | `/` | Création. Le `slug` est généré depuis le titre (suffixe `-2`, `-3`… en cas de collision) |
| `GET` | `/[id]` | Détail par UUID |
| `PATCH` | `/[id]` | Mise à jour partielle. Si `title`/`name` change, le slug est régénéré |
| `DELETE` | `/[id]` | Suppression |

Codes : `201` à la création, `404` si l'id n'existe pas, `409` si contrainte d'unicité (slug), `400` si clé étrangère invalide.

#### Corps de création — circuit
```json
{
  "title": "Titre (3 min)",
  "titleEn": "optionnel",
  "subtitle": "optionnel",
  "description": "optionnel",
  "destinationId": "uuid optionnel",
  "categoryId": "uuid optionnel",
  "durationDays": 2,
  "durationNights": 1,
  "price": 65000,
  "currency": "XOF (défaut)",
  "imageUrl": "optionnel",
  "gallery": ["url…"],
  "highlights": ["point fort…"],
  "itinerary": [{ "day": 1, "title": "Arrivée", "description": "…" }],
  "included": ["…"], "excluded": ["…"],
  "difficulty": "easy|moderate|challenging",
  "minParticipants": 1, "maxParticipants": 12,
  "isFeatured": false, "isActive": true
}
```
`price` est obligatoire. Champs non envoyés = défauts ; en `PATCH`, seuls les champs fournis sont modifiés.

#### Corps de création — destination
```json
{ "name": "Nom (2 min)", "country": "Bénin", "region": "optionnel", "description": "optionnel", "imageUrl": "optionnel", "isActive": true }
```

#### Corps de création — catégorie (circuits)
```json
{ "name": "Nom", "icon": "compass", "color": "#A855F7", "sortOrder": 0, "isActive": true }
```
`color` : hexadécimal 6 chiffres.

#### Corps de création — témoignage
```json
{ "name": "Nom", "country": "optionnel", "rating": 5, "text": "Témoignage (10 min)", "circuitId": "optionnel", "avatarUrl": "optionnel", "date": "2026-08-31", "isVerified": false, "isFeatured": false, "isActive": true }
```
`rating` : 1–5. `date` : `YYYY-MM-DD` ou `""`.

#### Corps de création — service (à la carte)
```json
{ "title": "Titre", "description": "optionnel", "icon": "optionnel", "href": "optionnel", "sortOrder": 0, "isActive": true }
```

#### Corps de création — article blog
```json
{
  "title": "Titre", "excerpt": "optionnel", "content": "optionnel",
  "categoryId": "uuid catégorie blog optionnel", "imageUrl": "optionnel",
  "tags": ["bénin"], "readTime": 5,
  "isFeatured": false, "isPublished": false
}
```
* À la création avec `isPublished: true` → `publishedAt` est daté automatiquement.
* En `PATCH` : `publishedAt` est daté **uniquement à la première publication** (pas écrasé ensuite).

#### Corps de création — catégorie blog
```json
{ "name": "Nom", "description": "optionnel", "color": "#A855F7", "sortOrder": 0, "isActive": true }
```

### Réservations (bookings)

* `GET /api/dashboard/bookings` — liste paginée. Filtres : `status` (`pending|confirmed|cancelled|completed`), `q` (nom, email, référence).
* `PATCH /api/dashboard/bookings/[id]/status` — `{ "status": "confirmed" }`. **Pas de création ni suppression** (historique préservé).

### Demandes de contact

* `GET /api/dashboard/contact-requests` — liste paginée. Filtres : `status` (`new|in_progress|answered|closed`), `requestType` (`circuit|stay|hotel|info|other`), `q`.
* `PATCH /api/dashboard/contact-requests/[id]/status` — `{ "status": "answered" }`.

### Paramètres (settings)

* `GET /api/dashboard/settings` — `{ "items": [{ "key", "value", "description", … }] }`.
* `PUT /api/dashboard/settings` — upsert groupé :
```json
{ "settings": [{ "key": "site_name", "value": "Wonder Tours", "description": "optionnel" }] }
```
(1 à 100 entrées.)

Clés de contenu : `founder_bio_fr` / `founder_bio_en` — biographie du fondateur affichée sur `/a-propos` (sauts de ligne conservés ; vide → texte statique de repli).

### Médiathèque

* `GET /api/dashboard/media` — liste paginée (`q` sur nom de fichier / alt). `size` en chaîne.
* `POST /api/dashboard/media` — `multipart/form-data` : `file` (image, 5 Mo max), `altText`, `altTextEn` optionnels. Réponse `201` avec `url` et `storagePath` :
  * **imgBB activé** (`IMGBB_API_KEY` définie, recommandé en production) : le fichier est hébergé sur imgBB — `url` est l'URL distante (`https://i.ibb.co/…`), `storagePath` conserve le `delete_url` imgBB. Erreur imgBB (clé invalide, réseau…) → `500` avec le message.
  * **sinon** : stockage local — `url` = `/uploads/<timestamp>-<nom>`, fichier écrit sous `public/uploads/` (non persistant sur Vercel).
* `DELETE /api/dashboard/media/[id]` — supprime la ligne ; le fichier physique n'est supprimé qu'en mode local (imgBB n'a pas d'API de suppression : l'image distante reste, le `delete_url` conservé en base permet une suppression manuelle).

### Traduction (DeepL)

#### `POST /api/dashboard/translate`
Traduit en lot des textes du dashboard (bouton « Traduire en anglais » des formulaires circuit, article blog et témoignage). **Admin + éditeur** ; `503` si `DEEPL_API_KEY` n'est pas configurée.

```json
{
  "texts": { "title": "Circuit Ganvié", "description": "Découvrez la cité lacustre" },
  "sourceLocale": "fr",
  "targetLocale": "en"
}
```
* `texts` : 1 à 20 entrées `clé → texte` — clés libres (noms de champs), valeurs de 1 à 100 000 caractères ;
* `sourceLocale` optionnel (`fr`/`en`, auto-détection sinon), `targetLocale` requis (`fr`/`en` — l'anglais cible est envoyé à DeepL comme `en-US`).

Réponse `200` :
```json
{ "texts": { "title": "Ganvié Tour", "description": "Discover the lake village" }, "targetLocale": "en" }
```

### Utilisateurs — admin uniquement

Toutes les routes `users/**` exigent le rôle `admin`.

* `GET /api/dashboard/users` — liste paginée (`q`, `role` = `admin|editor|viewer`, `active` = `true|false`). **Jamais de `passwordHash`** dans les réponses.
* `POST /api/dashboard/users` :
```json
{ "email": "…", "password": "8 caractères min", "firstName": "…", "lastName": "…", "role": "admin|editor|viewer (défaut editor)", "isActive": true }
```
Le mot de passe est hashé en bcrypt ($2b$).
* `GET/PATCH/DELETE /api/dashboard/users/[id]` — `PATCH` accepte `email`, `password` (re-hashé), `firstName`, `lastName`, `role`, `isActive`. Email unique (`409` sinon).

### Statistiques

#### `GET /api/dashboard/stats`
```json
{
  "circuits": { "total": 6, "active": 6, "featured": 0 },
  "destinations": { "total": 6, "active": 6 },
  "categories": { "total": 7, "active": 7 },
  "testimonials": { "total": 4, "active": 4, "averageRating": 4.8 },
  "blog": { "total": 6, "published": 6 },
  "bookings": { "total": 0, "pending": 0, "confirmed": 0, "thisMonth": 0, "revenueThisMonth": 0 },
  "contactRequests": { "total": 0, "new": 0, "inProgress": 0 },
  "mediaFiles": { "total": 0 },
  "users": { "total": 0 },
  "recentBookings": […5 dernières…],
  "recentContactRequests": […5 dernières…]
}
```
`revenueThisMonth` : somme des `totalPrice` des réservations créées ce mois (devise XOF).

---

## Validation & tests

* `bun test` — tests d'intégration (CRUD par domaine, slug, upload, bcrypt, stats, sessions JWT).
* `./scripts/smoke-api.sh [BASE_URL]` — vérifications curl : endpoints publics, authentification (login admin/éditeur, 401/403, logout, redirection proxy), endpoints dashboard, création contact/booking + création/modification/suppression d'un compte test (nettoyage automatique). Nécessite `bun run dev` + base seedée (`bun run db:seed`).
