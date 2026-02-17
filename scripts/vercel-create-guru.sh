#!/usr/bin/env bash
# Crea y despliega el proyecto GURU en Vercel.
# Requiere: vercel login ejecutado previamente.
# Uso: ./scripts/vercel-create-guru.sh
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== 1. Verificar Vercel ==="
if ! npx vercel whoami 2>/dev/null; then
  echo "❌ Ejecuta primero: vercel login"
  exit 1
fi

echo ""
echo "=== 2. Crear proyecto guru (si no existe) y desplegar ==="
cd "$ROOT"

# Link puede fallar si ya está vinculado
npx vercel link --cwd apps/web --yes 2>/dev/null || true

echo ""
echo "=== 3. Deploy a producción ==="
npx vercel --cwd apps/web --prod --yes

echo ""
echo "✅ Hecho. Revisa la URL en la salida anterior (guru.vercel.app o similar)."
echo "   Configura NEXT_PUBLIC_GURU_API_URL en Vercel Dashboard si no lo has hecho:"
echo "   https://guru-aurelio104-8e2f096a.koyeb.app"
