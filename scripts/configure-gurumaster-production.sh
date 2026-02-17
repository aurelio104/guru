#!/usr/bin/env bash
# Configura credenciales del master Gurumaster en Koyeb (API en producción).
# Uso: ./scripts/configure-gurumaster-production.sh
# Requiere: koyeb CLI instalado y logueado (koyeb login).
set -e

SERVICE="${KOYEB_SERVICE:-guru/guru}"
API_URL="https://guru-aurelio104-9ad05a6a.koyeb.app"

# Credenciales Gurumaster
GURU_ADMIN_EMAIL="gurumaster@guru.local"
GURU_ADMIN_PASSWORD="Maracay.1"

if ! command -v koyeb >/dev/null 2>&1; then
  echo "❌ koyeb CLI no encontrado. Instala: brew install koyeb/tap/koyeb"
  exit 1
fi

echo "Configurando master Gurumaster en servicio $SERVICE..."
echo "  Email: $GURU_ADMIN_EMAIL"
echo "  Contraseña: (configurada)"
echo ""

koyeb service update "$SERVICE" \
  --env "GURU_ADMIN_EMAIL=$GURU_ADMIN_EMAIL" \
  --env "GURU_ADMIN_PASSWORD=$GURU_ADMIN_PASSWORD"

echo ""
echo "✅ Credenciales configuradas. Koyeb redesplegará el servicio (1-2 min)."
echo ""
echo "Para iniciar sesión:"
echo "  1. Abre tu frontend en Vercel (ej. guru.vercel.app)"
echo "  2. Ve a /login"
echo "  3. Email: $GURU_ADMIN_EMAIL"
echo "  4. Contraseña: $GURU_ADMIN_PASSWORD"
echo ""
echo "Verifica que Vercel tenga NEXT_PUBLIC_GURU_API_URL=$API_URL"
echo "Health check: curl $API_URL/api/health"
