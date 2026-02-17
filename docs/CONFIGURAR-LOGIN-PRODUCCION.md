# Configurar login con Gurumaster en producción

Para que puedas iniciar sesión con el master **Gurumaster** (gurumaster@guru.local / Maracay.1) en el frontend desplegado en Vercel, necesitas configurar:

1. **API en Koyeb** — credenciales del master
2. **Frontend en Vercel** — URL de la API

---

## 1. Conectar y configurar Koyeb (API)

### Instalar Koyeb CLI (si no lo tienes)

```bash
brew install koyeb/tap/koyeb
```

### Iniciar sesión

```bash
koyeb login
```

Se abrirá el navegador para autorizar. Cuando termines, vuelve a la terminal.

### Configurar credenciales Gurumaster

Desde la raíz del repo:

```bash
./scripts/configure-gurumaster-production.sh
```

Este script actualiza el servicio en Koyeb con:
- `GURU_ADMIN_EMAIL=gurumaster@guru.local`
- `GURU_ADMIN_PASSWORD=Maracay.1`

Koyeb redesplegará el servicio automáticamente (1-2 minutos).

### Alternativa: configurar manualmente en Koyeb Dashboard

1. Ve a [console.koyeb.com](https://console.koyeb.com)
2. Selecciona la app **guru** y el servicio **guru**
3. **Settings** → **Environment variables**
4. Añade o edita:
   - `GURU_ADMIN_EMAIL` = `gurumaster@guru.local`
   - `GURU_ADMIN_PASSWORD` = `Maracay.1`
5. Guarda y espera el redespliegue

---

## 2. Conectar y configurar Vercel (Frontend)

### Instalar Vercel CLI (si no lo tienes)

```bash
npm i -g vercel
# o: pnpm add -g vercel
```

### Iniciar sesión

```bash
vercel login
```

### Configurar variable de entorno (API URL)

La API está en `https://guru-aurelio104-9ad05a6a.koyeb.app`. El frontend debe conocerla:

**Opción A — CLI**

```bash
cd /ruta/a/Guru
vercel env add NEXT_PUBLIC_GURU_API_URL production --cwd apps/web
# Pega: https://guru-aurelio104-9ad05a6a.koyeb.app

vercel env add NEXT_PUBLIC_GURU_API_URL preview --cwd apps/web
# Pega: https://guru-aurelio104-9ad05a6a.koyeb.app
```

**Opción B — Dashboard**

1. Ve a [vercel.com](https://vercel.com) → tu proyecto **guru** (o aplat)
2. **Settings** → **Environment Variables**
3. Añade:
   - **Name:** `NEXT_PUBLIC_GURU_API_URL`
   - **Value:** `https://guru-aurelio104-9ad05a6a.koyeb.app`
   - **Environment:** Production y Preview
4. Guarda

### Redesplegar (si cambiaste variables)

```bash
vercel --cwd apps/web --prod
```

O haz push a `main` si tienes Git Integration.

---

## 3. Comprobar CORS

La API en Koyeb debe permitir el origen de tu frontend. En el servicio Koyeb:

- `CORS_ORIGIN` = URL de tu frontend, ej: `https://guru.vercel.app` o `https://aplat.vercel.app`

Sin barra final, con `https://`.

---

## 4. Iniciar sesión

1. Abre tu frontend (ej. `https://guru.vercel.app/login`)
2. **Email:** `gurumaster@guru.local`
3. **Contraseña:** `Maracay.1`

---

## Resumen de URLs

| Servicio | URL |
|----------|-----|
| API (Koyeb) | https://guru-aurelio104-9ad05a6a.koyeb.app |
| Frontend (Vercel) | https://guru.vercel.app (o la que tengas) |
| Health check | `curl https://guru-aurelio104-9ad05a6a.koyeb.app/api/health` |
