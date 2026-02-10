# Despliegue en producción: Vercel (front) + Koyeb (back)

## Resumen

- **Frontend (apps/web):** Vercel — Next.js, formulario contacto, home, (login en integración).
- **Backend (apps/api):** Koyeb — Node 24, Fastify, `/api/contact`, `/api/health`.

La carpeta **_repos** no se sube a Git (está en `.gitignore`).

---

## 1. Git y GitHub

### Crear el repo APlat (sin subir _repos)

```bash
cd /ruta/a/APlat

# Ya está en .gitignore: _repos/
git add -A
git status   # no debe aparecer _repos
git commit -m "feat: APlat plataforma — web + API"

# Crear repo en GitHub (requiere gh y estar logueado)
gh auth status
gh repo create APlat --private --source=. --remote=origin --description "APlat · Servicios digitales de última generación"
git push -u origin main
```

Si no usas `gh`, crea el repo en https://github.com/new (nombre: **APlat**), sin README ni .gitignore, y luego:

```bash
git remote add origin git@github.com:aurelio104/APlat.git
git branch -M main
git push -u origin main
```

---

## 2. Frontend en Vercel (CLI)

### Instalar y vincular

```bash
# Instalar Vercel CLI (una vez)
npm i -g vercel
# o: pnpm add -g vercel

cd /ruta/a/APlat
vercel login   # si no estás logueado

# Desplegar desde la carpeta del frontend
vercel --cwd apps/web
```

La primera vez te pedirá vincular a un proyecto (crear nuevo o enlazar existente). El **Root Directory** debe ser `apps/web` (o en el dashboard: Project Settings → Root Directory = `apps/web`).

### Variables de entorno en Vercel

En **Vercel Dashboard** → tu proyecto → **Settings** → **Environment Variables**:

| Nombre | Valor | Entorno |
|--------|--------|---------|
| `NEXT_PUBLIC_APLAT_API_URL` | `https://tu-api.koyeb.app` | Production, Preview |

Sustituye `tu-api.koyeb.app` por la URL real de tu servicio en Koyeb (ver apartado 3).

### Despliegue a producción

```bash
vercel --cwd apps/web --prod
```

O conectar el repo en Vercel (Git Integration): cada push a `main` despliega en producción.

---

## 3. Backend en Koyeb (CLI)

### Requisitos

- Cuenta en [Koyeb](https://www.koyeb.com)
- CLI instalada: `brew install koyeb/tap/koyeb` o ver [Installing the Koyeb CLI](https://www.koyeb.com/docs/build-and-deploy/cli/installation)

### Login

```bash
koyeb login
```

### Crear app y servicio desde Git (CLI)

Con el repo **APlat** ya en GitHub y **koyeb** en el PATH (`/usr/local/bin` o `brew install koyeb/tap/koyeb`):

```bash
# Login (abre el navegador)
koyeb login

# Crear app + servicio API con Dockerfile (recomendado)
koyeb apps init aplat \
  --git github.com/aurelio104/APlat \
  --git-branch main \
  --git-workdir apps/api \
  --git-builder docker \
  --git-docker-dockerfile Dockerfile \
  --ports 3001 \
  --routes /:3001 \
  --env PORT=3001 \
  --env NODE_ENV=production \
  --env "CORS_ORIGIN=https://tu-dominio.vercel.app" \
  --region fra
```

Sustituye `aurelio104/APlat` por tu usuario/repo y `https://tu-dominio.vercel.app` por la URL del front en Vercel. Tras el deploy, la API quedará en `https://aplat-xxx.koyeb.app` (o el subdominio que asignes).

### Alternativa: despliegue con Dockerfile

Si en Koyeb usas **Dockerfile** (recomendado para Node 24):

1. En **Koyeb Console** → **Create Service**
2. **Source:** GitHub → repo **APlat**, branch **main**
3. **Build:** Dockerfile  
   - **Dockerfile path:** `apps/api/Dockerfile`  
   - **Build context / Root directory:** `apps/api`
4. **Port:** 3001
5. **Variables:** `PORT=3001`, `NODE_ENV=production`, `CORS_ORIGIN=https://tu-front.vercel.app`
6. Deploy

La CLI no expone tan directamente “solo esta carpeta y este Dockerfile”; por eso el flujo con Docker suele hacerse desde la consola. Para usar solo CLI con build tipo “Node” puedes usar el ejemplo anterior (sin Docker).

### Obtener la URL del servicio

En la consola de Koyeb, tu servicio tendrá una URL tipo:

`https://aplat-api-xxx.koyeb.app`

Esa URL es la que pones en Vercel como `NEXT_PUBLIC_APLAT_API_URL`.

---

## 4. Orden recomendado

1. **Git:** commit, crear repo APlat, push (sin _repos).
2. **Koyeb:** crear servicio (Git o Dockerfile), anotar URL de la API.
3. **Vercel:** vincular proyecto con `apps/web`, añadir `NEXT_PUBLIC_APLAT_API_URL`, desplegar con `vercel --cwd apps/web --prod` o por Git.
4. **Probar:** abrir la URL de Vercel, enviar el formulario de contacto y comprobar que llega a la API en Koyeb.

---

## 5. Resumen de URLs

| Dónde | URL (ejemplo) |
|-------|----------------|
| Repo | `https://github.com/aurelio104/APlat` |
| Front (Vercel) | `https://aplat.vercel.app` (o la que te asigne) |
| API (Koyeb) | `https://aplat-api-xxx.koyeb.app` |

CORS en la API debe incluir la URL exacta del front (con `https://` y sin barra final).
