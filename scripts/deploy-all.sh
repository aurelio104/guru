#!/usr/bin/env bash
# Despliega GURU: frontend en Vercel, API ya en Koyeb (Git push + redeploy)
# Uso: ./scripts/deploy-all.sh
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "=== 1. Verificar Vercel ==="
if ! npx vercel whoami 2>/dev/null; then
  echo "⚠️  Vercel: ejecuta 'vercel login' para autenticarte."
  echo "   Luego: cd apps/web && npx vercel --prod"
  exit 1
fi

echo ""
echo "=== 2. Desplegar frontend (Vercel) ==="
cd "$(dirname "$0")/.."
(cd apps/web && npx vercel --prod --yes) || { echo "Error deploy Vercel"; exit 1; }

echo ""
echo "=== 3. API en Koyeb (ya desplegada vía Git) ==="
echo "   Redeploy si necesitas forzar: koyeb service redeploy guru/guru"
koyeb services list | grep -E "guru" || true

echo ""
echo "=== 4. Verificación ==="
echo "   Frontend: https://guru.vercel.app"
echo "   API:      https://guru-aurelio104-8e2f096a.koyeb.app/api/health"
