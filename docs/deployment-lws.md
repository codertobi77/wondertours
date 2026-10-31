# Déploiement — API PHP sur LWS Perso

Procédure de déploiement de l'**API PHP** (`php-api/`) sur l'hébergement
**LWS formule Perso**, sous le sous-domaine `https://api.wondertoursandservices.com`.

Le frontend Next.js est déployé séparément sur **Vercel**
(`https://wondertoursandservices.com`, cf. [`docs/deployment.md`](deployment.md)).
La base de données est PostgreSQL **Aiven** distante (TLS).

**Stratégie** : l'API PHP (zéro dépendance, PDO PostgreSQL) est déployée par FTP
(lftp) depuis GitHub Actions dans `public_html/api/` sur LWS. Aucune installation
ni build n'est requis sur le serveur. Les migrations Prisma sont appliquées sur
Aiven avant chaque déploiement.

```
htdocs/api.wondertoursandservices.com/
├── .htaccess            (URLs propres, 404 — document root du sous-domaine)
├── api/                 ← php-api/ (API REST)
│   ├── .htaccess        RewriteBase /api/ → index.php (front controller)
│   ├── index.php        routeur : dispatch vers handlers/
│   ├── handlers/        AuthApi, PublicApi, DashboardApi, Crud… (39 routes)
│   ├── lib/             Db (PDO), Auth/JWT, Validator, Env, External (Resend/DeepL/imgBB)
│   └── config.local.php secrets du serveur (généré par la CI, jamais commité)
└── uploads/             médiathèque locale (fallback si IMGBB_API_KEY absente)
```

- **Base de données** : PostgreSQL **Aiven** (`sslmode=require`) — vérifié sur
  l'offre réelle : `pdo_pgsql` disponible et sortie TCP vers Aiven (port 12733)
  ouverte (test `php-api/test-connexion.php`). Le schéma reste géré par **Prisma**
  (`prisma migrate deploy` en CI) ; le PHP ne fait aucune migration.
- **Sessions** : JWT HS256 dans le cookie `wt_session`, signé avec le même
  `AUTH_SECRET` que le frontend Vercel — les sessions sont compatibles entre
  les deux stacks (proxy Vercel → même origine côté navigateur).
- **Config serveur** : `php-api/config.local.php` (perms 600, gitignoré),
  généré depuis les secrets GitHub à chaque déploiement et uploadé par FTP.

## 1. Mise en place initiale (une seule fois)

### 1.1 PHP

Sélectionner **PHP 8.1 minimum** (8.3 recommandé — le code utilise des types
de retour `never`) dans LWS Panel. Vérifications ponctuelles possibles avec
`php-api/test-connexion.php` : l'uploader via le gestionnaire de fichiers,
l'ouvrir dans le navigateur (affiche version PHP, `pdo_pgsql`, ping TCP et
requête SQL vers Aiven), puis **le supprimer**.

### 1.2 Secrets GitHub

Dépôt GitHub → *Settings → Secrets and variables → Actions* :

| Secret | Requis | Rôle |
|--------|--------|------|
| `FTP_HOST` / `FTP_USER` / `FTP_PASSWORD` | ✅ | accès FTP LWS (identifiants LWS Panel) |
| `DATABASE_URL` | ✅ | URI Aiven (`postgresql://…?sslmode=require`) |
| `AUTH_SECRET` | ✅ | secret JWT — **le même que Vercel** (sessions compatibles) |
| `APP_URL` | ✅ | `https://wondertoursandservices.com` — base des liens emails |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | login admin (smoke + login) |
| `EDITOR_EMAIL` / `EDITOR_PASSWORD` | ⚪ | checks éditeur du smoke |
| `RESEND_API_KEY` | ⚪ | emails transactionnels (sinon silencieusement ignorés) |
| `DEEPL_API_KEY` | ⚪ | bouton « Traduire » du dashboard (sinon `503`) |
| `IMGBB_API_KEY` | ⚪ | médiathèque distante (sinon dépôt local `uploads/`) |

Sans les secrets requis, le workflow échoue volontairement à la première étape
avec la liste exacte des manquants.

### 1.3 Base de données

La base Aiven est déjà migrée et seedée (procédure : [`docs/deployment.md`](deployment.md)).
Chaque déploiement rejoue `prisma migrate deploy` avant tout upload.

## 2. Déploiement automatique (GitHub Actions)

`.github/workflows/deploy-lws.yml` se déclenche :

- **automatiquement** : quand la CI est verte sur `master` (déclencheur
  `workflow_run`) — les runs de CI des PR ne déploient jamais ;
- **manuellement** : onglet *Actions → Deploy PHP API LWS → Run workflow*.

Ordre des étapes :

1. vérification des secrets (liste ci-dessus) ;
2. `prisma migrate deploy` sur Aiven — **toujours en premier** ;
3. génération de `php-api/config.local.php` depuis les secrets
   (`php php-api/scripts/gen-config-local.php`, perms 600) ;
4. upload **API** : `lftp mirror -R --delete php-api/ → htdocs/api.wondertoursandservices.com/api/`
   (exclus les outils de dev : `router-dev.php`, `test-connexion.php`,
   `config.example.php`, `scripts/`) ;
5. smoke de l'API en production : `SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://api.wondertoursandservices.com` ;
6. nettoyage des fichiers sensibles du runner (`.env`, `config.local.php`,
   `~/.netrc`).

Les identifiants FTP ne figurent jamais en clair : lftp lit `~/.netrc` (perms
600, `umask 077`).

## 3. Premier déploiement / procédure manuelle (repli FTP)

Si les secrets ne sont pas encore créés (ou pour un déploiement hors CI), la
même chaîne s'exécute localement :

```bash
bun install
bun run db:deploy                      # 1. migrations Aiven
php php-api/scripts/gen-config-local.php   # 2. config.local.php depuis .env
# 3. Upload (lftp) — identifiants via ~/.netrc (jamais en ligne de commande)
lftp "ftp://$FTP_HOST" <<'LFTP'
set net:timeout 45
set net:max-retries 5
set ftp:ssl-allow true
set ssl:verify-certificate no
set ftp:ignore-pasv-address yes
debug 3
mirror -R --delete --parallel=2 --verbose=2 -X router-dev.php -X test-connexion.php -X config.example.php -X scripts/ -X scripts/* php-api/ htdocs/api.wondertoursandservices.com/api/
quit
LFTP

# 4. Vérification
SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://api.wondertoursandservices.com
```

Sans lftp : uploader le contenu de `php-api/` via le gestionnaire de fichiers
LWS (même structure, sous `public_html/api/`).

## 4. Rôle des `.htaccess`

**`public_html/api/.htaccess`** (issu de `php-api/.htaccess`) :

- `RewriteBase /api/`, refus (`[F]`) des fichiers de config/outils
  (`config.local.php`, `config.example.php`, `router-dev.php`, `test-connexion.php`),
  et toute requête qui n'est pas un fichier existant sert `index.php`.

## 5. Vérification

- **Smoke complet** : `SMOKE_API_ONLY=1 bash scripts/smoke-api.sh https://api.wondertoursandservices.com` — une quarantaine de vérifications : endpoints publics, écritures (contact, réservation), auth admin/éditeur, 401/403, CRUD, rôles. La purge des lignes de test utilise `psql` depuis la machine qui exécute le script (le `.env` doit donc contenir un `DATABASE_URL` joignable — Aiven l'est).
- **Frontend** : `https://wondertoursandservices.com` (Vercel) — le proxy `/api/*` redirige vers l'API LWS.

## 6. Mises à jour et retour arrière

- **Mise à jour** : merger vers `master` → CI → déploiement automatique. Une
  migration de schéma est appliquée par l'étape 2 **avant** l'upload du nouveau code.
- **Retour arrière** : `git revert <commit>` sur `master` → push → la CI
  redéploie l'état précédent. Le schéma n'étant jamais dégradé automatiquement,
  une migration passée reste en place (à n'annuler qu'avec une migration inverse
  explicite).

## 7. Domaine et SSL

- Pointer le domaine `wondertoursandservices.com` vers Vercel (DNS ou CNAME).
- Créer le sous-domaine `api.wondertoursandservices.com` vers LWS (DNS A ou CNAME).
- **Certificats** : Vercel gère automatiquement le SSL pour le domaine principal.
  LWS Panel → SSL/Let's Encrypt (AutoSSL) émet un certificat pour le sous-domaine `api.`
- Le cookie `wt_session` est `Secure` en production (`app_url` en https).
- `sameSite=lax` : les requêtes API passent par le proxy Vercel (même origine
  côté navigateur) — le cookie est envoyé avec chaque requête.