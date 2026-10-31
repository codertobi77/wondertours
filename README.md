# Wonder Tours and Services

> Site web officiel de l'agence de voyage **Wonder Tours and Services** (Ouidah, Bénin) : vitrine bilingue français / anglais, tableau de bord d'administration et API REST — frontend Next.js 16 exporté en statique + API PHP 8 sans dépendance.

[![CI](https://github.com/codertobi77/wondertours/actions/workflows/ci.yml/badge.svg)](https://github.com/codertobi77/wondertours/actions/workflows/ci.yml)

- **Production** : https://wondertoursandservices.com (Vercel — frontend Next.js) + https://api.wondertoursandservices.com (LWS Perso — API PHP) ; base de données : Aiven (PostgreSQL)
- **Dépôt** : https://github.com/codertobi77/wondertours (branche `master`)
- **Documentation** : [`docs/api.md`](docs/api.md) (API), [`env-setup.md`](docs/env-setup.md) (variables d'environnement), [`deployment.md`](docs/deployment.md) (Vercel — frontend), [`deployment-lws.md`](docs/deployment-lws.md) (LWS — API PHP)

## Présentation

**Wonder Tours and Services** est une agence de voyage basée à Ouidah (Bénin), spécialisée dans la découverte du Bénin, du Togo et du Ghana depuis plus de 20 ans. Ce dépôt contient le site web de l'agence, qui regroupe trois applications dans un même projet Next.js :

- **Le site vitrine public** — présente l'agence, ses services, ses destinations et ses circuits touristiques ; publie des articles de blog et des témoignages de voyageurs ; et permet aux visiteurs de demander un devis via le formulaire de contact ou de réserver directement en ligne.
- **Le tableau de bord d'administration** (`/dashboard`) — back-office complet qui permet à l'équipe de gérer tout le contenu du site (circuits, blog, témoignages…), les réservations et demandes de contact reçues, la médiathèque et les comptes utilisateurs, avec trois niveaux d'accès (admin, éditeur, lecteur).
- **L'API REST** (`php-api/` — PHP 8, zéro dépendance) — déployée sur LWS Perso sous `https://api.wondertoursandservices.com`, consommée par le frontend Next.js sur Vercel via proxy (`/api/*` → `api.wondertoursandservices.com`) : contenus publics en lecture, CRUD complet protégé par session.

## Fonctionnalités

### Site public (bilingue FR / EN)

- **Accueil** : présentation de l'agence, services phares, destinations, témoignages clients ;
- **Circuits touristiques** : catalogue filtrable (recherche, destination, catégorie, prix maximum, durée) et fiches détaillées — itinéraire jour par jour, points forts, inclus / exclus, prix — servies par `/api/circuits` ;
- **Séjours et hôtels** : présentation des prestations ;
- **Témoignages** : avis vérifiés des voyageurs ;
- **Blog** : articles classés par catégories, page de détail par article ;
- **Contact** : formulaire de demande de devis (type de demande, dates, nombre de voyageurs) → accusé de réception au visiteur + notification interne par email ;
- **Réservation en ligne** : formulaire relié au circuit choisi, référence unique `WT-XXXXXX` → confirmation client + notification interne par email ;
- **Bilinguisme** : interface français / anglais (traductions statiques dans `lib/translations.ts` + champs anglais en base, remplis via la traduction assistée DeepL) ;
- **SEO** : métadonnées par page, `sitemap.xml` et `robots.txt` générés dynamiquement (`app/sitemap.ts`, `app/robots.ts`).

### Tableau de bord (`/dashboard`)

- **Authentification** : connexion email / mot de passe (bcrypt), sessions JWT signées avec `AUTH_SECRET` dans un cookie httpOnly (7 jours), trois rôles — **admin** (accès complet, dont la gestion des comptes), **éditeur** (lecture + rédaction du contenu), **lecteur** (lecture seule) ;
- **Mot de passe oublié** : réinitialisation par email — token à usage unique valable 1 h, seul le hash SHA-256 est stocké en base ;
- **CRUD complet sur 13 ressources** : circuits, destinations, catégories, services, témoignages, blog (+ catégories), réservations, demandes de contact, paramètres du site, statistiques, médiathèque, utilisateurs ;
- **Suivi des demandes** : changement de statut des réservations et demandes de contact, avec notification email automatique au client ;
- **Médiathèque** : upload d'images vers imgBB (fallback stockage local `public/uploads/`) ;
- **Traduction assistée** : bouton « Traduire en anglais (DeepL) » qui pré-remplit les champs `*En` des contenus depuis les champs français ;
- **Gestion des comptes** (admin) : création d'utilisateurs admin / éditeur / lecteur avec email de bienvenue — jamais le mot de passe en clair.

### Emails transactionnels (Resend)

Huit templates HTML (`lib/services/mail-templates.ts`) : accusé de réception contact, notification interne contact, confirmation + notification de réservation, changement de statut, lien de réinitialisation + confirmation de changement, bienvenue. Sans `RESEND_API_KEY`, chaque envoi est ignoré silencieusement : aucune requête HTTP ne peut échouer à cause du mailing (dégradation gracieuse, même principe que imgBB et DeepL).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Langage | TypeScript (strict) — API PHP 8 sans framework |
| Base de données | PostgreSQL (Aiven en production, locale en dev) |
| ORM / migrations | Prisma 7 (driver adapter `@prisma/adapter-pg`) ; l'API PHP interroge la base en PDO |
| Validation | Zod 4 (front, tests) — contrat répliqué côté PHP (`php-api/lib/Validator.php`) |
| Authentification | JWT HS256 (cookie `wt_session`) + bcrypt — sessions interchangeables entre stacks |
| UI | Tailwind CSS 4, framer-motion, lucide-react |
| Emails | Resend (cURL côté PHP) |
| Services externes | DeepL (traduction), imgBB (images) |
| Tests | Bun test |
| Runtime / paquets | Bun (build, dev, tests) — PHP ≥ 8.1 en production |
| CI/CD | GitHub Actions : CI (lint/test/build) + déploiement API PHP FTP vers LWS (lftp) ; frontend déployé sur Vercel via import GitHub |
| Hébergement | Frontend : Vercel (`wondertoursandservices.com`) ; API PHP : LWS Perso (`api.wondertoursandservices.com`) ; Base : PostgreSQL Aiven |

## Architecture backend

En production, le frontend Next.js est déployé sur **Vercel** et consomme l'**API PHP** `php-api/` déployée sur **LWS Perso** (`https://api.wondertoursandservices.com`). Les requêtes `/api/*` depuis le frontend sont proxysées par Vercel vers l'API LWS. La stack Node/Prisma reste l'**outillage** : migrations, seed, tests.

```
php-api/index.php            Front controller — routeur /api/* (39 routes)
        │
        ▼
php-api/handlers/*.php       Handlers HTTP — PublicApi, AuthApi, DashboardApi
                             (CRUD générique 7 ressources), Bookings, Contact,
                             Media, Settings, Stats, Translate, Users
        │
        ▼
php-api/lib/*.php            Fondations — Db (PDO pgsql), Auth/Jwt (HS256),
                             Validator (contrat Zod répliqué), External
                             (Resend/DeepL/imgBB via cURL), Serial (camelCase)
        │
        ▼
PostgreSQL (Aiven)
```

### Couches

- **`php-api/index.php` + `lib/Router.php`** — front controller unique : Apache route toute requête `/api/*` non-fichier vers `index.php` (`.htaccess`), le routeur dispatche vers les handlers. En dev : `php -S 127.0.0.1:8099 router-dev.php`.
- **`php-api/handlers/*.php`** — HTTP seulement : valident l'entrée avec `Validator`, appellent la couche modèle et renvoient du JSON via `Http` (`ok`, `created`, `badRequest`, `notFound`, `conflict`…). Le CRUD des 7 ressources de contenu passe par le générique `lib/Crud.php`.
- **`php-api/lib/`** — fondations maison, **aucune dépendance Composer** : `Db` (PDO, requêtes préparées, session UTC, mapping d'erreurs PostgreSQL : 23505 → 409, 23503 → 400, ligne absente → 404), `Auth` + `Jwt` (sessions HS256 dans le cookie `wt_session`, `password_verify` compatible bcryptjs), `Validator` (réplique des schémas Zod : trim/min/max/uuid/enum, defaults au create, PATCH sans ré-application), `External` (Resend, DeepL, imgBB via cURL), `Serial` (camelCase, BigInt en chaîne), `Slug`, `Env` (config : `config.local.php` → getenv → défauts).
- **Rôles** — équivalent de l'ancien `handleProtectedRoute` : 401 sans session, 403 si rôle insuffisant (lecture pour tous les rôles, écritures admin+éditeur, `users/**` admin).
- **`prisma/schema.prisma`** — Schéma de 13 tables : `users`, `destinations`, `categories`, `circuits`, `testimonials`, `blog_categories`, `blog_posts`, `services`, `bookings`, `contact_requests`, `settings`, `media_library`, `password_reset_tokens` (+ 6 enums). Client généré dans `lib/generated/prisma` (gitignoré). **Les migrations restent gérées par Prisma** — `prisma migrate deploy` s'exécute en CI avant chaque déploiement ; le PHP n'en fait aucune.
- **`lib/services/*.ts` + `lib/db.ts`** — couche Node historique (un module par domaine + clients externes `imgbb`, `deepl`, `mailer`), toujours utilisée par les **tests** (`bun test` sur PostgreSQL éphémère) et le **seed** (`bun run db:seed`). Le contrat API reste donc vérifié par cette même couche métier, et le smoke (`scripts/smoke-api.sh`) le re-vérifie de bout en bout contre l'API PHP.

### TLS PostgreSQL (important)

- **Côté PHP (production)** : PDO pgsql gère `sslmode=require` nativement (libpq) — l'URI Aiven est utilisée telle quelle (`php-api/lib/Db.php`, fuseau de session forcé en UTC).
- **Côté Node (tests, seed, migrations)** : Prisma 7 se connecte via le driver `pg`, dont la sémantique `sslmode` diffère de libpq (`sslmode=require` produirait une vérification stricte de la chaîne, qui échoue avec la CA managée Aiven). `lib/pg-adapter.ts` retire donc `sslmode` de l'URI et fixe `ssl: { rejectUnauthorized: false }` (chiffrement sans vérification, conforme libpq).

### Pool de connexions (important)

Le plan Aiven Hobbyist plafonne `max_connections` à 20 : 3 slots réservés aux superusers, ~13 consommés par les workers Aiven (pg_cron, TimescaleDB, management-agent…) — soit **~5 slots réellement disponibles**, partagés par tous les clients de la base (API PHP LWS, tests/seed, psql). Côté Node, `lib/pg-adapter.ts` plafonne le pool à `DATABASE_POOL_MAX` (défaut 2, échec propre après ~10 s si saturé) et retire de l'URI les paramètres `connection_limit` / `pool_timeout`. Côté PHP, la connexion PDO est conservée statiquement par process — un worker garde sa connexion entre requêtes (cf. `docs/deployment-lws.md` §6 si des `too many connections` apparaissent).

### Endpoints API

Publics :

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/circuits` | Liste paginée + filtres (`q`, `destination`, `category`, `featured`, `maxPrice`, `maxDuration`) |
| GET | `/api/circuits/[slug]` | Détail d'un circuit actif (404 sinon) |
| GET | `/api/destinations` | Destinations actives |
| GET | `/api/categories` | Catégories de circuits |
| GET | `/api/services` | Services |
| GET | `/api/testimonials` | Témoignages vérifiés |
| GET | `/api/blog` | Articles publiés, paginés |
| GET | `/api/blog/[slug]` | Détail d'un article |
| GET | `/api/blog-categories` | Catégories du blog actives |
| GET | `/api/settings` | Paramètres publics du site |
| POST | `/api/contact` | Créer une demande de contact (validation) |
| POST | `/api/bookings` | Créer une réservation (référence `WT-XXXXXX`) |

Dashboard (**authentification requise** — cf. ci-dessous) : `/api/dashboard/{circuits,destinations,categories,testimonials,services,blog,blog-categories,bookings,contact-requests,settings,stats,media,users}` avec CRUD complet (GET/POST, `…/[id]` GET/PATCH/DELETE), `…/bookings/[id]/status`, `…/contact-requests/[id]/status` et `POST …/translate` (traduction DeepL, admin+éditeur).

Authentification : `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me` (session courante — garde client du frontend statique).

### Authentification dashboard

Sessions JWT HS256 signées avec `AUTH_SECRET`, stockées dans le cookie httpOnly `wt_session` (7 jours) — mêmes jetons côté PHP et côté Node (outillage).

- chaque route `/api/dashboard/**` de l'API PHP vérifie session et rôle (`Auth::requireSession`) : 401 sans session, 403 si rôle insuffisant — lecture pour tous les rôles, écritures admin+éditeur, gestion des comptes (`users/**`) réservée à l'admin ;
- **frontend statique** : les pages `/dashboard/**` sont gardées côté client — `/api/auth/me` répond 401 sans session → redirection vers `/dashboard/login` ; l'UI reflète le rôle (entrée « Utilisateurs » de la sidebar réservée à l'admin) ;
- **l'autorisation réelle vit dans l'API PHP** : chaque route `/api/dashboard/**` vérifie session et rôle (401/403) — le garde client n'est qu'ergonomique, jamais une barrière de sécurité ;
- le seed crée **deux comptes** depuis `.env` : l'admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) et un éditeur (`EDITOR_EMAIL` / `EDITOR_PASSWORD`) — idempotent, le mot de passe n'est posé qu'à la création. L'admin crée ensuite d'autres comptes (admin, éditeur ou lecteur) depuis `/dashboard/users/new`.

Le seed (`prisma/seed.ts`) alimente la base depuis les données statiques du site (`lib/data/`, `lib/constants`) par upserts — **rejouable** sans duplication.

## Variables d'environnement

| Variable | Où | Description |
|----------|-----|-------------|
| `DATABASE_URL` | `.env` (local), secret GitHub (déploiement LWS), Vercel | URI PostgreSQL. Local : `postgres://…` (sans ssl). Aiven : `postgres://…?sslmode=require` (neutralisée côté Node, native côté PHP, cf. TLS). |
| `DATABASE_POOL_MAX` | optionnelle | Plafond de connexions serveur par process (défaut 2). À laisser faible : Aiven Hobbyist n'offre que ~5 slots applicatifs, partagés entre tous les clients de la base. |
| `AUTH_SECRET` | `.env`, Vercel (Production) | Secret de signature des sessions JWT du dashboard (`openssl rand -base64 32`). **Requis** pour l'authentification. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `.env` | Compte administrateur initial créé par le seed (le mot de passe n'est posé qu'à la création). |
| `EDITOR_EMAIL` / `EDITOR_PASSWORD` | `.env` | Compte éditeur initial créé par le seed (idempotent, mêmes règles que l'admin). |
| `NEXT_PUBLIC_SITE_URL` | optionnelle | URL publique pour les métadonnées ; à défaut `SITE_CONFIG.url` (`https://wondertoursandservices.com`) |
| `IMGBB_API_KEY` | `.env`, Vercel (Production) | Optionnelle — stockage distant imgBB pour la médiathèque. **Recommandée en prod** (FS Vercel en lecture seule) ; sans elle, fallback local `public/uploads/` (non persistant). |
| `DEEPL_API_KEY` | `.env`, Vercel (Production) | Optionnelle — active `POST /api/dashboard/translate` (bouton « Traduire en anglais » des formulaires du dashboard) ; sans elle, la route répond `503`. |
| `RESEND_API_KEY` | `.env`, Vercel (Production) | Optionnelle — active les emails transactionnels via Resend (accusé de réception contact, confirmation/notification réservation, mot de passe oublié, bienvenue). Sans elle : envoi ignoré avec log, aucune requête n'échoue. |
| `MAIL_FROM` / `MAIL_TEAM_EMAIL` | `.env` | Optionnelles — expéditeur (défaut `Wonder Tours <onboarding@resend.dev>`, domaine de test Resend) et destinataires des notifications internes (défaut `contact@wondertoursandservices.com`). |
| `APP_URL` | `.env`, secret GitHub (LWS) | URL publique du site — **API fetchée par les pages publiques au build de l'export statique** et base des liens des emails. Défaut `NEXT_PUBLIC_SITE_URL` puis `https://wondertoursandservices.com` ; en local : `http://localhost:8099` (API PHP). |
| `DEV_API_URL` | optionnelle (dev) | Cible du proxy `/api/*` de `next dev` vers l'API PHP (défaut `http://127.0.0.1:8099`). |

### Modèle `.env` local

Le site démarre avec les seules variables requises ; chaque service optionnel se dégrade silencieusement sans sa clé (cf. tableau ci-dessus).

```bash
# ── Requis ──
DATABASE_URL="postgres://user:pass@localhost:5432/wondertours"
AUTH_SECRET="<sortie de : openssl rand -base64 32>"

# ── Comptes initiaux du dashboard (créés par `bun run db:seed` ; ignorés avec un warning si absents) ──
ADMIN_EMAIL="admin@wondertoursandservices.com"
ADMIN_PASSWORD="<choisir un mot de passe>"
EDITOR_EMAIL="editeur@wondertoursandservices.com"
EDITOR_PASSWORD="<choisir un mot de passe>"

# ── Emails transactionnels Resend — optionnel (sans clé : envois ignorés, aucune requête n'échoue) ──
# RESEND_API_KEY="re_xxxxxxxxxxxx"
# MAIL_FROM="Wonder Tours <onboarding@resend.dev>"    # domaine de test : ne délivre que vers l'email du compte Resend
# MAIL_TEAM_EMAIL="contact@wondertoursandservices.com"             # destinataires des notifications internes
# APP_URL="http://localhost:8099"                      # API PHP locale : fetch des pages en dev + liens emails

# ── Autres services — optionnels ──
# IMGBB_API_KEY="xxx"                                  # médiathèque distante (sinon fallback public/uploads/)
# DEEPL_API_KEY="xxx"                                  # bouton « Traduire en anglais » du dashboard (sinon 503)
# NEXT_PUBLIC_SITE_URL="https://wondertoursandservices.com"        # métadonnées (metadataBase, canonicals)
```

En production **LWS**, les variables sont injectées par le workflow de déploiement depuis les secrets GitHub (`FTP_HOST`/`FTP_USER`/`FTP_PASSWORD`, `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `ADMIN_*`, services optionnels — liste exacte : [`docs/deployment-lws.md`](docs/deployment-lws.md) §1.2). Côté Vercel (repli), requises : `DATABASE_URL`, `AUTH_SECRET` (+ `ADMIN_*` / `EDITOR_*` au premier seed) ; recommandées : `IMGBB_API_KEY`, `RESEND_API_KEY` + `MAIL_FROM` (domaine vérifié Resend), `APP_URL` / `NEXT_PUBLIC_SITE_URL` sur le domaine final.

Les fichiers `.env*` et `.vercel/` sont gitignorés. Le client Prisma généré (`lib/generated/prisma`) est gitignoré et régénéré au `postinstall` (`prisma generate`) — donc pendant le build Vercel.

## Démarrage local

```bash
bun install                # installe + génère le client Prisma (postinstall)

# Base de données locale (PostgreSQL)
#   créez .env à partir du modèle de la section « Variables d'environnement »
#   et APP_URL="http://localhost:8099" (API PHP locale)
bun run db:migrate         # prisma migrate dev (crée/applique la migration)
bun run db:seed            # upserts depuis les données statiques + comptes admin & éditeur

# API PHP (terminal 1) — elle sert /api/* en dev comme en production
cd php-api
cp config.example.php config.local.php   # renseigner database_url + auth_secret
php -S 127.0.0.1:8099 router-dev.php

# Frontend (terminal 2)
bun run dev                # http://localhost:3000 — /api/* proxifié vers :8099
                           # dashboard : /dashboard (connexion : ADMIN_* ou EDITOR_*)
```

Autres commandes utiles : `bun run build` (export statique → `out/`), `bun run lint`, `bun run test` (15 suites), `bun run db:studio` (Prisma Studio), `bash scripts/smoke-api.sh [BASE_URL]` (contrat API + pages ; `SMOKE_API_ONLY=1` pour l'API seule — mode utilisé par le déploiement).

## Tests et qualité

- **Tests unitaires** (`bun run test`) : 15 suites couvrant la couche métier Node (circuits, blog, réservations, contact, paramètres, statistiques…), l'authentification et les rôles, la réinitialisation de mot de passe, les templates d'emails, les clients externes (imgBB, DeepL) et la slugification — la couche d'origine, qui définit le contrat que l'API PHP réplique ;
- **Smoke test HTTP de bout en bout** : `bash scripts/smoke-api.sh [BASE_URL]` — contrat complet (publics, écritures, auth, rôles, dashboard) ; `SMOKE_API_ONLY=1` cible l'API seule (mode utilisé par le déploiement) ;
- **CI GitHub Actions** à chaque push `master` et chaque PR : lint, `next typegen` + typecheck, tests sur un PostgreSQL 16 éphémère (migrations + seed, aucune clé externe requise), build statique + vérification des fichiers exportés. L'API PHP est validée par le smoke du workflow de déploiement (et localement : `php -l`, smoke contre `php -S`) ;
- **TypeScript strict** (`strict: true`) : 0 erreur attendue au typecheck.

## Déploiement

Le site est déployé en production sur **LWS** (frontend statique + API PHP, base PostgreSQL Aiven) par GitHub Actions à chaque merge vers `master`. L'hébergement **Vercel** reste déployé en parallèle comme repli. Procédures détaillées : [`docs/deployment-lws.md`](docs/deployment-lws.md) (LWS — production), [`docs/deployment.md`](docs/deployment.md) (Vercel — historique).

### LWS (production)

1. **Base Aiven** — service PostgreSQL (console Aiven, plan Hobbyist-1), Service URI `…?sslmode=require` ; schéma + seed appliqués (`prisma migrate deploy`, `bun run db:seed`) — déjà en place ;
2. **Une seule fois** — créer les secrets GitHub du dépôt (accès FTP LWS, `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `ADMIN_*`… — liste exacte : `docs/deployment-lws.md` §1.2) ;
3. **Déploiement** — push vers `master` → CI verte → [`deploy-lws.yml`](.github/workflows/deploy-lws.yml) s'exécute automatiquement : migrations → génération de `php-api/config.local.php` → upload de l'API (lftp) → build statique → upload du frontend → smoke de prod. Déclenchement manuel possible (onglet *Actions*) ;
4. **Vérification** — le smoke de prod (`SMOKE_API_ONLY=1`) couvre le contrat complet ; dashboard sur `/dashboard` (comptes de la base Aiven).

### Vercel (historique, repli partiel)

Le mode Vercel (`VERCEL=1`) reste un build serveur. Depuis la migration, `app/api` n'existe plus : le site public y fetche l'API à `APP_URL` (fetch serveur, sans CORS) et fonctionne en lecture ; **dashboard et formulaires y sont indisponibles** (l'API n'y est plus servie en same-origin) — le repli complet passe par le DNS, cf. `docs/deployment-lws.md` §7.

```bash
bunx vercel --prod          # rollback : Deployments → Promote to Production
```

> ⚠️ Si le CLI échoue avec `Error: fetch failed` pendant l'upload, supprimez le cache local (`rm -rf .next`) — les fichiers `.sst` volumineux du cache turbopack cassent l'upload — puis relancez.

### CI/CD GitHub Actions

- **CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) : à chaque push `master` et chaque PR — lint, typecheck, tests sur un PostgreSQL 16 éphémère (migrations + seed, aucune clé externe requise), build statique + vérification des fichiers exportés.
- **Deploy LWS** — [`.github/workflows/deploy-lws.yml`](.github/workflows/deploy-lws.yml) : automatique après une CI verte sur `master`, ou manuel — migrations Aiven, génération de `config.local.php` depuis les secrets, upload lftp de l'API puis du frontend statique, smoke de production.

## Contribuer

Toute contribution est bienvenue : correction de bug, nouvelle fonctionnalité, contenu, ou amélioration de la documentation. Le projet tourne sur **Bun** et la CI vérifie chaque PR.

### Prérequis

- **Bun ≥ 1.3** — installation, scripts et tests ([bun.sh](https://bun.sh)) ;
- **Node.js ≥ 20** ;
- **PHP ≥ 8.1** en local (API `php-api/` — ex. `sudo apt install php-cli php-pgsql`) ;
- **PostgreSQL 16** en local (par exemple `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=wondertours postgres:16`).

### Mise en place

```bash
git clone https://github.com/codertobi77/wondertours.git
cd wondertours
bun install                # installe + génère le client Prisma (postinstall)

# Créez .env à partir du modèle de la section « Variables d'environnement »
# (seuls DATABASE_URL et AUTH_SECRET sont requis pour démarrer)
bun run db:migrate         # applique les migrations
bun run db:seed            # données du site + comptes admin & éditeur

# API PHP : créez php-api/config.local.php depuis config.example.php
# (database_url + auth_secret), puis suivez « Démarrage local » :
# terminal 1 : php -S 127.0.0.1:8099 router-dev.php (depuis php-api/)
# terminal 2 : bun run dev → http://localhost:3000
```

### Workflow de contribution

1. **Branche** — partez d'un `master` à jour : `git checkout -b feature/ma-fonctionnalite` (ou `fix/…`, `docs/…`) ;
2. **Développement** — respectez l'architecture en couches (API PHP : handler → lib → PDO ; outillage Node : service → Prisma) et les conventions ci-dessous ;
3. **Vérifications locales** :
   ```bash
   bun run lint             # 0 erreur attendue
   npx tsc --noEmit         # typecheck sans erreur
   bun run test             # tous les tests passent
   bun run build            # le build passe
   ```
4. **Commit** — message en français, à l'impératif, sur une seule ligne, décrivant précisément le changement (ex. : « Ajoute le service de mailing Resend »). Un commit = un changement logique ;
5. **Pull request** — poussez votre branche et ouvrez une PR vers `master` décrivant le problème résolu et la solution ; la CI doit être verte (lint, typecheck, tests sur PostgreSQL 16, build) avant revue et fusion.

### Conventions du projet

- **TypeScript strict** partout ; **contrat API double-face** : les schémas Zod de la couche Node (testés par `bun test`) et leur réplique PHP (`php-api/lib/Validator.php`) doivent rester synchrones ; aucune logique métier dans les handlers (`php-api/handlers/`) ;
- **Next.js 16** : cette version introduit des breaking changes par rapport aux versions antérieures (le middleware s'appelle « proxy », conventions App Router…) — consultez `node_modules/next/dist/docs/` avant d'utiliser une API incertaine ;
- **Interface en français** ; le bilinguisme FR/EN passe par `lib/translations.ts` (statique) et les champs `*En` en base (traduction assistée DeepL) ;
- **Services externes** : dégradation gracieuse obligatoire — sans clé (`IMGBB_API_KEY`, `DEEPL_API_KEY`, `RESEND_API_KEY`), la requête HTTP appelante ne doit jamais échouer (cf. `lib/services/imgbb.ts`, `deepl.ts`, `mailer.ts`) ;
- **Base de données** : tout changement de schéma passe par une migration Prisma committée (`bun run db:migrate` → fichiers dans `prisma/migrations/`) — ne jamais modifier le schéma partagé avec `db:push` ;
- **Tests** : toute nouvelle logique métier s'accompagne de tests unitaires dans `tests/` (style des suites existantes).

### Checklist avant PR

- [ ] `bun run lint` — 0 erreur (les warnings préexistants sont tolérés) ;
- [ ] `npx tsc --noEmit` — sans erreur ;
- [ ] `bun run test` — tous les tests passent ;
- [ ] `bun run build` — le build passe ;
- [ ] `bash scripts/smoke-api.sh` — si vous avez touché aux API ou au dashboard ;
- [ ] migrations committées le cas échéant, `README` et `docs/` mis à jour si le comportement change.

## Limitations connues

1. **Sessions JWT irrévocables** : stateless (7 jours) — désactiver ou rétrograder un utilisateur n'invalide pas ses sessions déjà émises ; faire tourner `AUTH_SECRET` pour tout révoquer.
2. **Images placeholder** (`[PHOTO … À REMPLACER]`) à remplacer par de vraies images.
3. **metadataBase** non défini (warning build) — définir `NEXT_PUBLIC_SITE_URL` sur le domaine final.
4. **Suppression imgBB manuelle** : imgBB n'expose pas d'API de suppression — supprimer un média en dashboard retire la ligne de la médiathèque, mais l'image distante reste hébergée ; le `delete_url` conservé en base (`storagePath`) permet une suppression manuelle.
5. **Média sans imgBB** : sans `IMGBB_API_KEY`, la médiathèque retombe sur le dépôt local `uploads/` — **persistant sur LWS** (disque du mutualisé, servi sous `/uploads/`), non persistant sur Vercel (FS en lecture seule) ; imgBB reste recommandé pour des URLs stables entre hébergements (cf. « Variables d'environnement »).
