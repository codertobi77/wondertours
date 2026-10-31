# Configuration des variables d'environnement

Architecture cible :
- **Frontend Next.js** → Vercel (`https://wondertoursandservices.com`)
- **Backend API PHP** → LWS Perso (`https://api.wondertoursandservices.com`)
- **Base de données** → PostgreSQL Aiven

Les fichiers `.env*` sont gitignorés. Next.js/Bun chargent `.env.local` (priorité) puis `.env` ;
en production, les variables vivent dans les secrets GitHub (déploiement LWS) ou côté Vercel.

## Variables

### `DATABASE_URL` — requis

URI PostgreSQL. Local : `postgres://user:pass@localhost:5432/wondertours` (sans ssl).
Aiven : `postgres://…?sslmode=require` (le paramètre est neutralisé au runtime, cf. `lib/pg-adapter.ts`).

### `AUTH_SECRET` — requis (dashboard)

Secret de signature des sessions JWT du dashboard (cookie `wt_session`, 7 jours).
**Doit être identique sur Vercel et LWS** pour que les sessions soient compatibles entre les deux stacks.

```bash
openssl rand -base64 32
```

Sans cette variable, la connexion au dashboard est impossible.

### `ADMIN_EMAIL` / `ADMIN_PASSWORD` — recommandé (seed)

Compte administrateur initial créé par `bun run db:seed` (cf. `docs/deployment.md`).

### `EDITOR_EMAIL` / `EDITOR_PASSWORD` — recommandé (seed)

Compte éditeur initial créé par `bun run db:seed`.

### `NEXT_PUBLIC_SITE_URL` — optionnel

URL publique utilisée pour les métadonnées (`metadataBase`, canonicals). À défaut,
`SITE_CONFIG.url` (`https://wondertoursandservices.com`) est utilisée.

### `APP_URL` — recommandé

Base des liens insérés dans les emails (reset, dashboard) **et API fetchée par les pages
publiques au build de l'export statique** (`lib/content.ts`). Défaut : `https://wondertoursandservices.com`.

### `IMGBB_API_KEY` — optionnel en local, recommandé en production

Clé du service d'hébergement d'images imgBB. Pilotage de la médiathèque
(`lib/services/media.ts` + client `lib/services/imgbb.ts`) :
- clé définie : uploads vers imgBB (URL distante persistante) ;
- clé absente : fallback stockage local (`public/uploads/`) — persistant sur LWS,
  non persistant sur Vercel.

### `DEEPL_API_KEY` — optionnel

Clé du service de traduction DeepL. Active la route `POST /api/dashboard/translate`.
Sans la clé, la route répond `503`.

### `RESEND_API_KEY` — optionnel en local, recommandé en production

Clé du service d'envoi d'emails Resend. Active tous les envois du site (contact,
réservations, mot de passe oublié, bienvenue…). Sans la clé, chaque envoi est
ignoré silencieusement (dégradation gracieuse).

Variables compagnes :
- `MAIL_FROM` — expéditeur ; défaut `Wonder Tours <onboarding@resend.dev>`.
- `MAIL_TEAM_EMAIL` — destinataire(s) des notifications internes, séparés par des virgules.

### `DEV_API_URL` — dev uniquement

Cible du proxy `/api/*` de `next dev` vers l'API PHP locale
(`php -S 127.0.0.1:8099 router-dev.php`). Défaut : `http://127.0.0.1:8099`.

## Production — Vercel (frontend)

Au minimum côté Vercel : `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`.
Recommandées : `IMGBB_API_KEY`, `DEEPL_API_KEY`, `RESEND_API_KEY`, `MAIL_FROM`.

```bash
bunx vercel env add DATABASE_URL production
bunx vercel env add AUTH_SECRET production
bunx vercel env add APP_URL production
```

## Production — LWS (API PHP)

Aucune variable n'est posée à la main sur le serveur : le workflow de déploiement
(`.github/workflows/deploy-lws.yml`) lit les **secrets GitHub** du dépôt, écrit
un `.env` éphémère sur le runner et génère `php-api/config.local.php`
(gitignoré, perms 600, uploadé par FTP — la seule config du serveur).

Secrets requis : `FTP_HOST` / `FTP_USER` / `FTP_PASSWORD`, `DATABASE_URL` (Aiven),
`AUTH_SECRET`, `APP_URL`, `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Optionnels :
`EDITOR_EMAIL` / `EDITOR_PASSWORD`, `RESEND_API_KEY`, `DEEPL_API_KEY`,
`IMGBB_API_KEY` — liste détaillée et rôles : [`deployment-lws.md`](deployment-lws.md) §1.2.

Ordre de résolution côté serveur (`php-api/lib/Env.php`) :
`config.local.php` → variable d'environnement → défauts intégrés.