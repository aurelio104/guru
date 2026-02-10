# Desplegar APlat API en Koyeb

Backend Node 24 + Fastify para el formulario de contacto y futuras APIs.

## Requisitos

- Cuenta en [Koyeb](https://www.koyeb.com)
- Repositorio Git con el monorepo APlat (apps/api)

## Pasos

### 1. Crear servicio en Koyeb

1. Entra en [Koyeb Console](https://app.koyeb.com) → **Create App** o **Create Service**.
2. **Deploy from**: GitHub (conecta el repo de APlat).
3. **Branch**: `main` (o la rama que uses).

### 2. Configuración de build

- **Build type**: Dockerfile
- **Dockerfile path**: `apps/api/Dockerfile`
- **Build context / Root directory**: `apps/api`  
  (Así los `COPY` del Dockerfile resuelven correctamente.)

Si Koyeb no permite “Build context” por separado, sube solo la carpeta `apps/api` en un repo propio o usa un Dockerfile en la raíz que haga `COPY apps/api .` y trabaje desde ahí; en ese caso habría que ajustar el Dockerfile.

### 3. Puerto y variables

- **Port**: `3001`
- **Variables de entorno**:
  - `PORT` = `3001`
  - `NODE_ENV` = `production`
  - `CORS_ORIGIN` = URL del frontend en Vercel (ej. `https://aplat.vercel.app`). Sin `CORS_ORIGIN` la API acepta cualquier origen (útil solo en desarrollo).

### 4. Desplegar

Pulsa **Deploy**. Koyeb construirá la imagen y asignará una URL tipo `https://tu-app-xxx.koyeb.app`.

### 5. Conectar el frontend (Vercel)

En el proyecto Next.js en Vercel:

1. **Settings** → **Environment Variables**
2. Añade:
   - **Name**: `NEXT_PUBLIC_APLAT_API_URL`
   - **Value**: `https://tu-app-xxx.koyeb.app` (la URL del servicio en Koyeb, sin barra final)
3. Redespliega el frontend para que el formulario de contacto use la API.

## Desarrollo local

**Terminal 1 – API:**

```bash
cd apps/api
pnpm install
pnpm dev
```

API en `http://localhost:3001`.

**Terminal 2 – Frontend:**

```bash
cd apps/web
NEXT_PUBLIC_APLAT_API_URL=http://localhost:3001 pnpm dev
```

O crea `apps/web/.env.local` con:

```
NEXT_PUBLIC_APLAT_API_URL=http://localhost:3001
```

## Health check

```bash
curl https://tu-app-xxx.koyeb.app/api/health
```

Respuesta esperada: `{"ok":true,"service":"aplat-api"}`.
