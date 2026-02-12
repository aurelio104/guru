#!/bin/bash
# Pruebas de seguridad de APlat API
# Uso: ./scripts/test-security.sh [API_URL]
# Ejemplo: ./scripts/test-security.sh http://localhost:3001

set -e

API_URL="${1:-http://localhost:3001}"
echo "🔒 Probando seguridad de APlat API en: $API_URL"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Health check
echo "1️⃣  Health check..."
HEALTH=$(curl -s "$API_URL/api/health" | jq -r '.ok')
if [ "$HEALTH" = "true" ]; then
  pass "API funcionando correctamente"
else
  fail "API no responde correctamente"
fi
echo ""

# 2. Headers de seguridad
echo "2️⃣  Headers de seguridad (Helmet)..."
HEADERS=$(curl -sI "$API_URL/api/health")

if echo "$HEADERS" | grep -q "strict-transport-security"; then
  pass "HSTS habilitado"
else
  warn "HSTS no encontrado"
fi

if echo "$HEADERS" | grep -q "x-frame-options"; then
  pass "X-Frame-Options presente"
else
  warn "X-Frame-Options no encontrado"
fi

if echo "$HEADERS" | grep -q "x-content-type-options"; then
  pass "X-Content-Type-Options presente"
else
  warn "X-Content-Type-Options no encontrado"
fi

if echo "$HEADERS" | grep -q "content-security-policy"; then
  pass "Content-Security-Policy presente"
else
  warn "Content-Security-Policy no encontrado"
fi
echo ""

# 3. Rate limiting
echo "3️⃣  Rate limiting (fuerza bruta)..."
RATE_LIMIT_ERRORS=0
for i in {1..110}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@rate.com","password":"wrong"}')
  
  if [ "$STATUS" = "429" ]; then
    pass "Rate limit activado tras $i intentos (status 429)"
    RATE_LIMIT_ERRORS=1
    break
  fi
done

if [ $RATE_LIMIT_ERRORS -eq 0 ]; then
  warn "Rate limit no se activó tras 110 intentos (puede necesitar ajuste)"
fi
echo ""

# 4. Validación de entrada
echo "4️⃣  Validación de entrada..."

# Email inválido
EMAIL_INVALID=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"Test1234!"}' | jq -r '.ok')

if [ "$EMAIL_INVALID" = "false" ]; then
  pass "Rechaza email inválido"
else
  fail "Acepta email inválido"
fi

# Contraseña corta
PASS_SHORT=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"short"}' | jq -r '.ok')

if [ "$PASS_SHORT" = "false" ]; then
  pass "Rechaza contraseña corta (<8 chars)"
else
  fail "Acepta contraseña corta"
fi
echo ""

# 5. Autenticación JWT
echo "5️⃣  Autenticación JWT..."

# Sin token
NO_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/client/profile")
if [ "$NO_TOKEN" = "401" ]; then
  pass "Requiere token para rutas protegidas (401)"
else
  fail "No requiere token correctamente"
fi

# Token inválido
BAD_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/client/profile" \
  -H "Authorization: Bearer invalid.token.here")
if [ "$BAD_TOKEN" = "401" ]; then
  pass "Rechaza token inválido (401)"
else
  fail "Acepta token inválido"
fi
echo ""

# 6. Persistencia y auditoría
echo "6️⃣  Persistencia y auditoría..."

# Crear usuario de prueba
TEST_EMAIL="security-test-$RANDOM@test.com"
REG_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"SecTest123!\"}")

TOKEN=$(echo "$REG_RESPONSE" | jq -r '.token')
OK=$(echo "$REG_RESPONSE" | jq -r '.ok')

if [ "$OK" = "true" ] && [ "$TOKEN" != "null" ]; then
  pass "Registro exitoso con JWT válido"
else
  fail "Registro falló"
fi

# Actualizar perfil
PROFILE_UPDATE=$(curl -s -X PUT "$API_URL/api/client/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombres":"Security","apellidos":"Test","telefono":"+34600999888"}' | jq -r '.ok')

if [ "$PROFILE_UPDATE" = "true" ]; then
  pass "Actualización de perfil exitosa"
else
  fail "Actualización de perfil falló"
fi

# Verificar perfil
PROFILE=$(curl -s "$API_URL/api/client/profile" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.profile.nombres')

if [ "$PROFILE" = "Security" ]; then
  pass "Perfil persiste correctamente"
else
  fail "Perfil no persiste"
fi

# Verificar auditoría (requiere admin)
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aplat.local","password":"APlat2025!"}' | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ "$ADMIN_TOKEN" != "" ]; then
  AUDIT_COUNT=$(curl -s "$API_URL/api/admin/audit-logs?limit=10" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.logs | length')
  
  if [ "$AUDIT_COUNT" -gt 0 ]; then
    pass "Auditoría funcional ($AUDIT_COUNT logs encontrados)"
  else
    warn "Auditoría sin logs (puede ser DB nueva)"
  fi
else
  warn "No se pudo obtener token admin para verificar auditoría"
fi
echo ""

# 7. CORS
echo "7️⃣  CORS..."
CORS=$(curl -s -I -X OPTIONS "$API_URL/api/health" | grep -i "access-control")
if [ ! -z "$CORS" ]; then
  pass "CORS configurado"
else
  warn "Headers CORS no encontrados"
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Pruebas de seguridad completadas"
echo ""
echo "📋 Checklist de producción:"
echo "  - JWT_SECRET configurado (32+ chars)"
echo "  - ADMIN_PASSWORD fuerte"
echo "  - CORS_ORIGIN apunta al frontend"
echo "  - APLAT_DATA_PATH en volumen persistente"
echo "  - Rate limiting habilitado"
echo "  - Helmet habilitado"
echo "  - Auditoría inicializada"
echo ""
echo "📖 Ver docs/SEGURIDAD-APLAT.md para detalles"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
