#!/usr/bin/env bash
# Pruebas solo de endpoints públicos (no requieren login).
# Uso: ./scripts/test-public-api.sh
#      API_URL=http://localhost:3001 ./scripts/test-public-api.sh
# Útil para verificar la API en local sin tener usuario configurado.
set -e
API="${API_URL:-http://localhost:3001}"
FAIL=0

check() {
  local name="$1"
  local want="$2"
  local got="$3"
  if [[ "$got" == *"$want"* ]]; then
    echo "  OK $name"
  else
    echo "  FAIL $name (expected contains: $want, got: $got)"
    FAIL=1
  fi
}

echo "=== API (solo rutas públicas): $API ==="
echo ""

echo "1. GET /api/health"
r=$(curl -s -w "\n%{http_code}" "$API/api/health")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "health 200" "200" "$code"
check "health body" "guru-api" "$body"
echo ""

echo "2. POST /api/analytics/visit"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/analytics/visit" -H "Content-Type: application/json" -d '{"path":"/","referrer":""}')
code=$(echo "$r" | tail -1)
check "visit 200" "200" "$code"
echo ""

echo "3. POST /api/contact"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/contact" -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","message":"Hi"}')
code=$(echo "$r" | tail -1)
check "contact 200" "200" "$code"
echo ""

echo "4. GET /api/catalog/services"
r=$(curl -s -w "\n%{http_code}" "$API/api/catalog/services")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "catalog services 200" "200" "$code"
check "catalog services body" '"ok":true' "$body"
echo ""

echo "5. GET /api/catalog/quote?ids=1,2,4"
r=$(curl -s -w "\n%{http_code}" "$API/api/catalog/quote?ids=1,2,4")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "catalog quote 200" "200" "$code"
check "catalog quote body" "totalMonthly" "$body"
echo ""

echo "6. GET /api/geofencing/validate"
r=$(curl -s -w "\n%{http_code}" "$API/api/geofencing/validate?lat=10&lng=-66&target_lat=10&target_lng=-66&radius_m=50")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "geofencing 200" "200" "$code"
check "geofencing inside" "inside" "$body"
echo ""

echo "7. POST /api/verify-signature"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/verify-signature" -H "Content-Type: application/json" -d '{"data":"hello","expectedHash":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824","algorithm":"sha256"}')
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "verify-signature 200" "200" "$code"
check "verify-signature valid" "valid" "$body"
echo ""

echo "8. GET /api/push/vapid-public (200 o 503 si no hay VAPID)"
r=$(curl -s -w "\n%{http_code}" "$API/api/push/vapid-public")
code=$(echo "$r" | tail -1)
if [[ "$code" == "200" ]]; then
  echo "  OK push vapid 200"
elif [[ "$code" == "503" ]]; then
  echo "  OK push vapid 503 (no configurado)"
else
  echo "  FAIL push vapid (got $code)"
  FAIL=1
fi
echo ""

echo "9. POST /api/auth/webauthn/challenge"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/webauthn/challenge" -H "Content-Type: application/json" -d '{}')
code=$(echo "$r" | tail -1)
check "webauthn challenge 200" "200" "$code"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "=== Todas las pruebas públicas pasaron ==="
  exit 0
else
  echo "=== Algunas pruebas fallaron ==="
  exit 1
fi
