# GURU API

Backend Node 24 + Fastify para la plataforma GURU. Pensado para desplegar en **Koyeb**.

## Endpoints

- `POST /api/contact` — Formulario de contacto (body: `name`, `email`, `message`).
- `GET /api/health` — Health check.

## Desarrollo local

```bash
cd apps/api
pnpm install
pnpm dev
```

API en `http://localhost:3001`. Configura en el frontend `NEXT_PUBLIC_GURU_API_URL=http://localhost:3001`.

## Variables de entorno

Ver `env.example`. En Koyeb define `PORT`, `CORS_ORIGIN` (URL del front en Vercel) y opcionalmente `NODE_ENV=production`.

## Despliegue en Koyeb

1. Conecta el repo en Koyeb.
2. Build: Dockerfile, ruta `apps/api/Dockerfile` (o desde raíz con contexto `apps/api`).
3. Puerto: 3001.
4. Variables: `PORT=3001`, `CORS_ORIGIN=https://tu-app.vercel.app`.

Ver `docs/DEPLOY-KOYEB.md` en la raíz del repo para pasos detallados.
