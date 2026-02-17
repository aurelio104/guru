#!/usr/bin/env bash
# Deploy GURU a Vercel producción.
# Usa VERCEL_TOKEN de: .env.vercel, o variable de entorno.
# Para crear token: https://vercel.com/account/tokens
# Uso: ./scripts/vercel-deploy.sh
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Cargar token si existe .env.vercel
[ -f "$ROOT/.env.vercel" ] && set -a && source "$ROOT/.env.vercel" && set +a

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN no definido."
  echo "   Opciones:"
  echo "   1. cp .env.vercel.example .env.vercel  # y añade tu token"
  echo "   2. export VERCEL_TOKEN=tu_token"
  echo "   Token: https://vercel.com/account/tokens"
  exit 1
fi

cd "$ROOT"
echo "=== Deploy GURU a Vercel producción ==="
npx vercel deploy --cwd apps/web --prod --yes --token "$VERCEL_TOKEN"
