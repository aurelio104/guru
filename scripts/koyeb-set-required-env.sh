#!/usr/bin/env bash
# Configura GURU_JWT_SECRET y GURU_ADMIN_PASSWORD en el servicio guru-api/api vía Koyeb CLI.
# Uso: ./scripts/koyeb-set-required-env.sh
#      o: GURU_ADMIN_PASSWORD='tu-contraseña' ./scripts/koyeb-set-required-env.sh
# Requiere: koyeb CLI instalado y logueado (koyeb login).
set -e
SERVICE="${KOYEB_SERVICE:-guru-api/api}"

if ! command -v koyeb >/dev/null 2>&1; then
  echo "❌ koyeb CLI no encontrado. Instala: brew install koyeb/tap/koyeb"
  exit 1
fi

# Generar JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo "✓ GURU_JWT_SECRET generado"

# Contraseña admin: variable de entorno o generar una
if [[ -n "${GURU_ADMIN_PASSWORD}" ]]; then
  ADMIN_PASS="${GURU_ADMIN_PASSWORD}"
  echo "✓ Usando GURU_ADMIN_PASSWORD de la variable de entorno"
else
  ADMIN_PASS=$(openssl rand -base64 18 | tr -d /=+ | head -c 16)
  echo "✓ GURU_ADMIN_PASSWORD generada (guárdala para el login): $ADMIN_PASS"
fi

echo ""
echo "Actualizando servicio $SERVICE en Koyeb..."
koyeb service update "$SERVICE" \
  --env "GURU_JWT_SECRET=$JWT_SECRET" \
  --env "GURU_ADMIN_PASSWORD=$ADMIN_PASS"

echo ""
echo "✅ Variables configuradas. Koyeb redesplegará el servicio."
echo "   Si no usaste GURU_ADMIN_PASSWORD de entorno, la contraseña de admin es la mostrada arriba."
echo "   Health: curl https://guru-api-aurelio104-5877962a.koyeb.app/api/health"
