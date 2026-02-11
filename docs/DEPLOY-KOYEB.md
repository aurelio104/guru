# Desplegar APlat API en Koyeb

Backend Node (Fastify) con Passkey, WhatsApp, visitas y dashboard. Se despliega desde el monorepo con **Dockerfile.api** en la raíz.

## Requisitos

- Cuenta en [Koyeb](https://www.koyeb.com)
- Repositorio GitHub del monorepo APlat (aurelio104/APlat)

## Configuración actual (servicio `aplat`)

- **Build**: Dockerfile en raíz → `Dockerfile.api`
- **Puerto**: `3001`
- **Región**: `was` (una sola región por el volumen)
- **Volumen**: `aplat-api-data` montado en `/data` (persistencia WebAuthn y WhatsApp)

### Variables de entorno en Koyeb

Configuradas en el servicio (Settings → Environment variables):

| Variable | Valor | Descripción |
|----------|--------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `NODE_ENV` | `production` | Entorno |
| `CORS_ORIGIN` | `https://tu-dominio.vercel.app` | Origen permitido (frontend) |
| `APLAT_JWT_SECRET` | (secreto) | Clave JWT; generar con `openssl rand -hex 32` |
| `APLAT_ADMIN_EMAIL` | `admin@aplat.local` | Email de login |
| `APLAT_ADMIN_PASSWORD` | (secreto) | Contraseña de login |
| `APLAT_WEBAUTHN_STORE_PATH` | `/data/webauthn-store.json` | Persistencia Passkey (en volumen) |
| `APLAT_WEBAUTHN_RP_ID` | (opcional) | Dominio del sitio en producción (ej. `aplat.vercel.app`) |
| `APLAT_WHATSAPP_AUTH_PATH` | `/data/whatsapp-auth` | Directorio auth de Baileys (en volumen) |

### Frontend (Vercel) – imprescindible

Para que visitas, login, Passkey, WhatsApp y dashboard funcionen, el frontend debe llamar a la API:

1. En Vercel → proyecto APlat → **Settings** → **Environment Variables**
2. Añade:
   - **Name**: `NEXT_PUBLIC_APLAT_API_URL`
   - **Value**: `https://aplat-aurelio104-5edd4229.koyeb.app` (o la URL actual del servicio en Koyeb, **sin** barra final)
3. Redespliega el frontend.

Si esta variable no está definida o apunta a otra URL, verás **404** en `/api/analytics/visit`, `/api/whatsapp/status`, `/api/auth/webauthn/register/begin`, etc.

## Crear volumen y configurar con CLI

1. **Instalar Koyeb CLI** (si no lo tienes):

   ```bash
   brew install koyeb/tap/koyeb
   # o: curl -fsSL https://raw.githubusercontent.com/koyeb/koyeb-cli/master/install.sh | sh
   ```

2. **Iniciar sesión**:

   ```bash
   koyeb login
   ```

3. **Crear volumen** (solo regiones `was` o `fra`):

   ```bash
   koyeb volumes create aplat-api-data --region was --size 1
   ```

4. **Actualizar el servicio** (volumen + variables):

   ```bash
   koyeb services update aplat/aplat \
     --regions '!fra' \
     --volumes aplat-api-data:/data \
     --env "APLAT_WEBAUTHN_STORE_PATH=/data/webauthn-store.json" \
     --env "APLAT_WHATSAPP_AUTH_PATH=/data/whatsapp-auth"
   ```

   (Quitar `--regions '!fra'` si el servicio ya está solo en `was`.)

5. **Redeploy** (usa el último commit de `main`):

   ```bash
   koyeb services update aplat/aplat --git-sha ""
   ```

## Build desde raíz (monorepo)

En Koyeb, el servicio debe usar:

- **Repository**: `github.com/aurelio104/APlat`
- **Branch**: `main`
- **Dockerfile path**: `Dockerfile.api` (en la **raíz** del repo)
- **Work directory**: vacío (raíz)

Así el Dockerfile puede hacer `COPY apps/api/...` correctamente.

## Health check

```bash
curl https://aplat-aurelio104-5edd4229.koyeb.app/api/health
```

Respuesta esperada: `{"ok":true,"service":"aplat-api"}`.

## Pruebas de producción

Desde la raíz del repo:

```bash
./scripts/test-production-api.sh
```

Comprueba health, visit, login, auth/me, connections, visitors, whatsapp/status, webauthn challenge/register/begin y contact. Si varias rutas dan 404, en Koyeb el despliegue activo puede ser una imagen antigua; un despliegue nuevo (con todas las rutas) puede estar en estado STARTING/PENDING hasta que pase a activo.

## Desarrollo local

**API:**

```bash
cd apps/api && pnpm install && pnpm dev
```

**Frontend** (en otra terminal):

```bash
cd apps/web
echo "NEXT_PUBLIC_APLAT_API_URL=http://localhost:3001" > .env.local
pnpm dev
```
