# Déploiement — Vercel + Render + Aiven (temporaire, en attendant LWS)

Déploiement du site Wonder Tours avec :
- **Frontend Next.js** sur **Vercel** (`https://wondertoursandservices.com`)
- **Backend API PHP** (`php-api/`) sur **Render** (Docker, temporaire)
- **Base PostgreSQL** sur **Aiven**

Quand l’hébergeur LWS répondra, le backend pourra revenir sur LWS — voir [`deployment-lws.md`](deployment-lws.md). Le fallback `PHP_API_ORIGIN` dans `next.config.ts` pointe encore vers `api.wondertoursandservices.com` si la variable n’est pas définie.

## Architecture

```
Navigateur → https://wondertoursandservices.com/api/* (Vercel)
          → rewrite Next.js (PHP_API_ORIGIN) → https://<service>.onrender.com/api/* (Render, PHP)
Render (PHP, PDO pgsql) → PostgreSQL Aiven (sslmode=require)
```

Le navigateur reste en même origine sur Vercel (proxy `/api/*`) : pas de CORS requis, cookie `wt_session` partagé.

## Prérequis

- `bun` ≥ 1.x localement (Prisma/migrations/seed)
- Accès Aiven (URI PostgreSQL avec `?sslmode=require`)
- Compte Vercel (projet lié au repo)
- Compte Render (Blueprint ou Web Service Docker)

## 1. Base de données — Aiven PostgreSQL

### 1.1 Service

Créer/récupérer un service PostgreSQL Aiven **Running** et copier la **Service URI** :
`postgresql://...aivencloud.com:PORT/defaultdb?sslmode=require`

### 1.2 Migrations (depuis la machine locale ou CI)

```bash
DATABASE_URL="<URI-aiven>" bunx prisma migrate deploy
```

La config `prisma7.config.ts` lit `DATABASE_URL` de l’environnement. Le backend PHP consomme le même schéma via PDO (aucune migration côté PHP).

### 1.3 Seed (optionnel si données déjà présentes)

```bash
DATABASE_URL="<URI-aiven>" bun run db:seed
```

Le seed (`prisma/seed.ts`) utilise des upserts : rejouable sans duplication.

## 2. Backend API PHP — Render

Fichiers prêts dans le repo :
- `render.yaml` (racine) — Blueprint Render
- `php-api/Dockerfile` — image `php:8.3-apache`, `pdo_pgsql`, `mod_rewrite`, écoute `$PORT`, routes sous `/api/*`
- `php-api/.dockerignore`

### 2.1 Déploiement

Option A — **Blueprint** : Render → *New +* → *Blueprint*, connecter le repo GitHub ; Render lit `/render.yaml` (`rootDir: php-api`).

Option B — **Web Service (Docker)** : *New +* → *Web Service*, repo GitHub, *Root Directory* = `php-api`, *Environment* = Docker.

### 2.2 Variables d’environnement Render (Dashboard, ne pas commiter)

| Variable | Requis | Notes |
|---|---|---|
| `DATABASE_URL` | oui | URI Aiven avec `sslmode=require` |
| `AUTH_SECRET` | oui | Secret JWT HS256 ; garder cohérent avec l’écosystème existant |
| `APP_URL` | oui | `https://wondertoursandservices.com` (liens emails, etc.) |
| `SECURE_COOKIES` | recommandé | `true` derrière HTTPS |
| `RESEND_API_KEY` | optionnel | Emails (best-effort si absent) |
| `MAIL_FROM` / `MAIL_TEAM_EMAIL` | optionnel | Expéditeur / destinataires notifications |
| `IMGBB_API_KEY` | optionnel | Médiathèque persistante ; sinon fallback local (éphémère sur conteneur) |
| `DEEPL_API_KEY` | optionnel | Traduction dashboard ; sinon `503` |
| `GITHUB_TOKEN` / `GITHUB_REPO` | optionnel | Rebuild/déclencheurs selon fonctionnalités activées |

> `config.local.php` est ignoré ; sur Render, toute config passe par les variables d’environnement (`php-api/lib/Env.php`).

### 2.3 Vérification backend

```bash
curl -sS https://<service>.onrender.com/
curl -sS https://<service>.onrender.com/api/settings
curl -sS "https://<service>.onrender.com/api/circuits"
```

Réponse attendue : JSON. En cas d’erreur DB/auth, consulter les logs Render. Si Aiven utilise une allowlist IP, vérifier l’accès réseau depuis Render.

## 3. Frontend — Vercel

### 3.1 Variable clé pour Render

Dans Vercel → *Project* → *Settings* → *Environment Variables* :

- `PHP_API_ORIGIN` = `https://<service>.onrender.com` (sans `/api`, sans slash final)

Puis redéployer Vercel (push ou *Redeploy*).

### 3.2 Autres variables

- `APP_URL` = `https://wondertoursandservices.com` (recommandé)

Les secrets métier du backend (JWT, Resend, DeepL, imgBB) sont gérés côté Render. N’ajouter sur Vercel que ce dont le frontend/build Next.js a besoin.

## 4. Vérification bout en bout

- `https://wondertoursandservices.com` charge le frontend.
- Les appels réseau du navigateur vers `/api/*` (même origine Vercel) répondent via le proxy vers Render.
- Smoke API direct (remplacer l’URL) :
  ```bash
  SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://<service>.onrender.com
  ```
  (Le script peut créer/supprimer des données de test ; exécuter en connaissance de cause.)

## 5. Retour vers LWS (quand disponible)

1. Déployer `php-api/` sur LWS (cf. [`deployment-lws.md`](deployment-lws.md)).
2. Soit remettre `PHP_API_ORIGIN` sur `https://api.wondertoursandservices.com`, soit retirer la variable pour utiliser le fallback.
3. Redéployer Vercel.
4. Garder `AUTH_SECRET` et `DATABASE_URL` cohérents entre environnements.

## 6. Limitations / notes

- **Render plan free** : mise en veille possible, cold start au premier appel (temporaire acceptable).
- **Uploads média** sans `IMGBB_API_KEY` : stockage local conteneur éphémère sur Render.
- **Secrets** : jamais dans git ; Render/Vercel env vars uniquement.
- **Migrations** : `prisma migrate deploy` contre Aiven avant de déployer du code dépendant d’un nouveau schéma.
