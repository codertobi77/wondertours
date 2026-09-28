#!/usr/bin/env bash
# Empaquetage de l'application pour déploiement LWS (cPanel mutualisé / Passenger).
#
# Produit dist-lws/wondertours-standalone-<rev>-<date>.tar.gz : un bundle
# `output: "standalone"` autonome (node_modules inclus) à extraire dans le
# répertoire de l'application cPanel. Aucun `npm install` n'est nécessaire
# sur le serveur, ce qui évite les limites CPU/RAM du mutualisé.
# Procédure complète : docs/deployment-lws.md
#
# Usage :
#   bash scripts/package-lws.sh          # build + archive
#   bash scripts/package-lws.sh --smoke  # en plus : démarre le bundle en local
#                                       # et vérifie /a-propos + /api/circuits
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
STANDALONE="$ROOT_DIR/.next/standalone"
DIST_DIR="$ROOT_DIR/dist-lws"
SMOKE_PORT=3999

SMOKE=0
[ "${1:-}" = "--smoke" ] && SMOKE=1

cd "$ROOT_DIR"

echo "── 1/6 Génération du client Prisma ──"
bun run db:generate

echo "── 2/6 Build Next.js (output: standalone) ──"
bun run build

if [ ! -f "$STANDALONE/server.js" ]; then
  echo "❌ $STANDALONE/server.js introuvable — vérifier output: \"standalone\" dans next.config.ts" >&2
  exit 1
fi

echo "── 3/6 Copie des assets statiques (public + .next/static) ──"
rm -rf "$STANDALONE/public" "$STANDALONE/.next/static"
cp -r "$ROOT_DIR/public" "$STANDALONE/public"
cp -r "$ROOT_DIR/.next/static" "$STANDALONE/.next/static"

echo "── 4/6 Purge des fichiers .env* du bundle ──"
# Les secrets vivent dans les variables d'environnement cPanel, jamais dans
# l'archive. Le server.js autonome ne lit de toute façon pas les .env.
find "$STANDALONE" -name ".env*" -type f -print -delete

echo "── 5/6 Smoke test local du bundle ──"
if [ "$SMOKE" = 1 ]; then
  # Le bundle autonome ne charge pas les .env : on exporte ceux du projet
  # pour la connexion à la base le temps du test. En production, cPanel
  # fournit les variables (voir docs/deployment-lws.md).
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a

  PORT="$SMOKE_PORT" HOSTNAME=127.0.0.1 node "$STANDALONE/server.js" &
  SMOKE_PID=$!
  trap 'kill "$SMOKE_PID" 2>/dev/null || true' EXIT

  READY=0
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "http://127.0.0.1:$SMOKE_PORT/api/circuits"; then
      READY=1
      break
    fi
    sleep 1
  done
  if [ "$READY" != 1 ]; then
    echo "❌ Le bundle standalone n'a pas répondu sur http://127.0.0.1:$SMOKE_PORT" >&2
    exit 1
  fi

  for path in /a-propos /api/circuits; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$SMOKE_PORT$path")
    if [ "$code" = 200 ]; then
      echo "✓ $path → 200"
    else
      echo "❌ $path → $code (attendu 200)" >&2
      exit 1
    fi
  done

  kill "$SMOKE_PID" 2>/dev/null || true
  wait "$SMOKE_PID" 2>/dev/null || true
  trap - EXIT
else
  echo "   (ignoré — relancer avec --smoke pour tester le bundle avant upload)"
fi

echo "── 6/6 Création de l'archive ──"
mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR"/wondertours-standalone-*.tar.gz
GIT_REF="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo norev)"
ARCHIVE="$DIST_DIR/wondertours-standalone-$GIT_REF-$(date +%Y%m%d-%H%M).tar.gz"
tar -czf "$ARCHIVE" -C "$STANDALONE" .

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo ""
echo "✅ Bundle prêt : $ARCHIVE ($SIZE)"
echo "   À extraire à la racine du répertoire de l'application cPanel"
echo "   (startup file : server.js) — procédure : docs/deployment-lws.md"
