#!/usr/bin/env bash
# Pruebas de todos los endpoints de la API en producción.
# Uso: ./scripts/test-production-api.sh
#      o: API_URL=https://tu-api.koyeb.app ./scripts/test-production-api.sh
# Si visit/visitors/whatsapp/webauthn dan 404, el despliegue activo en Koyeb puede ser antiguo.
set -e
API="${API_URL:-https://aplat-api-aurelio104-5877962a.koyeb.app}"
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

echo "=== API: $API ==="
echo ""

echo "1. GET /api/health"
r=$(curl -s -w "\n%{http_code}" "$API/api/health")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "health 200" "200" "$code"
check "health body" "aplat-api" "$body"
echo ""

echo "2. POST /api/analytics/visit"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/analytics/visit" -H "Content-Type: application/json" -d '{"path":"/","referrer":""}')
code=$(echo "$r" | tail -1)
check "visit 200" "200" "$code"
echo ""

echo "3. POST /api/auth/login"
r=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@aplat.local","password":"APlat2025!"}')
check "login ok" '"ok":true' "$r"
token=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [[ -z "$token" ]]; then echo "  FAIL login no token"; FAIL=1; else echo "  OK login + token"; fi
echo ""

echo "4. GET /api/auth/me"
r=$(curl -s -w "\n%{http_code}" "$API/api/auth/me" -H "Authorization: Bearer $token")
code=$(echo "$r" | tail -1)
check "me 200" "200" "$code"
echo ""

echo "5. GET /api/dashboard/connections"
r=$(curl -s -w "\n%{http_code}" "$API/api/dashboard/connections" -H "Authorization: Bearer $token")
code=$(echo "$r" | tail -1)
check "connections 200" "200" "$code"
echo ""

echo "6. GET /api/dashboard/visitors"
r=$(curl -s -w "\n%{http_code}" "$API/api/dashboard/visitors" -H "Authorization: Bearer $token")
code=$(echo "$r" | tail -1)
check "visitors 200" "200" "$code"
echo ""

echo "7. GET /api/whatsapp/status"
r=$(curl -s -w "\n%{http_code}" "$API/api/whatsapp/status" -H "Authorization: Bearer $token")
code=$(echo "$r" | tail -1)
check "whatsapp status 200" "200" "$code"
echo ""

echo "8. POST /api/auth/webauthn/challenge"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/webauthn/challenge" -H "Content-Type: application/json" -d '{}')
code=$(echo "$r" | tail -1)
check "webauthn challenge 200" "200" "$code"
echo ""

echo "9. POST /api/auth/webauthn/register/begin (con token)"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/webauthn/register/begin" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"deviceName":"Test"}')
code=$(echo "$r" | tail -1)
check "register begin 200" "200" "$code"
echo ""

echo "10. POST /api/contact (validación)"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/contact" -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","message":"Hi"}')
code=$(echo "$r" | tail -1)
check "contact 200" "200" "$code"
echo ""

echo "11. GET /api/catalog/services"
r=$(curl -s -w "\n%{http_code}" "$API/api/catalog/services")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "catalog services 200" "200" "$code"
check "catalog services body" '"ok":true' "$body"
echo ""

echo "12. GET /api/catalog/quote?ids=1,2,4"
r=$(curl -s -w "\n%{http_code}" "$API/api/catalog/quote?ids=1,2,4")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "catalog quote 200" "200" "$code"
check "catalog quote body" "totalMonthly" "$body"
echo ""

echo "13. GET /api/geofencing/validate"
r=$(curl -s -w "\n%{http_code}" "$API/api/geofencing/validate?lat=10&lng=-66&target_lat=10&target_lng=-66&radius_m=50")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "geofencing 200" "200" "$code"
check "geofencing inside" "inside" "$body"
echo ""

echo "14. POST /api/verify-signature"
r=$(curl -s -w "\n%{http_code}" -X POST "$API/api/verify-signature" -H "Content-Type: application/json" -d '{"data":"hello","expectedHash":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824","algorithm":"sha256"}')
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "verify-signature 200" "200" "$code"
check "verify-signature valid" "valid" "$body"
echo ""

echo "15. GET /api/assets"
r=$(curl -s -w "\n%{http_code}" "$API/api/assets" -H "Authorization: Bearer $token")
code=$(echo "$r" | tail -1)
body=$(echo "$r" | sed '$d')
check "assets 200" "200" "$code"
check "assets body" '"ok":true' "$body"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "=== Todas las pruebas pasaron ==="
  exit 0
else
  echo "=== Algunas pruebas fallaron ==="
  exit 1
fi
