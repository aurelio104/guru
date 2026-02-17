#!/usr/bin/env bash
# Configura NEXT_PUBLIC_GURU_API_URL en Vercel.
# Requiere: vercel login completado, o VERCEL_TOKEN en .env.vercel
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="https://guru-aurelio104-9ad05a6a.koyeb.app"

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# Cargar token si existe (Imac Guru 4 o similar)
if [[ -f "$ROOT/.env.vercel" ]]; then
  set -a
  source "$ROOT/.env.vercel" 2>/dev/null || true
  set +a
fi

TOKEN_ARG=()
[[ -n "$VERCEL_TOKEN" ]] && TOKEN_ARG=(--token "$VERCEL_TOKEN")
SCOPE="${VERCEL_SCOPE:-aurelio104s-projects}"
ENV_OPTS=(--cwd apps/web --force --yes --scope "$SCOPE" "${TOKEN_ARG[@]}")

echo "Añadiendo NEXT_PUBLIC_GURU_API_URL=$API_URL en Vercel..."
echo ""

if ! npx vercel whoami "${TOKEN_ARG[@]}" 2>/dev/null; then
  echo "❌ Sin credenciales. Añade VERCEL_TOKEN en .env.vercel o ejecuta: npx vercel login"
  exit 1
fi

cd "$ROOT"
npx vercel link --cwd apps/web --yes --scope "$SCOPE" "${TOKEN_ARG[@]}" 2>/dev/null || true

# Añadir para production y preview
echo "$API_URL" | npx vercel env add NEXT_PUBLIC_GURU_API_URL production "${ENV_OPTS[@]}"
echo "✓ Production"

echo "$API_URL" | npx vercel env add NEXT_PUBLIC_GURU_API_URL preview "${ENV_OPTS[@]}"
echo "✓ Preview"

echo ""
echo "✅ Variable configurada. Redespliega con: npx vercel --cwd apps/web --prod"
