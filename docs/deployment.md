# Déploiement — Wonder Tours and Services

Procédure complète pour déployer l'application Next.js 16 + Prisma 7 sur **Vercel** avec une base **PostgreSQL managée Aiven**.

## Prérequis

- `bun` ≥ 1.x installé localement
- CLI Vercel authentifiée : `bunx vercel login` (ou import GitHub, cf. § Vercel)
- Un compte Aiven (console : https://console.aiven.io)
- Le dépôt GitHub `codertobi77/wondertours` à jour sur `master`

## 1. Base de données — Aiven PostgreSQL

### 1.1 Créer le service (console Aiven, manuelle)

1. https://console.aiven.io → **Create service** → **PostgreSQL**
2. Plan conseillé : **Hobbyist-1** (1 vCPU / 1 Go) pour un petit site vitrine
3. Cloud/région : proche des utilisateurs (ex. `google-europe-west1` ou `aws-eu-west-1`) — la région Vercel sera mise en cohérence
4. Attendre le statut **Running** (quelques minutes)
5. Onglet **Overview** → **Service URI** : copier l'URI complète
   `postgres://avnadmin:…@pg-…aivencloud.com:PORT/db?sslmode=require`

> L'URI contient déjà `?sslmode=require`, nécessaire pour Aiven. Le driver `pg`
> (`@prisma/adapter-pg` dans `lib/db.ts`) accepte l'URI telle quelle.

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

## 2. Hébergement — Vercel

### 2.1 Option A : CLI (recommandée si déjà authentifié)

```bash
bunx vercel link                       # rattache le repo au projet Vercel
echo "<URI-aiven>" | bunx vercel env add DATABASE_URL production
bunx vercel --prod                     # build + déploiement production
```

Notes :
- `postinstall: prisma generate` est déjà dans `package.json` → le client
  Prisma est généré pendant le build Vercel (le dossier généré est gitignoré).
- Le build ne se connecte **pas** à la base pour compiler (aucune requête
  au build : pages publiques en `force-dynamic`, API en route handlers).
- La région du projet Vercel peut être changée dans Settings → Functions.

### 2.2 Option B : import GitHub (sans CLI)

1. https://vercel.com/new → importer `codertobi77/wondertours`
2. Framework preset : **Next.js** (détecté automatiquement, bun détecté)
3. Environment Variables → ajouter `DATABASE_URL` = URI Aiven (Production)
4. **Deploy**. Les push suivants sur `master` redéploient automatiquement.

### 2.3 Variables d'environnement complémentaires

- `AUTH_SECRET` — **requis** pour le dashboard (sessions JWT) :
  `echo "<secret>" | bunx vercel env add AUTH_SECRET production`
- `IMGBB_API_KEY` — **recommandé** : héberge les uploads de la médiathèque
  sur imgBB. Sans elle, la médiathèque retombe sur `public/uploads/`, non
  persistant sur Vercel (FS en lecture seule) :
  `echo "<clé-imgbb>" | bunx vercel env add IMGBB_API_KEY production`
- `DEEPL_API_KEY` — optionnel : active la traduction assistée du dashboard
  (`POST /api/dashboard/translate`, bouton « Traduire en anglais ») :
  `echo "<clé-deepl>" | bunx vercel env add DEEPL_API_KEY production`
- `NEXT_PUBLIC_SITE_URL` — optionnel, métadonnées ; à défaut
  `SITE_CONFIG.url` (`https://wondertours.bj`) est utilisée.

## 3. Vérification post-déploiement

```bash
bash scripts/smoke-api.sh https://<projet>.vercel.app
```

Le script crée une demande de contact et une réservation de test, puis les
supprime de la base via psql (nettoyage automatique — `trap cleanup EXIT`).
Sinon, purge manuelle :

```bash
psql "<URI-aiven>" -c "DELETE FROM bookings WHERE email='smoke@example.com';
  DELETE FROM contact_requests WHERE email='smoke@example.com';"
```

## 4. Limitations connues

1. **Uploads média** : avec `IMGBB_API_KEY` (cf. §2.3), les images sont
   hébergées sur imgBB et persistent en production. Sans la clé, la
   médiathèque écrit dans `public/uploads/` — en lecture seule sur Vercel,
   les fichiers téléversés sont alors perdus entre les invocations
   (mode local/dev uniquement).
2. **Suppression imgBB manuelle** : imgBB n'expose pas d'API de
   suppression — supprimer un média en dashboard retire la ligne de la
   base, mais l'image distante reste hébergée ; le `delete_url` conservé
   (`storagePath`) permet une suppression manuelle depuis un navigateur.
3. **Sessions JWT irrévocables** : stateless (7 jours) — désactiver ou
   rétrograder un utilisateur n'invalide pas ses sessions déjà émises ;
   faire tourner `AUTH_SECRET` pour tout révoquer.
4. **Images placeholder** : le seed et les pages utilisent des chaînes
   `[PHOTO … À REMPLACER]` — à remplacer par de vraies images client.
5. **metadataBase non défini** (warning build) : définir
   `NEXT_PUBLIC_SITE_URL` ou `SITE_CONFIG.url` sur le domaine final.

## 5. Rollback / mises à jour

- **Nouvelle migration** : `bun run db:migrate` en local → commit
  `prisma/migrations/` → push → sur Aiven : `DATABASE_URL=<uri> bunx prisma
  migrate deploy` → `vercel --prod` (Vercel redéploie aussi à chaque push).
- **Restaurer un déploiement** : Vercel → Deployments → menu ⋯ → **Promote to
  Production** sur un déploiement antérieur.
- **Sauvegarde Aiven** : console → service → Backups (rétention selon plan).
