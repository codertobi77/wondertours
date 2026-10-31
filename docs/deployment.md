# Déploiement — Frontend Next.js sur Vercel

Procédure de déploiement du **frontend Next.js 16** sur **Vercel**, avec le backend API PHP sur LWS Perso et la base de données sur Aiven.

## Architecture

```
https://wondertoursandservices.com  →  Vercel (frontend Next.js)
https://api.wondertoursandservices.com  →  LWS Perso (API PHP php-api/)
PostgreSQL Aiven  →  base de données partagée
```

Le frontend appelle l'API via le proxy Next.js (`/api/*` → `https://api.wondertoursandservices.com/api/*`, configuré dans `next.config.ts`). Le cookie `wt_session` est de même origine côté navigateur — pas de CORS requis.

## Prérequis

- `bun` ≥ 1.x installé localement
- CLI Vercel authentifiée : `bunx vercel login` (ou import GitHub)
- Un compte Aiven (console : https://console.aiven.io)
- Le dépôt GitHub `codertobi77/wondertours` à jour sur `master`

## 1. Base de données — Aiven PostgreSQL

### 1.1 Créer le service (console Aiven, manuelle)

1. https://console.aiven.io → **Create service** → **PostgreSQL**
2. Plan conseillé : **Hobbyist-1** (1 vCPU / 1 Go) pour un petit site vitrine
3. Cloud/région : proche des utilisateurs (ex. `google-europe-west1` ou `aws-eu-west-1`)
4. Attendre le statut **Running** (quelques minutes)
5. Onglet **Overview** → **Service URI** : copier l'URI complète
   `postgres://avnadmin:…@pg-…aivencloud.com:PORT/db?sslmode=require`

### 1.2 Migrer le schéma (depuis la machine locale)

```bash
DATABASE_URL="<URI-aiven>" bunx prisma migrate deploy
```

Applique toutes les migrations de `prisma/migrations/` dans l'ordre (la config
`prisma7.config.ts` lit `DATABASE_URL` de l'environnement).

### 1.3 Seed des données initiales

```bash
DATABASE_URL="<URI-aiven>" bun run db:seed
```

Le seed (`prisma/seed.ts`) fait des `upsert` par slug : il est **rejouable**
sans dupliquer les données.

### 1.4 Vérifier

```bash
psql "<URI-aiven>" -c "SELECT 'circuits' t, COUNT(*) FROM circuits
  UNION ALL SELECT 'destinations', COUNT(*) FROM destinations
  UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
  UNION ALL SELECT 'testimonials', COUNT(*) FROM testimonials
  UNION ALL SELECT 'services', COUNT(*) FROM services
  UNION ALL SELECT 'settings', COUNT(*) FROM settings;"
```

Compteurs attendus (seed) : circuits ≥ 8, destinations = 6, blog_posts ≥ 8,
testimonials ≥ 6, services = 4, settings ≥ 9.

## 2. Hébergement frontend — Vercel

### 2.1 Option A : CLI (recommandée si déjà authentifié)

```bash
bunx vercel link                       # rattache le repo au projet Vercel
echo "<URI-aiven>" | bunx vercel env add DATABASE_URL production
echo "<secret>" | bunx vercel env add AUTH_SECRET production
bunx vercel --prod                     # build + déploiement production
```

Notes :
- `postinstall: prisma generate` est déjà dans `package.json` → le client
  Prisma est généré pendant le build Vercel (le dossier généré est gitignoré).
- Le build ne se connecte **pas** à la base pour compiler (aucune requête
  au build : pages publiques en `force-dynamic`, contenu fetché depuis l'API
  LWS au build via `APP_URL`).
- La région du projet Vercel peut être changée dans Settings → Functions.

### 2.2 Option B : import GitHub (sans CLI)

1. https://vercel.com/new → importer `codertobi77/wondertours`
2. Framework preset : **Next.js** (détecté automatiquement, bun détecté)
3. Environment Variables → ajouter :
   - `DATABASE_URL` = URI Aiven (Production)
   - `AUTH_SECRET` = secret JWT (identique à LWS — sessions compatibles)
   - `APP_URL` = `https://wondertoursandservices.com` (liens emails + fetch contenu au build)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed des comptes initiaux)
   - `EDITOR_EMAIL`, `EDITOR_PASSWORD` (optionnel)
   - `RESEND_API_KEY`, `DEEPL_API_KEY`, `IMGBB_API_KEY` (optionnels, dégradation gracieuse)
4. **Deploy**. Les push suivants sur `master` redéploient automatiquement.

### 2.3 Variables d'environnement complémentaires

- `IMGBB_API_KEY` — héberge les uploads de la médiathèque sur imgBB. Sans elle,
  la médiathèque retombe sur le stockage local (non persistant sur Vercel).
- `DEEPL_API_KEY` — active la traduction assistée du dashboard
  (`POST /api/dashboard/translate`). Sans la clé, la route répond `503`.
- `NEXT_PUBLIC_SITE_URL` — optionnel, métadonnées ; à défaut
  `SITE_CONFIG.url` (`https://wondertoursandservices.com`) est utilisée.

## 3. Backend API — LWS Perso (déploiement séparé)

L'API PHP est déployée indépendamment via GitHub Actions
(`.github/workflows/deploy-lws.yml`) sur `https://api.wondertoursandservices.com`.
Voir [`docs/deployment-lws.md`](deployment-lws.md).

## 4. Vérification post-déploiement

```bash
bash scripts/smoke-api.sh https://api.wondertoursandservices.com
```

Le script crée une demande de contact et une réservation de test, puis les
supprime de la base via psql (nettoyage automatique — `trap cleanup EXIT`).

## 5. Limitations connues

1. **Uploads média** : avec `IMGBB_API_KEY`, les images sont hébergées sur
   imgBB et persistent en production. Sans la clé, la médiathèque écrit dans
   `public/uploads/` — en lecture seule sur Vercel, les fichiers sont perdus
   entre les invocations.
2. **Suppression imgBB manuelle** : imgBB n'expose pas d'API de suppression.
3. **Sessions JWT irrévocables** : stateless (7 jours) — désactiver ou
   rétrograder un utilisateur n'invalide pas ses sessions déjà émises ;
   faire tourner `AUTH_SECRET` pour tout révoquer.
4. **Images placeholder** : le seed et les pages utilisent des chaînes
   `[PHOTO … À REMPLACER]` — à remplacer par de vraies images client.
5. **metadataBase non défini** (warning build) : définir
   `NEXT_PUBLIC_SITE_URL` ou `SITE_CONFIG.url` sur le domaine final.

## 6. Rollback / mises à jour

- **Nouvelle migration** : `bun run db:migrate` en local → commit
  `prisma/migrations/` → push → sur Aiven : `DATABASE_URL=<uri> bunx prisma
  migrate deploy` → Vercel redéploie aussi à chaque push.
- **Restaurer un déploiement** : Vercel → Deployments → menu ⋯ → **Promote to
  Production** sur un déploiement antérieur.
- **Sauvegarde Aiven** : console → service → Backups (rétention selon plan).