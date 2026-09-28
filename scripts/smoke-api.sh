#!/usr/bin/env bash
# Smoke test de l'API Wonder Tours.
# Usage : ./scripts/smoke-api.sh [BASE_URL]
# Nécessite un serveur démarré (bun run dev) et une base seedée (bun run db:seed).
# Crée une demande de contact et une réservation puis les supprime de la base
# via psql (DATABASE_URL lu dans .env).

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PASS=0
FAIL=0
BOOKING_ID=""
CONTACT_ID=""
SMOKE_USER_EMAIL=""
ADMIN_JAR="$(mktemp)"
EDITOR_JAR="$(mktemp)"
LOGOUT_JAR="$(mktemp)"

# ───────────────────────── Helpers ─────────────────────────

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS + 1))
    printf "✓ %s\n" "$label"
  else
    FAIL=$((FAIL + 1))
    printf "✗ %s (attendu %s, obtenu %s)\n" "$label" "$expected" "$actual" >&2
  fi
}

# check_json <label> <expected> <json> <champ python>
check_json() {
  local label="$1" expected="$2" json="$3" expr="$4"
  local actual
  actual=$(echo "$json" | python3 -c "import json,sys; d=json.load(sys.stdin); print($expr)" 2>/dev/null || echo "PARSE_ERROR")
  check "$label" "$expected" "$actual"
}

cleanup() {
  set +e
  if [ -n "$BOOKING_ID" ] || [ -n "$CONTACT_ID" ] || [ -n "$SMOKE_USER_EMAIL" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2-)
    if [ -n "$DB_URL" ]; then
      [ -n "$BOOKING_ID" ] && psql "${DB_URL%%\?*}" -q -c "DELETE FROM bookings WHERE id='$BOOKING_ID';" >/dev/null 2>&1
      [ -n "$CONTACT_ID" ] && psql "${DB_URL%%\?*}" -q -c "DELETE FROM contact_requests WHERE id='$CONTACT_ID';" >/dev/null 2>&1
      [ -n "$SMOKE_USER_EMAIL" ] && psql "${DB_URL%%\?*}" -q -c "DELETE FROM users WHERE email='$SMOKE_USER_EMAIL';" >/dev/null 2>&1
    fi
  fi
  rm -f "$ADMIN_JAR" "$EDITOR_JAR" "$LOGOUT_JAR"
  set -e
}
trap cleanup EXIT

echo "── Smoke API sur $BASE_URL ──"

# ───────────────────── Endpoints publics ─────────────────────

check "GET /api/circuits" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits")"
check "GET /api/circuits?featured=true" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits?featured=true")"
check "GET /api/circuits/maxPrice invalide" 400 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits?maxPrice=abc")"

CIRCUIT_SLUG=$(curl -s "$BASE_URL/api/circuits?pageSize=1" | python3 -c "import json,sys; print(json.load(sys.stdin)['items'][0]['slug'])")
check "GET /api/circuits/[slug]" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits/$CIRCUIT_SLUG")"
check "GET /api/circuits/[slug] inexistant" 404 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits/slug-inexistant-xyz")"

check "GET /api/destinations" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/destinations")"
DEST_SLUG=$(curl -s "$BASE_URL/api/destinations" | python3 -c "import json,sys; print(json.load(sys.stdin)['items'][0]['slug'])")
check "GET /api/circuits?destination" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/circuits?destination=$DEST_SLUG")"
check "GET /api/categories" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/categories")"
check "GET /api/services" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/services")"
check "GET /api/testimonials" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/testimonials")"
check "GET /api/blog" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/blog")"
BLOG_SLUG=$(curl -s "$BASE_URL/api/blog?pageSize=1" | python3 -c "import json,sys; print(json.load(sys.stdin)['items'][0]['slug'])")
check "GET /api/blog/[slug]" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/blog/$BLOG_SLUG")"

# ───────────────────── Écritures publiques ─────────────────────

CONTACT_JSON=$(curl -s -X POST "$BASE_URL/api/contact" -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test","email":"smoke@example.com","requestType":"sejour","travelers":2,"message":"Message de test smoke suffisamment long."}')
check "POST /api/contact" "Demande envoyée avec succès" "$(echo "$CONTACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['message'])")"
CONTACT_ID=$(echo "$CONTACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

check "POST /api/contact invalide" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/contact" -H "Content-Type: application/json" -d '{"name":"X","email":"pas-un-email","message":"court"}')"

CIRCUIT_ID=$(curl -s "$BASE_URL/api/circuits?pageSize=1" | python3 -c "import json,sys; print(json.load(sys.stdin)['items'][0]['id'])")
BOOKING_JSON=$(curl -s -X POST "$BASE_URL/api/bookings" -H "Content-Type: application/json" \
  -d "{\"circuitId\":\"$CIRCUIT_ID\",\"type\":\"circuit\",\"name\":\"Smoke Test\",\"email\":\"smoke@example.com\",\"participants\":2}")
BOOKING_ID=$(echo "$BOOKING_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
if [ -n "$BOOKING_ID" ]; then
  check "POST /api/bookings" 1 1
  check_json "  référence WT-XXXXXX" "True" "$BOOKING_JSON" "bool(__import__('re').match(r'^WT-[A-Z0-9]{6}$', d['bookingReference']))"
else
  check "POST /api/bookings" 1 0
fi
check "POST /api/bookings circuit inconnu" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/bookings" -H "Content-Type: application/json" -d '{"circuitId":"00000000-0000-0000-0000-000000000000","name":"X Test","email":"x@example.com"}')"

# ───────────────────── Authentification ─────────────────────
# Comptes créés par le seed (bun run db:seed) depuis le .env.
ADMIN_EMAIL=$(grep -E '^ADMIN_EMAIL=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2-)
ADMIN_PASSWORD=$(grep -E '^ADMIN_PASSWORD=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2-)
EDITOR_EMAIL=$(grep -E '^EDITOR_EMAIL=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2-)
EDITOR_PASSWORD=$(grep -E '^EDITOR_PASSWORD=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2-)

check "GET /dashboard sans session → redirection login" 307 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/dashboard")"
check "GET /api/dashboard/users sans session" 401 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/dashboard/users")"
check "POST /api/auth/login mauvais mot de passe" 401 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"mauvais\"}")"

LOGIN_JSON=$(curl -s -c "$ADMIN_JAR" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
check_json "POST /api/auth/login (admin)" "admin" "$LOGIN_JSON" "d['user']['role']"

# Mot de passe oublié : réponse 200 générique (anti-énumération),
# token invalide refusé, pages publiques accessibles sans session.
FORGOT_JSON=$(curl -s -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" -d '{"email":"inconnu-smoke@wondertours.bj"}')
check "POST /api/auth/forgot-password (email inconnu) → 200 générique" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" -d '{"email":"inconnu-smoke@wondertours.bj"}')"
check_json "  message anti-énumération" "Si un compte actif existe avec cet email, un lien de réinitialisation vient d'être envoyé." "$FORGOT_JSON" "d['message']"
check "POST /api/auth/forgot-password (admin, email réel) → 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\"}")"
check "POST /api/auth/reset-password token invalide → 400" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/reset-password" -H "Content-Type: application/json" -d '{"token":"0000000000000000000000000000000000000000000000000000000000000000","password":"motdepasse123"}')"
check "POST /api/auth/reset-password mot de passe trop court → 400" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/reset-password" -H "Content-Type: application/json" -d '{"token":"0000000000000000000000000000000000000000000000000000000000000000","password":"court"}')"
check "GET /dashboard/forgot-password sans session" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/dashboard/forgot-password")"
check "GET /dashboard/reset-password sans session" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/dashboard/reset-password?token=abc")"

# ───────────────────── Endpoints dashboard (session admin) ─────────────────────

for path in circuits destinations categories testimonials services blog blog-categories bookings contact-requests settings stats media users; do
  check "GET /api/dashboard/$path (admin)" 200 "$(curl -s -b "$ADMIN_JAR" -o /dev/null -w '%{http_code}' "$BASE_URL/api/dashboard/$path")"
done

if [ -n "$BOOKING_ID" ]; then
  check "PATCH /api/dashboard/bookings/[id]/status" 200 "$(curl -s -b "$ADMIN_JAR" -o /dev/null -w '%{http_code}' -X PATCH "$BASE_URL/api/dashboard/bookings/$BOOKING_ID/status" -H "Content-Type: application/json" -d '{"status":"confirmed"}')"
fi
if [ -n "$CONTACT_ID" ]; then
  check "PATCH /api/dashboard/contact-requests/[id]/status" 200 "$(curl -s -b "$ADMIN_JAR" -o /dev/null -w '%{http_code}' -X PATCH "$BASE_URL/api/dashboard/contact-requests/$CONTACT_ID/status" -H "Content-Type: application/json" -d '{"status":"answered"}')"
fi

# ───────────────────── Rôles : éditeur vs admin ─────────────────────

if [ -n "$EDITOR_EMAIL" ] && [ -n "$EDITOR_PASSWORD" ]; then
  EDITOR_LOGIN_JSON=$(curl -s -c "$EDITOR_JAR" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_PASSWORD\"}")
  check_json "POST /api/auth/login (éditeur)" "editor" "$EDITOR_LOGIN_JSON" "d['user']['role']"

  check "GET /api/dashboard/circuits (éditeur)" 200 "$(curl -s -b "$EDITOR_JAR" -o /dev/null -w '%{http_code}' "$BASE_URL/api/dashboard/circuits")"
  check "GET /api/dashboard/users (éditeur) → 403" 403 "$(curl -s -b "$EDITOR_JAR" -o /dev/null -w '%{http_code}' "$BASE_URL/api/dashboard/users")"
  check "GET /dashboard/users (éditeur) → redirection" 307 "$(curl -s -b "$EDITOR_JAR" -o /dev/null -w '%{http_code}' "$BASE_URL/dashboard/users")"
else
  echo "⚠ EDITOR_EMAIL/EDITOR_PASSWORD absents du .env : checks éditeur ignorés" >&2
fi

# L'admin crée un compte d'un autre rôle, le modifie puis le supprime.
SMOKE_USER_EMAIL="smoke-$(date +%s)@wondertours.bj"
USER_JSON=$(curl -s -b "$ADMIN_JAR" -X POST "$BASE_URL/api/dashboard/users" -H "Content-Type: application/json" \
  -d "{\"email\":\"$SMOKE_USER_EMAIL\",\"password\":\"motdepasse123\",\"firstName\":\"Smoke\",\"lastName\":\"Test\",\"role\":\"viewer\"}")
check_json "POST /api/dashboard/users (admin crée un lecteur)" "viewer" "$USER_JSON" "d['role']"
USER_ID=$(echo "$USER_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
if [ -n "$USER_ID" ]; then
  check "PATCH /api/dashboard/users/[id] (changement de rôle)" 200 "$(curl -s -b "$ADMIN_JAR" -o /dev/null -w '%{http_code}' -X PATCH "$BASE_URL/api/dashboard/users/$USER_ID" -H "Content-Type: application/json" -d '{"role":"editor"}')"
  check "DELETE /api/dashboard/users/[id]" 200 "$(curl -s -b "$ADMIN_JAR" -o /dev/null -w '%{http_code}' -X DELETE "$BASE_URL/api/dashboard/users/$USER_ID")"
else
  check "POST /api/dashboard/users → id récupéré" 1 0
fi

# Déconnexion : le cookie est invalidé côté serveur.
curl -s -c "$LOGOUT_JAR" -o /dev/null -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
check "POST /api/auth/logout" 200 "$(curl -s -b "$LOGOUT_JAR" -c "$LOGOUT_JAR" -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/logout")"
check "GET /api/dashboard/users après logout" 401 "$(curl -s -b "$LOGOUT_JAR" -o /dev/null -w '%{http_code}' "$BASE_URL/api/dashboard/users")"

# ───────────────────── Bilan ─────────────────────

echo ""
if [ "$FAIL" -eq 0 ]; then
  printf "✅ %d vérifications OK, 0 échec\n" "$PASS"
  exit 0
else
  printf "❌ %d OK, %d échec(s)\n" "$PASS" "$FAIL" >&2
  exit 1
fi
