# Desplegar GURU API en Koyeb

Backend Node (Fastify) con Passkey, WhatsApp, visitas y dashboard. Se despliega desde el monorepo con **Dockerfile.api** en la raíz. **Imagen Docker: Node 24.**

## Variables obligatorias para que arranque la API

Si la API sale con **exit code 1** y en los logs ves:

```text
Error: ❌ SEGURIDAD: GURU_JWT_SECRET es obligatorio en producción. Generar con: openssl rand -hex 32
```

o:

```text
Error: ❌ SEGURIDAD: GURU_ADMIN_PASSWORD es obligatorio en producción
```

debes configurar **variables de entorno** en Koyeb **antes** del primer arranque:

1. En [Koyeb](https://app.koyeb.com) → tu **servicio** de la API → **Settings** → **Environment variables**.
2. Añade estas dos (obligatorias en producción):

| Variable | Cómo generar / valor |
|----------|----------------------|
| `GURU_JWT_SECRET` | En tu máquina: `openssl rand -hex 32` → copia el resultado y pégalo como valor. |
| `GURU_ADMIN_PASSWORD` | Contraseña segura (mín. 12 caracteres) para el login de admin. |

3. Guarda y haz **Redeploy** del servicio.

Sin `GURU_JWT_SECRET` y `GURU_ADMIN_PASSWORD` la API **no arranca** en producción por seguridad.

### Configurar desde la CLI (recomendado)

Con [Koyeb CLI](https://github.com/koyeb/koyeb-cli) instalado y logueado (`koyeb login`):

```bash
./scripts/koyeb-set-required-env.sh
```

El script genera `GURU_JWT_SECRET` y, si no defines `GURU_ADMIN_PASSWORD`, genera también una contraseña de admin y la muestra (guárdala para el login). Para usar tu propia contraseña:

```bash
GURU_ADMIN_PASSWORD='TuContraseñaSegura123' ./scripts/koyeb-set-required-env.sh
```

Tras ejecutarlo, Koyeb redesplegará el servicio y la API debería arrancar.

## Requisitos

- Cuenta en [Koyeb](https://www.koyeb.com)
- Repositorio GitHub del monorepo GURU (aurelio104/GURU)

## Configuración actual (servicio `guru`)

- **Build**: Dockerfile en raíz → `Dockerfile.api` (o imagen preconstruida desde GitHub Actions, ver más abajo)
- **Puerto**: `3001`

### Si el build con Docker falla en Koyeb ("Unable to start Docker daemon")

Koyeb a veces no puede arrancar Docker en su entorno de build. En ese caso usa la **imagen preconstruida** en GitHub Container Registry:

1. En cada push a `main` (o manualmente desde Actions), el workflow **Docker API** construye la imagen y la sube a `ghcr.io/aurelio104/guru-api:latest`.
2. En Koyeb → tu servicio → **Settings** → **Source**: cambia a **Docker image**.
3. **Image**: `ghcr.io/aurelio104/guru-api:latest`
4. Si el repo es privado: en **Settings** → **Secret** añade un secret con un GitHub PAT con permiso `read:packages` y úsalo como registry secret para `ghcr.io` (usuario: tu usuario, contraseña: el PAT).
5. Guarda y redeploy. Koyeb ya no construye la imagen; solo descarga y ejecuta la de GHCR.
- **Región**: `was` (Washington D.C.; necesaria para volúmenes)
- **Volúmenes** (dos):
  - **guru-api-data** → `/data`: datos generales (WebAuthn/Passkey, logs, etc.)
  - **auth-bot1-guru** → `/whatsapp-auth`: sesión de WhatsApp (Baileys) para que el bot no pierda el inicio de sesión

### Variables de entorno en Koyeb

Configuradas en el servicio (Settings → Environment variables):

| Variable | Valor | Descripción |
|----------|--------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `NODE_ENV` | `production` | Entorno |
| `CORS_ORIGIN` | `https://tu-dominio.vercel.app` | **Exactamente** la URL del front (sin barra final). Si no coincide, verás "Preflight 404" en el navegador. |
| `GURU_JWT_SECRET` | (secreto) | Clave JWT; generar con `openssl rand -hex 32` |
| `GURU_ADMIN_EMAIL` | `admin@guru.local` | Email de login |
| `GURU_ADMIN_PASSWORD` | (secreto) | Contraseña de login |
| `GURU_DATA_PATH` | `/data` | Directorio de datos: aquí se crea la base SQLite `guru.db` (clientes, perfiles, suscripciones). **Debe** ser la ruta de un **volumen persistente** montado; si no, tras cada reinicio o redeploy los datos se pierden (todo quedará vacío). |
| `GURU_WEBAUTHN_STORE_PATH` | `/data/webauthn-store.json` | Persistencia Passkey (volumen `guru-api-data`) |
| `GURU_WEBAUTHN_RP_ID` | `guru.vercel.app` | **Requerido para Passkey:** debe ser el hostname del front (donde el usuario registra la llave). Si no, verás "The requested RPID did not match the origin". |
| `GURU_WHATSAPP_AUTH_PATH` | `/whatsapp-auth` | Directorio auth de WhatsApp (volumen auth-bot1-guru) |
| `GURU_CRON_SECRET` | (secreto) | Para ejecutar cortes automáticos cada día a las 23:59. Ver más abajo. |

### Cortes automáticos (cada día a las 23:59)

Las suscripciones con fecha de pago vencida se suspenden al llamar a **POST /api/cron/process-cutoffs**. Para que se ejecute solo cada día a las 23:59:

1. En Koyeb → tu servicio API → **Settings** → **Environment variables**: añade `GURU_CRON_SECRET` con un valor secreto (ej. `openssl rand -hex 24`).
2. En Koyeb → **Cron Jobs** (o usa un servicio externo): crea un cron que cada día a las **23:59** (hora del servidor/UTC según tu región) haga:
   ```bash
   curl -X POST "https://TU-API-KOYEB.app/api/cron/process-cutoffs" -H "X-Cron-Secret: TU_GURU_CRON_SECRET"
   ```
   O con query: `.../api/cron/process-cutoffs?secret=TU_GURU_CRON_SECRET`

Si no configuras cron, puedes ejecutar cortes manualmente desde el dashboard (botón «Ejecutar cortes» en Suscripciones).

### CORS y error "Preflight 404"

Si en el navegador ves **"Preflight response is not successful. Status code: 404"** al cargar la web o al hacer login:

1. **CORS_ORIGIN** en Koyeb debe ser **exactamente** la URL del frontend que llama a la API (ej. `https://guru.vercel.app` o `https://tu-app.vercel.app`), sin barra final. Si el front está en Vercel, usa la URL que aparece en la barra de direcciones.
2. La API ya responde a peticiones **OPTIONS** (preflight) con 204; tras un redeploy, el 404 de preflight debería desaparecer.
3. Redespliega el servicio en Koyeb después de cambiar `CORS_ORIGIN` o de subir el fix de OPTIONS.

### Frontend (Vercel) – imprescindible

Para que visitas, login, Passkey, WhatsApp y dashboard funcionen, el frontend debe llamar a la API:

1. En Vercel → proyecto GURU → **Settings** → **Environment Variables**
2. Añade:
   - **Name**: `NEXT_PUBLIC_GURU_API_URL`
   - **Value**: `https://guru-aurelio104-9ad05a6a.koyeb.app` (o la URL actual del servicio en Koyeb, **sin** barra final)
3. Redespliega el frontend.

Si esta variable no está definida o apunta a otra URL, verás **404** en `/api/analytics/visit`, `/api/auth/login`, etc.

## Volúmenes: persistencia de datos y WhatsApp

Se usan **dos volúmenes** para guardar toda la información y la sesión de WhatsApp:

| Volumen Koyeb | Montaje en el contenedor | Uso |
|---------------|--------------------------|-----|
| **guru-api-data-v2** (o nuevo) | `/data` | WebAuthn (Passkey), y cualquier otro dato persistente de la API |
| **auth-bot1-guru** | `/whatsapp-auth` | Sesión de inicio de sesión de WhatsApp (Baileys); evita tener que escanear QR cada vez |

**Nota:** En Koyeb, un volumen que ya fue adjuntado a un servicio no puede reasignarse a otro. Si `guru-api-data` dio error "was previously attached to another service", crea uno nuevo (ej. `guru-api-data-v2`) y úsalo para `/data`.

### Crear y adjuntar volúmenes en la UI de Koyeb

1. En [Koyeb Console](https://app.koyeb.com) → **Volumes** → crear o usar los que ya tienes:
   - **guru-api-data** (1 GB), región Washington D.C.
   - **auth-bot1-guru** (1 GB), región Washington D.C.
2. Ir al **servicio** de la API (ej. `guru`) → **Settings** → **Volumes**.
3. **Attach volume** dos veces:
   - Volumen `guru-api-data` → **Mount path**: `/data`
   - Volumen `auth-bot1-guru` → **Mount path**: `/whatsapp-auth`
4. Asegurar que las variables de entorno incluyen:
   - `GURU_DATA_PATH=/data` (base SQLite: clientes, suscripciones; se crea `guru.db` ahí)
   - `GURU_WEBAUTHN_STORE_PATH=/data/webauthn-store.json`
   - `GURU_WHATSAPP_AUTH_PATH=/whatsapp-auth`
5. Guardar y **Redeploy** el servicio (el servicio debe estar en la misma región que los volúmenes, ej. `was`).

### Crear volúmenes y configurar con CLI

1. **Instalar Koyeb CLI** (si no lo tienes):

   ```bash
   brew install koyeb/tap/koyeb
   # o: curl -fsSL https://raw.githubusercontent.com/koyeb/koyeb-cli/master/install.sh | sh
   ```

2. **Iniciar sesión**:

   ```bash
   koyeb login
   ```

3. **Crear volúmenes** (solo regiones `was` o `fra`). Si `guru-api-data` ya existía y no se puede reasignar, usa otro nombre (ej. `guru-api-data-v2`):

   ```bash
   koyeb volume create guru-api-data-v2 --region was --size 1
   koyeb volume create auth-bot1-guru --region was --size 1
   ```

4. **Actualizar el servicio** (dos volúmenes + variables). Servicio actual: `guru-api/api`:

   ```bash
   koyeb service update guru-api/api \
     --region was \
     --volumes guru-api-data-v2:/data \
     --volumes auth-bot1-guru:/whatsapp-auth \
     --env "GURU_WEBAUTHN_STORE_PATH=/data/webauthn-store.json" \
     --env "GURU_WHATSAPP_AUTH_PATH=/whatsapp-auth"
   ```

   (Si un volumen ya fue usado por otro servicio, créalo nuevo, ej. `koyeb volume create guru-api-data-v2 --region was --size 1`.)

5. **Redeploy** (usa el último commit de `main`):

   ```bash
   koyeb services update guru/guru --git-sha ""
   ```

## Build desde raíz (monorepo)

En Koyeb, el servicio debe usar:

- **Repository**: `github.com/aurelio104/GURU`
- **Branch**: `main`
- **Dockerfile path**: `Dockerfile.api` (en la **raíz** del repo)
- **Work directory**: vacío (raíz)

Así el Dockerfile puede hacer `COPY apps/api/...` correctamente. La imagen usa **Node 24** (`node:24-alpine`).

## Health check

```bash
curl https://guru-aurelio104-9ad05a6a.koyeb.app/api/health
```

Respuesta esperada: `{"ok":true,"service":"guru-api"}`.

## Pruebas de producción

Desde la raíz del repo:

```bash
./scripts/test-production-api.sh
```

Comprueba health, visit, login, auth/me, connections, visitors, whatsapp/status, webauthn challenge/register/begin y contact. Si varias rutas dan 404, en Koyeb el despliegue activo puede ser una imagen antigua; un despliegue nuevo (con todas las rutas) puede estar en estado STARTING/PENDING hasta que pase a activo.

## Prueba de persistencia (local)

Para comprobar que clientes, perfiles y suscripciones se guardan y sobreviven a un reinicio:

```bash
cd apps/api && pnpm test:persist
```

Crea datos en `./data-persist-test`, sale, y en una segunda ejecución comprueba que sigan ahí. En producción, `GURU_DATA_PATH` debe apuntar a un volumen persistente (ej. `/data` en Koyeb).

## Desarrollo local

**API:**

```bash
cd apps/api && pnpm install && pnpm dev
```

**Frontend** (en otra terminal):

```bash
cd apps/web
echo "NEXT_PUBLIC_GURU_API_URL=http://localhost:3001" > .env.local
pnpm dev
```
