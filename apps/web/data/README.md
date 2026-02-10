# Datos del portafolio

## portfolio-production-urls.json

Mapeo **slug del proyecto** → **URL de producción** (el enlace que se muestra en APlat).

- **Actualización con datos reales (CLI Vercel):** desde la raíz del repo, con la CLI de Vercel instalada y sesión iniciada (`vercel login`):
  ```bash
  pnpm run sync:vercel
  ```
  El script ejecuta `vercel project ls --format=json`, obtiene el dominio de producción de cada proyecto (incluido el dominio propio si ya está en Vercel) y actualiza este JSON. Cuando cambies un dominio en Vercel (p. ej. maracay-deportiva de `*.vercel.app` a dominio propio), vuelve a ejecutar el script y el siguiente build de APlat mostrará el nuevo enlace.

- **Sin token:** usa la sesión actual de la CLI (`vercel login`), no hace falta `VERCEL_TOKEN`.

- **Entradas manuales:** los proyectos que no estén en Vercel se pueden añadir editando este JSON a mano. El script no borra entradas existentes.
