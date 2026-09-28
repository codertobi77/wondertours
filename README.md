# Wonder Tours and Services

> Site web officiel de l'agence de voyage **Wonder Tours and Services** (Ouidah, Bénin) : vitrine bilingue français / anglais, tableau de bord d'administration et API REST — construits avec Next.js 16.

[![CI](https://github.com/romain-djegbenagnon/wondertours_web_site/actions/workflows/ci.yml/badge.svg)](https://github.com/romain-djegbenagnon/wondertours_web_site/actions/workflows/ci.yml)

- **Production** : https://wondertourswebsite.vercel.app
- **Dépôt** : https://github.com/romain-djegbenagnon/wondertours_web_site (branche `master`)
- **Documentation** : [`docs/api.md`](docs/api.md) (API), [`env-setup.md`](docs/env-setup.md) (variables d'environnement), [`deployment.md`](docs/deployment.md) (Vercel), [`deployment-lws.md`](docs/deployment-lws.md) (LWS/cPanel)

## Présentation

**Wonder Tours and Services** est une agence de voyage basée à Ouidah (Bénin), spécialisée dans la découverte du Bénin, du Togo et du Ghana depuis plus de 20 ans. Ce dépôt contient le site web de l'agence, qui regroupe trois applications dans un même projet Next.js :

- **Le site vitrine public** — présente l'agence, ses services, ses destinations et ses circuits touristiques ; publie des articles de blog et des témoignages de voyageurs ; et permet aux visiteurs de demander un devis via le formulaire de contact ou de réserver directement en ligne.
- **Le tableau de bord d'administration** (`/dashboard`) — back-office complet qui permet à l'équipe de gérer tout le contenu du site (circuits, blog, témoignages…), les réservations et demandes de contact reçues, la médiathèque et les comptes utilisateurs, avec trois niveaux d'accès (admin, éditeur, lecteur).
- **L'API REST** (`app/api`) — consommée à la fois par le site public et par le dashboard : contenus publics en lecture, CRUD complet protégé par session.

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
| Langage | TypeScript (strict) |
| Base de données | PostgreSQL (Aiven en production, locale en dev) |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Validation | Zod 4 |
| Authentification | jose (JWT) + bcrypt |
| UI | Tailwind CSS 4, framer-motion, lucide-react |
| Emails | Resend |
| Services externes | DeepL (traduction), imgBB (images) |
| Tests | Bun test |
| Runtime / paquets | Bun |
| CI/CD | GitHub Actions (Vercel, bundle LWS) |
| Hébergement | Vercel (+ LWS/cPanel en préparation) |

## Architecture backend

Le backend suit une architecture en couches : **route handler → service → Prisma → PostgreSQL**.

```
app/api/**/route.ts          Route handlers (Next.js) — HTTP seulement
        │
        ▼
lib/services/*.ts            Couche services — logique métier, requêtes Prisma
        │
        ▼
lib/db.ts                    Client Prisma singleton (adapter pg) + ré-exports
        │
        ▼
PostgreSQL (Aiven / local)
```

### Couches

- **`app/api/**/route.ts`** — Route handlers Next.js. Valident l'entrée avec des schémas **Zod** (`parseQuery` / `parseBody` de `lib/api/utils.ts`), appellent un service et renvoient du JSON via les helpers `ok`, `created`, `badRequest`, `notFound`, `conflict`… Ils ne contiennent aucune logique métier.
- **`lib/services/*.ts`** — Logique métier et accès aux données : un module par domaine (`circuits`, `destinations`, `bookings`, `contact-requests`, `blog`, `testimonials`, `categories`, `services`, `settings`, `stats`, `media`, `users`, `password-reset`), complétés par les clients externes `imgbb` (hébergement d'images), `deepl` (traduction) et `mailer` (emails transactionnels Resend — templates dans `mail-templates.ts`). Les services construisent les `where` Prisma (filtres, pagination) et retournent des types inférés.
- **`lib/db.ts`** — Client Prisma en singleton (pattern `globalThis` pour le hot-reload en dev) construit sur l'adapter driver `@prisma/adapter-pg`. Ré-exporte les types du modèle (`User`, `Circuit`…).
- **`lib/api/utils.ts`** — Helpers transverses : schémas de pagination, réponses JSON normalisées (y compris sérialisation BigInt), mapping d'erreurs Prisma (`P2002` → 409, `P2025` → 404, `P2003` → 400) via l'enveloppe `handleRoute`.
- **`prisma/schema.prisma`** — Schéma de 13 tables : `users`, `destinations`, `categories`, `circuits`, `testimonials`, `blog_categories`, `blog_posts`, `services`, `bookings`, `contact_requests`, `settings`, `media_library`, `password_reset_tokens` (+ 6 enums : rôle, difficulté, type/statut de réservation, type de demande, statut de contact). Client généré dans `lib/generated/prisma` (gitignoré).

### TLS PostgreSQL (important)

Prisma 7 se connecte via le driver `pg` (node-postgres), dont la sémantique `sslmode` diffère de libpq : `sslmode=require` dans l'URI produit un `ssl={}` **vérifiant strictement** la chaîne de certificats, ce qui échoue avec la CA managée Aiven (`self signed certificate in certificate chain`). `lib/db.ts` retire donc `sslmode` de l'URI et fixe `ssl: { rejectUnauthorized: false }` (chiffrement sans vérification, conforme libpq).

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
| POST | `/api/contact` | Créer une demande de contact (validation Zod) |
| POST | `/api/bookings` | Créer une réservation (référence `WT-XXXXXX`) |

Dashboard (**authentification requise** — cf. ci-dessous) : `/api/dashboard/{circuits,destinations,categories,testimonials,services,blog,blog-categories,bookings,contact-requests,settings,stats,media,users}` avec CRUD complet (GET/POST, `…/[id]` GET/PATCH/DELETE), `…/bookings/[id]/status`, `…/contact-requests/[id]/status` et `POST …/translate` (traduction DeepL, admin+éditeur).

Authentification : `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.

### Authentification dashboard

Sessions JWT (jose) signées avec `AUTH_SECRET`, stockées dans le cookie httpOnly `wt_session` (7 jours).

- les routes `/api/dashboard/**` passent par `handleProtectedRoute` (lib/api/utils.ts) : 401 sans session, 403 si le rôle est insuffisant — GET du contenu pour tous les rôles, écritures pour admin+editor, gestion des comptes (`users/**`) réservée à admin ;
- `proxy.ts` (Next 16 : middleware renommé « proxy ») protège les pages `/dashboard/**` : sans session → redirection vers `/dashboard/login` ; `/dashboard/users**` → admin uniquement (double contrôle : redirection proxy + re-vérification serveur dans la page via `getSession()`, lib/session.ts) ;
- l'UI reflète le rôle : l'entrée « Utilisateurs » de la sidebar n'apparaît que pour l'admin, le header affiche le nom/email/rôle de la session ;
- le seed crée **deux comptes** depuis `.env` : l'admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) et un éditeur (`EDITOR_EMAIL` / `EDITOR_PASSWORD`) — idempotent, le mot de passe n'est posé qu'à la création. L'admin crée ensuite d'autres comptes (admin, éditeur ou lecteur) depuis `/dashboard/users/new`.

Le seed (`prisma/seed.ts`) alimente la base depuis les données statiques du site (`lib/data/`, `lib/constants`) par upserts — **rejouable** sans duplication.

## Variables d'environnement

| Variable | Où | Description |
|----------|-----|-------------|
| `DATABASE_URL` | `.env` (local), `.env.prod`, Vercel (Production) | URI PostgreSQL. Local : `postgres://…` (sans ssl). Aiven : `postgres://…?sslmode=require` (le paramètre est neutralisé au runtime, cf. TLS). |
| `AUTH_SECRET` | `.env`, Vercel (Production) | Secret de signature des sessions JWT du dashboard (`openssl rand -base64 32`). **Requis** pour l'authentification. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `.env` | Compte administrateur initial créé par le seed (le mot de passe n'est posé qu'à la création). |
| `EDITOR_EMAIL` / `EDITOR_PASSWORD` | `.env` | Compte éditeur initial créé par le seed (idempotent, mêmes règles que l'admin). |
| `NEXT_PUBLIC_SITE_URL` | optionnelle | URL publique pour les métadonnées ; à défaut `SITE_CONFIG.url` (`https://wondertours.bj`) |
| `IMGBB_API_KEY` | `.env`, Vercel (Production) | Optionnelle — stockage distant imgBB pour la médiathèque. **Recommandée en prod** (FS Vercel en lecture seule) ; sans elle, fallback local `public/uploads/` (non persistant). |
| `DEEPL_API_KEY` | `.env`, Vercel (Production) | Optionnelle — active `POST /api/dashboard/translate` (bouton « Traduire en anglais » des formulaires du dashboard) ; sans elle, la route répond `503`. |
| `RESEND_API_KEY` | `.env`, Vercel (Production) | Optionnelle — active les emails transactionnels via Resend (accusé de réception contact, confirmation/notification réservation, mot de passe oublié, bienvenue). Sans elle : envoi ignoré avec log, aucune requête n'échoue. |
| `MAIL_FROM` / `MAIL_TEAM_EMAIL` / `APP_URL` | `.env` | Optionnelles — expéditeur (défaut `Wonder Tours <onboarding@resend.dev>`, domaine de test Resend), destinataires des notifications internes (défaut `contact@wondertours.bj`), base des liens des emails (défaut `NEXT_PUBLIC_SITE_URL` puis `https://wondertours.bj` ; local : `http://localhost:3000`). |

### Modèle `.env` local

Le site démarre avec les seules variables requises ; chaque service optionnel se dégrade silencieusement sans sa clé (cf. tableau ci-dessus).

```bash
# ── Requis ──
DATABASE_URL="postgres://user:pass@localhost:5432/wondertours"
AUTH_SECRET="<sortie de : openssl rand -base64 32>"

# ── Comptes initiaux du dashboard (créés par `bun run db:seed` ; ignorés avec un warning si absents) ──
ADMIN_EMAIL="admin@wondertours.bj"
ADMIN_PASSWORD="<choisir un mot de passe>"
EDITOR_EMAIL="editeur@wondertours.bj"
EDITOR_PASSWORD="<choisir un mot de passe>"

# ── Emails transactionnels Resend — optionnel (sans clé : envois ignorés, aucune requête n'échoue) ──
# RESEND_API_KEY="re_xxxxxxxxxxxx"
# MAIL_FROM="Wonder Tours <onboarding@resend.dev>"    # domaine de test : ne délivre que vers l'email du compte Resend
# MAIL_TEAM_EMAIL="contact@wondertours.bj"             # destinataires des notifications internes
# APP_URL="http://localhost:3000"                      # base des liens insérés dans les emails (mot de passe oublié…)

# ── Autres services — optionnels ──
# IMGBB_API_KEY="xxx"                                  # médiathèque distante (sinon fallback public/uploads/)
# DEEPL_API_KEY="xxx"                                  # bouton « Traduire en anglais » du dashboard (sinon 503)
# NEXT_PUBLIC_SITE_URL="https://wondertours.bj"        # métadonnées (metadataBase, canonicals)
```

En production Vercel, requises : `DATABASE_URL`, `AUTH_SECRET` (+ `ADMIN_*` / `EDITOR_*` au premier seed) ; recommandées : `IMGBB_API_KEY` (uploads persistants), `RESEND_API_KEY` + `MAIL_FROM` (domaine vérifié Resend), `APP_URL` / `NEXT_PUBLIC_SITE_URL` sur le domaine final.

Les fichiers `.env*` et `.vercel/` sont gitignorés. Le client Prisma généré (`lib/generated/prisma`) est gitignoré et régénéré au `postinstall` (`prisma generate`) — donc pendant le build Vercel.

## Démarrage local

```bash
bun install                # installe + génère le client Prisma (postinstall)

# Base de données locale (PostgreSQL)
#   créez .env à partir du modèle de la section « Variables d'environnement »
bun run db:migrate         # prisma migrate dev (crée/applique la migration)
bun run db:seed            # upserts depuis les données statiques + comptes admin & éditeur

bun run dev                # http://localhost:3000 → dashboard : /dashboard
                           # (connexion : ADMIN_* ou EDITOR_* du .env)
```

Autres commandes utiles : `bun run build`, `bun run lint`, `bun run test` (16 suites, 61 tests), `bun run db:studio` (Prisma Studio), `bash scripts/smoke-api.sh` (45 vérifications sur `localhost:3000` : endpoints publics, auth, rôles, dashboard).

## Tests et qualité

- **Tests unitaires** (`bun run test`) : 61 tests répartis en 16 suites couvrant les services (circuits, blog, réservations, contact, paramètres, statistiques…), l'authentification et les rôles, la réinitialisation de mot de passe, les templates d'emails, les clients externes (imgBB, DeepL) et la slugification ;
- **Smoke test HTTP de bout en bout** : `bash scripts/smoke-api.sh` — 45 vérifications sur `localhost:3000` (32 sur la prod) ;
- **CI GitHub Actions** à chaque push `master` et chaque PR : lint, `next typegen` + typecheck, tests sur un PostgreSQL 16 éphémère (migrations + seed, aucune clé externe requise), build et vérification du bundle standalone ;
- **TypeScript strict** (`strict: true`) : 0 erreur attendue au typecheck.

## Déploiement

Le site tourne en production sur **Vercel** avec une base **PostgreSQL managée Aiven**. Procédure détaillée : [`docs/deployment.md`](docs/deployment.md).

Résumé :

1. **Base Aiven** — créer le service PostgreSQL (console Aiven, plan Hobbyist-1), récupérer le Service URI (`…?sslmode=require`) ;
2. **Schéma + données** — depuis la machine locale :
   ```bash
   DATABASE_URL="<URI-aiven>" bunx prisma migrate deploy
   DATABASE_URL="<URI-aiven>" bun run db:seed
   ```
3. **Vercel** — projet `wondertours_web_site` (team `amidala-samaris-projects`) :
   ```bash
   bunx vercel link                                          # une seule fois
   echo "<URI-aiven>" | bunx vercel env add DATABASE_URL production
   echo "<secret>"    | bunx vercel env add AUTH_SECRET production
   echo "<clé-imgbb>" | bunx vercel env add IMGBB_API_KEY production  # optionnel : uploads persistants
   echo "<clé-resend>" | bunx vercel env add RESEND_API_KEY production # optionnel : emails transactionnels
   bunx vercel --prod
   ```
   Le build ne se connecte pas à la base (pages publiques en `force-dynamic`, API en route handlers) ; le client Prisma est régénéré au `postinstall`.
4. **Vérification** — `bash scripts/smoke-api.sh https://wondertourswebsite.vercel.app` (32 vérifications ; supprime les lignes de test via psql, sinon purge manuelle) ;
5. **Mises à jour** — nouvelle migration : `bun run db:migrate` en local → commit → `migrate deploy` sur Aiven → `bunx vercel --prod` (rollback : Deployments → *Promote to Production*).

> ⚠️ Si le CLI échoue en cours de déploiement avec `Error: fetch failed` pendant l'upload, supprimez le cache local (`rm -rf .next`) — les fichiers `.sst` volumineux du cache turbopack cassent l'upload — puis relancez.

### Hébergement LWS (cPanel mutualisé / Passenger)

Un second hébergement **LWS** est préparé : bundle autonome (`output: "standalone"` dans `next.config.ts`) construit localement ou en CI, déployé via « Setup Node.js App » — aucun build ni `npm install` sur le serveur. La base reste **Aiven** dans un premier temps. Procédure complète : [`docs/deployment-lws.md`](docs/deployment-lws.md).

```bash
bash scripts/package-lws.sh --smoke   # build + tar.gz dans dist-lws/ + test local du bundle exact
```

### CI/CD GitHub Actions

- **CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) : à chaque push `master` et chaque PR — lint, typecheck, tests sur un PostgreSQL 16 éphémère (migrations + seed, aucune clé externe requise), build + vérification du bundle standalone.
- **Package LWS** — [`.github/workflows/package-lws.yml`](.github/workflows/package-lws.yml) : manuel ou sur tag `lws-v*` — construit le tar.gz de déploiement, le publie en artefact (Release GitHub sur tag). L'upload vers cPanel reste manuel (pas d'accès SSH/API sur le mutualisé).

## Contribuer

Toute contribution est bienvenue : correction de bug, nouvelle fonctionnalité, contenu, ou amélioration de la documentation. Le projet tourne sur **Bun** et la CI vérifie chaque PR.

### Prérequis

- **Bun ≥ 1.3** — installation, scripts et tests ([bun.sh](https://bun.sh)) ;
- **Node.js ≥ 20** ;
- **PostgreSQL 16** en local (par exemple `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=wondertours postgres:16`).

### Mise en place

```bash
git clone https://github.com/romain-djegbenagnon/wondertours_web_site.git
cd wondertours_web_site
bun install                # installe + génère le client Prisma (postinstall)

# Créez .env à partir du modèle de la section « Variables d'environnement »
# (seuls DATABASE_URL et AUTH_SECRET sont requis pour démarrer)
bun run db:migrate         # applique les migrations
bun run db:seed            # données du site + comptes admin & éditeur
bun run dev                # http://localhost:3000
```

### Workflow de contribution

1. **Branche** — partez d'un `master` à jour : `git checkout -b feature/ma-fonctionnalite` (ou `fix/…`, `docs/…`) ;
2. **Développement** — respectez l'architecture en couches (route handler → service → Prisma) et les conventions ci-dessous ;
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

- **TypeScript strict** partout ; validation systématique des entrées avec **Zod** (`parseBody` / `parseQuery`) ; aucune logique métier dans les route handlers ;
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
5. **Média sans imgBB en prod** : sans `IMGBB_API_KEY`, la médiathèque retombe sur `public/uploads/`, non persistant sur Vercel — définir la clé (cf. « Variables d'environnement »).
