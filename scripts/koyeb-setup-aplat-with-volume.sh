#!/usr/bin/env bash
# Configura el servicio aplat/aplat en Koyeb con:
# - Puerto 8000 (por defecto en Koyeb)
# - Volumen auth-bot1-Aplat en /data (sesión WhatsApp + WebAuthn)
#
# Requisitos: koyeb CLI instalado y koyeb login
# Uso: ./scripts/koyeb-setup-aplat-with-volume.sh

set -e
# Koyeb solo acepta nombres en minúsculas
VOLUME_NAME="auth-bot1-aplat"
SERVICE="aplat/aplat"
REGION="was"
DATA_PATH="/data"

echo "=== 1. Crear volumen $VOLUME_NAME (si no existe) ==="
if koyeb volumes create "$VOLUME_NAME" --region "$REGION" --size 1 2>/dev/null; then
  echo "Volumen $VOLUME_NAME creado."
else
  echo "Volumen $VOLUME_NAME ya existe o error (se sigue)."
fi

echo ""
echo "=== 2. Actualizar servicio $SERVICE: puerto 8000 + volumen ==="
koyeb service update "$SERVICE" \
  --env "PORT=8000" \
  --env "NODE_ENV=production" \
  --env "APLAT_WEBAUTHN_STORE_PATH=$DATA_PATH/webauthn-store.json" \
  --env "APLAT_WHATSAPP_AUTH_PATH=$DATA_PATH/whatsapp-auth" \
  --ports 8000:http \
  --routes "/:8000" \
  --checks "8000:tcp" \
  --volumes "${VOLUME_NAME}:${DATA_PATH}" \
  --regions "$REGION"

echo ""
echo "=== Listo. El servicio usará puerto 8000 y persistirá WhatsApp/WebAuthn en el volumen $VOLUME_NAME ==="
echo "Si el despliegue se queda en Starting, revisa los logs: koyeb service logs $SERVICE -t run"
