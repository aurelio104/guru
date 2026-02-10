# APlat

**APlat** es la marca bajo la cual se ofrecen servicios digitales: plataformas web, venta y reservas, centros de mando, control de acceso, automatización de reportes e integraciones.

## Contenido de este repositorio

- **apps/web/** — Sitio público APlat (Next.js 15, Tailwind 4, TypeScript). Listo para Vercel.
- **apps/api/** — API Node 24 + Fastify (formulario de contacto). Listo para Koyeb.
- **APLAT-PLAN-MAESTRO.md** — Plan maestro: análisis del portafolio, catálogo de servicios, plan de acción.
- **docs/** — Portafolio, servicios, estudio de 5 plataformas.
- **_repos/** — Clones de referencia de repositorios de GitHub (aurelio104).

## Cómo ejecutar el sitio APlat

```bash
# Desde la raíz (con pnpm)
pnpm install
pnpm dev

# O desde apps/web
cd apps/web && pnpm install && pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Formulario de contacto:** para que envíe a la API, en `apps/web` crea `.env.local` con `NEXT_PUBLIC_APLAT_API_URL=http://localhost:3001` y en otra terminal ejecuta `pnpm dev:api` (o `cd apps/api && pnpm dev`).

**Producción:** frontend `pnpm build` + `pnpm start` o Vercel; API ver `docs/DEPLOY-KOYEB.md`.

## Conexión GitHub

La conexión SSH a GitHub (aurelio104) está configurada en esta máquina. Los repos se clonaron desde `git@github.com:aurelio104/<repo>.git` para el análisis del plan maestro.
