# Déploiement Laravel sur LWS Perso

## Prérequis
- PHP 8.2+ avec extensions : pdo_pgsql, curl, mbstring, openssl, tokenizer, xml, ctype, json, bcmath, fileinfo
- Composer
- Base PostgreSQL (Aiven ou locale)

## Installation

1. Cloner le dépôt sur le serveur (ou uploader le dossier `laravel/`).
2. `cd laravel && composer install --no-dev --optimize-autoloader`
3. Copier `.env.example` → `.env` et remplir les valeurs (DB, AUTH_SECRET, etc.).
4. `php artisan key:generate`
5. `php artisan migrate` (sur une base vide) ou utiliser la base existante (tables déjà créées par Prisma).
6. `php artisan config:cache && php artisan route:cache`

## Configuration Apache (LWS)
- Le document root doit pointer vers `laravel/public/`.
- Le `.htaccess` de Laravel (dans `public/`) gère la réécriture vers `index.php`.
- mod_rewrite doit être activé (LWS le fait par défaut).

## Frontend Next.js
Le frontend statique (build `out/`) doit être copié dans `laravel/public/` :
```bash
cp -r out/* laravel/public/
```
Les routes `/api/*` sont servies par Laravel, le reste par les fichiers statiques.

## Migrations
Les tables existent déjà (créées par Prisma). Pour utiliser la base existante :
```bash
php artisan migrate --pretend  # vérifier
# puis marquer comme exécutées si nécessaire
```
Sur une base fraîche, `php artisan migrate` crée tout.

## Tests
```bash
php artisan test
```
