#!/usr/bin/env bash
# Verifica la conexión Git y que los pushes lleguen correctamente.
# Uso: ./scripts/verificar-conexion-git.sh
set -e

echo "=== Verificación de conexión Git (Guru) ==="
echo ""

# 1. Remote
echo "1. Remote configurado:"
git remote -v
echo ""

# 2. Rama y tracking
echo "2. Rama actual y tracking:"
git branch -vv
echo ""

# 3. Estado vs origin
echo "3. Estado vs origin/main:"
git fetch origin 2>/dev/null || { echo "   ⚠️  No se pudo hacer fetch (¿repo privado sin credenciales?)"; exit 1; }
LOCAL=$(git rev-parse main 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "   ✅ Local y origin/main están sincronizados ($LOCAL)"
else
  echo "   ⚠️  Local:  $LOCAL"
  echo "   ⚠️  Remote: $REMOTE"
  echo "   Ejecuta: git pull origin main"
fi
echo ""

# 4. Último commit
echo "4. Último commit en main:"
git log -1 --oneline main
echo ""

# 5. Aviso sobre Vercel/Koyeb
echo "5. Si Vercel o Koyeb NO se actualizan tras un push:"
echo "   - Vercel: Settings → Git → reconecta el repo a github.com/aurelio104/Guru"
echo "   - Koyeb: Service → Source → asegura que apunte a aurelio104/Guru (no APlat)"
echo ""
echo "   El push a Git funciona; el problema suele ser que el servicio"
echo "   sigue conectado al repo antiguo (APlat)."
echo ""
