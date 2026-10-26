# Déploiement LWS (mutualisé Perso — frontend statique + API PHP)

Procédure de déploiement du site Wonder Tours sur l'hébergement **LWS formule Perso**. Cette offre n'expose ni SSH ni Node.js : le site y tourne donc sous la forme **d'un frontend statique servi par Apache + une API PHP zéro dépendance**, avec la base **PostgreSQL Aiven** distante (TLS).

**Stratégie** : `next build` produit un export statique (`out/`, config `output: "export"`) déposé dans `public_html/` ; l'API REST est servie same-origin sous `/api/*` par `php-api/` (PDO PostgreSQL, front controller + `.htaccess`, aucun Composer). Le tout est déployé par FTP (lftp) depuis GitHub Actions — **aucun build ni installation sur le serveur**.

L'hébergement Vercel historique continue de fonctionner en parallèle et reste le **repli** tant que le DNS n'est pas basculé (cf. §7).

## Vue d'ensemble de l'architecture

```
public_html/
├── .htaccess            URLs propres + sentinelle dashboard + 404 (public/.htaccess)
├── index.html, a-propos/, circuits/, blog/, …   ← export statique Next.js (out/)
├── 404.html             page not-found de l'export
├── api/                 ← php-api/ (API REST)
│   ├── .htaccess        RewriteBase /api/ → index.php (front controller)
│   ├── index.php        routeur : dispatch vers handlers/
│   ├── handlers/        AuthApi, PublicApi, DashboardApi, Crud… (39 routes)
│   ├── lib/             Db (PDO), Auth/JWT, Validator, Env, External (Resend/DeepL/imgBB)
│   └── config.local.php secrets du serveur (généré par la CI, jamais commité)
└── uploads/             médiathèque locale (si IMGBB_API_KEY absente)
```

- **Base de données** : PostgreSQL **Aiven** (`sslmode=require`) — vérifié sur l'offre réelle : `pdo_pgsql` disponible et sortie TCP vers Aiven (port 12733) ouverte (test `php-api/test-connexion.php`). Le schéma reste géré par **Prisma** (`prisma migrate deploy` en CI) ; le PHP ne fait aucune migration.
- **Sessions** : JWT HS256 dans le cookie `wt_session`, signé avec le même `AUTH_SECRET` que la stack Next/Vercel — les sessions sont interchangeables entre les deux stacks.
- **Config serveur** : `php-api/config.local.php` (perms 600, gitignoré), généré depuis les secrets GitHub à chaque déploiement et uploadé par FTP. Ordre de résolution (cf. `php-api/lib/Env.php`) : `config.local.php` → variable d'environnement → défauts intégrés.

## 1. Mise en place initiale (une seule fois)

### 1.1 PHP

Sélectionner **PHP 8.1 minimum** (8.3 recommandé — le code utilise des types de retour `never`) dans LWS Panel. Vérifications ponctuelles possibles avec `php-api/test-connexion.php` : l'uploader via le gestionnaire de fichiers, l'ouvrir dans le navigateur (affiche version PHP, `pdo_pgsql`, ping TCP et requête SQL vers Aiven), puis **le supprimer**.

### 1.2 Secrets GitHub

Dépôt GitHub → *Settings → Secrets and variables → Actions* :

| Secret | Requis | Rôle |
|--------|--------|------|
| `FTP_HOST` / `FTP_USER` / `FTP_PASSWORD` | ✅ | accès FTP LWS (identifiants LWS Panel) |
| `DATABASE_URL` | ✅ | URI Aiven (`postgresql://…?sslmode=require`) |
| `AUTH_SECRET` | ✅ | secret JWT — **le même que Vercel** (sessions compatibles) |
| `APP_URL` | ✅ | `https://wondertoursandservices.com` — base des liens emails + API fetchée au build |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | login admin (smoke de prod) |
| `EDITOR_EMAIL` / `EDITOR_PASSWORD` | ⚪ | checks éditeur du smoke |
| `RESEND_API_KEY` | ⚪ | emails transactionnels (sinon silencieusement ignorés) |
| `DEEPL_API_KEY` | ⚪ | bouton « Traduire » du dashboard (sinon `503`) |
| `IMGBB_API_KEY` | ⚪ | médiathèque distante (sinon dépôt local `uploads/`) |

Sans les secrets requis, le workflow échoue volontairement à la première étape avec la liste exacte des manquants.

### 1.3 Base de données

La base Aiven est déjà migrée et seedée (procédure : [`docs/deployment.md`](deployment.md)). Chaque déploiement rejoue `prisma migrate deploy` avant tout upload.

## 2. Déploiement automatique (GitHub Actions)

[`.github/workflows/deploy-lws.yml`](../.github/workflows/deploy-lws.yml) se déclenche :

- **automatiquement** : quand la CI est verte sur `master` (déclencheur `workflow_run`) — les runs de CI des PR ne déploient jamais ;
- **manuellement** : onglet *Actions → Deploy LWS → Run workflow*.

Ordre des étapes (l'API reste disponible pendant la mise à jour des pages) :

1. vérification des secrets (liste ci-dessus) ;
2. `prisma migrate deploy` sur Aiven — **toujours en premier** ;
3. génération de `php-api/config.local.php` depuis les secrets (`php php-api/scripts/gen-config-local.php`, perms 600) ;
4. compression idempotente des images, puis `next build` — les pages publiques fetchent l'API déployée (`APP_URL`) **au build** ; si l'API est indisponible, repli sur `lib/data/*` ;
5. upload **API d'abord** : `lftp mirror -R --delete php-api/ → public_html/api/` (exclus les outils de dev : `router-dev.php`, `test-connexion.php`, `config.example.php`, `scripts/`) ;
6. upload **frontend** : `lftp mirror -R --delete out/ → public_html/` — `--delete` retire les pages périmées (slugs renommés…) mais **préserve strictement** `/api`, `/uploads` et `/.well-known` (exclusions `-X`) ;
7. smoke de l'API en production : `SMOKE_API_ONLY=1 bash scripts/smoke-api.sh "$APP_URL"` ;
8. nettoyage des fichiers sensibles du runner (`.env`, `config.local.php`, `~/.netrc`).

Les identifiants FTP ne figurent jamais en clair : lftp lit `~/.netrc` (perms 600, `umask 077`).

> ⚠️ **Effets du smoke en production** : il crée puis supprime une réservation, une demande de contact et un compte de test ; les emails transactionnels correspondants partent réellement si `RESEND_API_KEY` est configurée.

## 3. Premier déploiement / procédure manuelle (repli FTP)

Si les secrets ne sont pas encore créés (ou pour un déploiement hors CI), la même chaîne s'exécute localement :

```bash
bun install
bun run db:deploy                      # 1. migrations Aiven
php php-api/scripts/gen-config-local.php   # 2. config.local.php depuis .env
bun scripts/compress-images.ts
bun run build                          # 3. export statique → out/ (APP_URL du .env)
cp public/.htaccess out/.htaccess

# 4. Upload (lftp) — identifiants via ~/.netrc (jamais en ligne de commande)
# printf 'machine <hôte> login <utilisateur> password <motdepasse>\n' >> ~/.netrc && chmod 600 ~/.netrc
lftp "ftp://$FTP_HOST" <<'LFTP'
set net:timeout 30
set net:max-retries 5
# NB : --parallel[=N] exige la valeur attachée (« --parallel=8 », pas « --parallel 8 »).
mirror -R --delete --parallel=8 -X router-dev.php -X test-connexion.php -X config.example.php -X scripts/ -X scripts/* php-api/ public_html/api/
mirror -R --delete --parallel=8 -X api -X api/ -X 'api/*' -X uploads -X uploads/ -X 'uploads/*' -X .well-known -X .well-known/ -X '.well-known/*' out/ public_html/
quit
LFTP

# 5. Vérification
SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://wondertoursandservices.com
```

Sans lftp : uploader le contenu de `php-api/` puis de `out/` via le gestionnaire de fichiers LWS (même structure, en respectant l'ordre API → frontend). L'**ordre importe** : l'API doit être en place avant que les pages ne la consomment, et les fichiers cachés (`.htaccess`) doivent être inclus.

## 4. Rôle des `.htaccess`

**`public_html/.htaccess`** (issu de `public/.htaccess`, exporté dans `out/`) :

- URLs propres : `/chemin` → `/chemin.html` quand le fichier existe. L'export écrit chaque route en `<chemin>.html` ; les dossiers du même nom ne contiennent que les payloads RSC `.txt` — d'où l'absence volontaire de `!-d` ;
- **sentinelle dashboard** : les pages d'édition `/dashboard/<ressource>/<uuid>` ne sont pas exportées par UUID — une seule coquille `dashboard/<res>/_.html` existe, le composant client lit l'UUID dans l'URL et charge les données via l'API. Le `.htaccess` réécrit l'URL UUID (et le payload RSC `.txt` demandé par `next/link`) vers la sentinelle ;
- `ErrorDocument 404 /404.html` ;
- `Options -Indexes`, et les requêtes `/api/*` passent au travers (aucun `/api/<chemin>.html` n'existe) vers le `.htaccess` du sous-répertoire.

**`public_html/api/.htaccess`** : `RewriteBase /api/`, refus (`[F]`) des fichiers de config/outils (`config.local.php`, `config.example.php`, `router-dev.php`, `test-connexion.php`), et toute requête qui n'est pas un fichier existant sert `index.php`.

## 5. Vérification

- **Smoke complet** : `SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://wondertoursandservices.com` — une quarantaine de vérifications : endpoints publics, écritures (contact, réservation), auth admin/éditeur, 401/403, CRUD, rôles. La purge des lignes de test utilise `psql` depuis la machine qui exécute le script (le `.env` doit donc contenir un `DATABASE_URL` joignable — Aiven l'est) ; sans lui, supprimer les lignes `Smoke Test` via la console Aiven.
- **Dashboard** : `https://wondertoursandservices.com/dashboard` → connexion admin (comptes présents dans la base Aiven).
- **Médias** : sans `IMGBB_API_KEY`, les uploads sont déposés dans `public_html/uploads/` (créé automatiquement, servi sous `/uploads/`) — **persistant** sur LWS, contrairement à Vercel.

## 6. Débogage

- **Log applicatif** : définir `debug_log` dans `php-api/config.local.php` (chemin **absolu** hors `public_html`, ex. `$home/wt-debug.log`) — vide = désactivé. À faire via une édition manuelle du fichier sur le serveur ou en régénérant la config, jamais en le commitant.
- **Erreurs Apache** : LWS Panel → logs / erreurs du domaine.
- **500 immédiate** : presque toujours `DATABASE_URL` ou `AUTH_SECRET` absents (le routeur renvoie « Configuration manquante : … »), ou extension `pdo_pgsql` désactivée — revérifier avec `test-connexion.php` (§1.1, à supprimer après usage).
- **Page 404 systématique** : vérifier que `.htaccess` a bien été uploadé (fichier caché) et que le module `mod_rewrite` est actif (par défaut chez LWS).
- **Pages publiques figées/vide** : le build fetchait l'API au moment du `next build` — relancer le déploiement (étape 4-6) après avoir vérifié que `APP_URL` est correct.

## 7. Mises à jour et retour arrière

- **Mise à jour** : merger vers `master` → CI → déploiement automatique. Une migration de schéma est appliquée par l'étape 2 **avant** l'upload du nouveau code.
- **Retour arrière** : `git revert <commit>` sur `master` → push → la CI redéploie l'état précédent. Le schéma n'étant jamais dégradé automatiquement, une migration passée reste en place (à n'annuler qu'avec une migration inverse explicite).
- **Repli plateforme** : tant que le DNS pointe vers LWS, l'instance Vercel reste déployée et fonctionnelle — y rebasculer = pointer le DNS de nouveau vers Vercel. Après la bascule définitive, le projet Vercel peut être archivé.

## 8. Bascule future vers un PostgreSQL local LWS *(documentée — pas encore requise)*

L'offre Perso expose MySQL ; la bascule vers une base locale suppose une offre LWS supérieure avec PostgreSQL. Le code ne change pas (une URI sans `sslmode` donne une connexion locale).

1. Créer la base + l'utilisateur (LWS Panel → PostgreSQL), noter l'URI locale.
2. Générer le schéma et l'importer (l'accès distant au PostgreSQL mutualisé étant bloqué, `prisma migrate deploy` ne fonctionne que pour Aiven) :
   ```bash
   bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema-lws.sql
   ```
   Import via phpPgAdmin (onglet *SQL*), puis `pg_dump` de la base Aiven importé de la même façon.
3. Basculer `DATABASE_URL` : secret GitHub (déploiements) **et** `php-api/config.local.php` régénéré (l'étape 3 de la CI s'en charge au run suivant).
4. Conserver Aiven en secours le temps de valider (retour arrière = remettre l'ancienne URI).

## 9. Domaine et SSL

- Pointer le domaine `wondertoursandservices.com` vers LWS (DNS de l'hébergeur).
- **Certificat** : LWS Panel → SSL/Let's Encrypt (AutoSSL) émet un certificat automatiquement. Le cookie `wt_session` est `Secure` en production (l'API force HTTPS quand `app_url` est en https).
- Mettre à jour si nécessaire `SITE_CONFIG.url` (`lib/constants.ts`, utilisé par le SEO et le seed) et le secret `APP_URL` — puis redéployer (rebuild : les pages publiques sont régénérées avec les bonnes URLs).

## Limites et notes

- Les pages publiques sont **statiques** : un changement de contenu (nouvel article, circuit modifié) n'apparaît qu'après un redéploiement (build). Le dashboard, lui, est always-fresh via l'API.
- `lftp mirror --delete` ne touche jamais `/api`, `/uploads` ni `/.well-known` (exclusions) — ne pas retirer ces `-X` sous peine de perdre la config serveur ou les médias.
- `config.local.php` est la seule source des secrets serveur ; il est régénéré à chaque déploiement depuis les secrets GitHub (jamais versionné).
- Les variables GitHub ne sont jamais versionnées — ce document est la seule référence des secrets attendus (cf. README « Variables d'environnement »).
