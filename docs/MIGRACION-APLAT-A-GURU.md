# Migración APlat → GURU

Este documento describe los pasos para completar la migración del proyecto **APlat** a **GURU** en Git, Vercel y Koyeb.

## ✅ Cambios ya aplicados en el código

- **Packages:** `aplat` → `guru`, `aplat-web` → `guru-web`, `aplat-api` → `guru-api`
- **Variables de entorno:** `APLAT_*` → `GURU_*`, `NEXT_PUBLIC_APLAT_*` → `NEXT_PUBLIC_GURU_*`
- **localStorage:** `aplat_token` → `guru_token`
- **CSS/theme:** `aplat-*` → `guru-*`
- **Bases de datos:** `aplat.db` → `guru.db`, `aplat-audit.db` → `guru-audit.db`, `aplat-presence.db` → `guru-presence.db`
- **URLs por defecto:** `aplat.vercel.app` → `guru.vercel.app`, `aplat-api-*` → `guru-api-*`
- **Docker:** imagen `ghcr.io/owner/aplat-api` → `ghcr.io/owner/guru-api`

## 🔧 Pasos manuales que debes ejecutar

### 1. Renombrar la carpeta del proyecto

```bash
cd /ruta/padre
mv APlat GURU
cd GURU
```

### 2. GitHub: renombrar el repositorio

1. En GitHub: **Settings** del repo **APlat**
2. **General** → **Repository name** → cambiar a `GURU`
3. Confirmar el cambio (el URL pasará a `github.com/aurelio104/GURU`)

### 3. Vercel: crear o renombrar proyecto

**Opción A – Renombrar proyecto existente**
- Vercel Dashboard → proyecto `aplat` → **Settings** → **General** → **Project Name** → `guru`
- El dominio pasará a `guru.vercel.app` (o el dominio propio que tengas)

**Opción B – Proyecto nuevo**
- Crear un nuevo proyecto Vercel llamado `guru`
- Conectar al repo `aurelio104/GURU`
- Root Directory: `apps/web`
- Añadir `NEXT_PUBLIC_GURU_API_URL` con la URL de la API

### 4. Koyeb: renombrar app y servicio

Koyeb no permite renombrar apps/servicios fácilmente. Opciones:

**Opción A – Nuevo deploy**
1. Crear una nueva app `guru`
2. Crear servicio API desde imagen `ghcr.io/aurelio104/guru-api:latest` o desde el repo
3. Configurar variables `GURU_*` (JWT, admin, etc.)
4. Crear volúmenes (por ejemplo `guru-api-data`, `auth-bot1-guru`) y montarlos
5. Añadir dominio si aplica
6. Cuando todo funcione, eliminar el servicio/app `aplat`

**Opción B – Mantener nombres actuales**
- Si el servicio actual es `aplat-api`, puedes dejar el nombre en Koyeb
- Solo actualiza las variables de entorno de `APLAT_*` a `GURU_*` en el panel de Koyeb
- CORS y URLs deben apuntar a los nuevos dominios (guru.vercel.app, etc.)

### 5. Actualizar variables de entorno

**Vercel (frontend)**
- `NEXT_PUBLIC_GURU_API_URL` = URL de la API (ej. `https://guru-api-xxx.koyeb.app` o la actual)
- `NEXT_PUBLIC_GURU_WEBAUTHN_RP_ID` = hostname del front (ej. `guru.vercel.app`)

**Koyeb (API)**
- `GURU_JWT_SECRET`
- `GURU_ADMIN_EMAIL` (ej. `admin@guru.local`)
- `GURU_ADMIN_PASSWORD`
- `GURU_DATA_PATH=/data`
- `GURU_WEBAUTHN_RP_ID=guru.vercel.app` (o tu dominio)
- `GURU_WEBAUTHN_STORE_PATH=/data/webauthn-store.json`
- `GURU_WHATSAPP_AUTH_PATH=/whatsapp-auth` (si usas WhatsApp)
- `CORS_ORIGIN` = URL del front (ej. `https://guru.vercel.app`)

### 6. Migrar datos (si tienes producción con datos)

Si ya tenías `aplat.db`, `aplat-audit.db`, `aplat-presence.db`:

- Copia los archivos al volumen y renómbralos a `guru.db`, `guru-audit.db`, `guru-presence.db`
- O mantén los nombres antiguos y ajusta el código (no recomendado)

### 7. Re-vincular Vercel al repo

Tras renombrar el repo en GitHub:

```bash
cd GURU  # carpeta ya renombrada
cd apps/web
npx vercel link  # selecciona el proyecto guru o crea uno nuevo
npx vercel --prod
```

### 8. Cerrar sesión y volver a entrar

Los usuarios que tuvieran sesión con `aplat_token` necesitarán iniciar sesión de nuevo (se usa `guru_token`).
