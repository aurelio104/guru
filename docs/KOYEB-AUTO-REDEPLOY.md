# Auto-redeploy en Koyeb desde GitHub (repo Guru)

Como el webhook de Koyeb puede no detectar el repo Guru, usamos **GitHub Actions** para redeploy automático en cada push a `main`.

## Configuración (una sola vez)

### 1. Obtener token de Koyeb

1. Ve a https://app.koyeb.com/account/profile
2. Sección **API token** → **Create token**
3. Nombre: `github-actions`
4. Copia el token

### 2. Añadir secret en GitHub

1. Repo **Guru** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. **Name:** `KOYEB_TOKEN`
4. **Value:** pega el token de Koyeb

### 3. Listo

Cada push a `main` que afecte `apps/api/` o `Dockerfile.api` disparará el workflow `.github/workflows/koyeb-redeploy.yml` y Koyeb hará redeploy automáticamente.

## Redeploy manual

Desde tu máquina (con `koyeb login` hecho):

```bash
koyeb service redeploy guru/guru
```
