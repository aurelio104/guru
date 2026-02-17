#!/usr/bin/env bash
# Elimina el despliegue Guru actual y crea uno nuevo desde cero (repo Guru).
# Configuración idéntica; fresh start para corregir webhook/auto-redeploy.
#
# Uso: ./scripts/koyeb-recreate-guru.sh
# Requiere: koyeb login
#
# IMPORTANTE: Se crean volúmenes nuevos (guru-api-data-v2, auth-bot1-guru-v2).
# Los datos previos (DB, sesión WhatsApp) se pierden.
set -e

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

APP_NAME="guru"
SERVICE_NAME="guru"
REPO="github.com/aurelio104/Guru"
BRANCH="main"
DOCKERFILE="Dockerfile.api"
REGION="was"
PORT="3001"
API_URL="https://guru-aurelio104-8e2f096a.koyeb.app"

# Credenciales Gurumaster
GURU_ADMIN_EMAIL="gurumaster@guru.local"
GURU_ADMIN_PASSWORD="Maracay.1"

# Generar JWT secret (nuevo por seguridad)
GURU_JWT_SECRET=$(openssl rand -hex 32)

if ! command -v koyeb >/dev/null 2>&1; then
  echo "❌ koyeb CLI no encontrado. Instala: brew install koyeb/tap/koyeb"
  exit 1
fi

echo "=== Recrear despliegue Guru en Koyeb ==="
echo ""
echo "1. Eliminar app guru existente..."
koyeb app delete "$APP_NAME" 2>/dev/null || { echo "   (app no existía o ya eliminada)"; }
echo "   ✓ Hecho"
echo ""

# Koyeb no permite reutilizar volúmenes que estuvieron en otro servicio.
# Crear volúmenes nuevos (se perderán datos previos: DB, sesión WhatsApp).
echo "2. Crear volúmenes nuevos..."
koyeb volume create guru-api-data-v2 --region "$REGION" --size 1 2>/dev/null || true
koyeb volume create auth-bot1-guru-v2 --region "$REGION" --size 1 2>/dev/null || true
echo "   ✓ Hecho"
echo ""

echo "3. Crear app y servicio nuevo (repo Guru)..."
koyeb apps init "$APP_NAME" \
  --git "$REPO" \
  --git-branch "$BRANCH" \
  --git-builder docker \
  --git-docker-dockerfile "$DOCKERFILE" \
  --ports "${PORT}:http" \
  --routes "/:${PORT}" \
  --instance-type nano \
  --regions "$REGION" \
  --checks "${PORT}:tcp" \
  --env "PORT=$PORT" \
  --env "NODE_ENV=production" \
  --env "GURU_JWT_SECRET=$GURU_JWT_SECRET" \
  --env "GURU_ADMIN_EMAIL=$GURU_ADMIN_EMAIL" \
  --env "GURU_ADMIN_PASSWORD=$GURU_ADMIN_PASSWORD" \
  --env "GURU_WEBAUTHN_RP_ID=guru.vercel.app" \
  --env "GURU_WEBAUTHN_STORE_PATH=/data/webauthn-store.json" \
  --env "GURU_WHATSAPP_AUTH_PATH=/whatsapp-auth" \
  --env "CORS_ORIGIN=https://guru.vercel.app" \
  --volumes guru-api-data-v2:/data \
  --volumes auth-bot1-guru-v2:/whatsapp-auth

echo ""
echo "✅ Despliegue creado. Koyeb asignará un dominio (puede variar si el anterior estaba en uso)."
echo ""
echo "4. Verificar dominio asignado:"
echo "   koyeb app get $APP_NAME -o yaml"
echo ""
echo "5. Login:"
echo "   Email: $GURU_ADMIN_EMAIL"
echo "   Contraseña: $GURU_ADMIN_PASSWORD"
echo ""
echo "6. Health: curl $API_URL/api/health"
echo "   (La URL puede cambiar; verifica en Koyeb Dashboard)"
echo ""
echo "7. Actualizar NEXT_PUBLIC_GURU_API_URL en Vercel si el dominio cambió."
echo ""
