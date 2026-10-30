#!/usr/bin/env bash
# Préparer la structure de déploiement LWS :
#   - le contenu de laravel/public/ → racine du document root (index.php, .htaccess, build/, images…)
#   - le reste de laravel/ (sauf public/) → laravel-app/ (hors web)
#   - index.php de racine pointe vers laravel-app/bootstrap/app.php
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LARAVEL="$ROOT/laravel"
DEPLOY="$ROOT/.deploy-root"

echo "🧹 Nettoyage du dossier de déploiement…"
rm -rf "$DEPLOY"
mkdir -p "$DEPLOY/laravel-app"

echo "📦 Copie des assets publics (public/) à la racine…"
# Tout le contenu de public/ sauf le .gitkeep s'il existe
cp -a "$LARAVEL/public/." "$DEPLOY/"

echo "📦 Copie du cœur de l'application dans laravel-app/…"
# Tout le contenu de laravel/ sauf public/, node_modules, vendor, .git, tests, .env, bootstrap/cache
cd "$LARAVEL"
for item in * .*; do
  case "$item" in
    .|..|public|node_modules|vendor|.git|tests|.env|bootstrap/cache|.deploy-root) continue ;;
  esac
  if [ -e "$item" ]; then
    cp -a "$item" "$DEPLOY/laravel-app/"
  fi
done

echo "🔧 Adaptation de index.php pour le document root racine…"
cat > "$DEPLOY/index.php" <<'PHP'
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/laravel-app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/laravel-app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/laravel-app/bootstrap/app.php')
    ->handleRequest(Request::capture());
PHP

echo "🔧 Suppression du .env s'il a été copié par erreur…"
rm -f "$DEPLOY/.env" "$DEPLOY/laravel-app/.env"

echo "✅ Dossier de déploiement prêt : $DEPLOY"
echo "   Contenu à la racine : $(ls -1 "$DEPLOY" | grep -v '^laravel-app$' | tr '\n' ' ')"
echo "   Sous-dossier app : laravel-app/"
