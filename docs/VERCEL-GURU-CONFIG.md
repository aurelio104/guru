# Configuración Vercel GURU (Frontend)

Copia de la configuración para crear el proyecto **GURU** en Vercel desde cero.

## Requisitos

- Cuenta Vercel
- Repo: `github.com/aurelio104/Guru`
- **Autenticación:** `vercel login` **o** token en `VERCEL_TOKEN`

### Conexión con token (sin login interactivo)

1. Crear token en [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crear `.env.vercel` en la raíz:
   ```bash
   cp .env.vercel.example .env.vercel
   # Editar .env.vercel y añadir: VERCEL_TOKEN=tu_token
   ```
3. Ejecutar: `./scripts/vercel-deploy.sh`

---

## Configuración del proyecto

| Campo | Valor |
|-------|-------|
| **Project Name** | guru |
| **Framework** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `next build` (o dejar vacío para auto) |
| **Output Directory** | `.next` (auto) |
| **Install Command** | `pnpm install` |
| **Node.js Version** | 20.x (o superior) |

---

## Variables de entorno

En **Settings → Environment Variables**:

| Nombre | Valor | Entornos |
|--------|-------|----------|
| `NEXT_PUBLIC_GURU_API_URL` | `https://guru-aurelio104-9ad05a6a.koyeb.app` | Production, Preview |
| `NEXT_PUBLIC_GURU_WEBAUTHN_RP_ID` | `guru.vercel.app` | Production (opcional, para Passkey) |

---

## Crear proyecto desde CLI

```bash
# 1. Login (si no lo has hecho)
vercel login

# 2. Desde la raíz del repo
cd /ruta/a/Guru

# 3. Crear proyecto nuevo (primera vez)
npx vercel link --cwd apps/web --yes
# Te preguntará: Create new project? → Yes
# Project name: guru

# 4. Configurar variables
npx vercel env add NEXT_PUBLIC_GURU_API_URL production --cwd apps/web
# Pegar: https://guru-aurelio104-9ad05a6a.koyeb.app

# 5. Desplegar a producción
npx vercel --cwd apps/web --prod
```

---

## Crear proyecto desde Dashboard

1. **Vercel Dashboard** → **Add New** → **Project**
2. **Import** → selecciona el repo `aurelio104/Guru`
3. **Configure Project:**
   - **Project Name:** guru
   - **Root Directory:** `apps/web` (editar y poner `apps/web`)
   - **Framework Preset:** Next.js
   - **Build Command:** (vacío, auto)
   - **Environment Variables:** añadir `NEXT_PUBLIC_GURU_API_URL` = `https://guru-aurelio104-9ad05a6a.koyeb.app`
4. **Deploy**

---

## Dominio

Tras el deploy, Vercel asigna:
- `guru.vercel.app` (si el proyecto se llama guru)
- o `guru-xxx.vercel.app` (sufijo del equipo)

Puedes añadir un dominio propio en **Settings → Domains**.

---

## Después de crear GURU

1. **Proyecto legacy** (opcional): si tenías un proyecto anterior, puedes eliminarlo en Vercel Dashboard → Settings → Delete Project
2. **Actualizar Koyeb:** si el frontend queda en `guru.vercel.app`, actualiza en el servicio guru:
   - `GURU_WEBAUTHN_RP_ID=guru.vercel.app`
   - `CORS_ORIGIN=https://guru.vercel.app`
