# Reconectar Vercel y Koyeb al repo Guru

Si tras un `git push` **no se actualiza** el frontend (Vercel) o la API (Koyeb), es porque esos servicios siguen conectados al repositorio anterior (**APlat**) en lugar del nuevo (**Guru**).

## Verificar conexión Git

```bash
./scripts/verificar-conexion-git.sh
```

Si el script indica que local y origin están sincronizados, el push a GitHub está funcionando. El problema está en Vercel/Koyeb.

---

## 1. Reconectar Vercel al repo Guru

### Opción A: Cambiar el repo del proyecto existente

1. Ve a [vercel.com](https://vercel.com) → tu proyecto (web, guru, etc.)
2. **Settings** → **Git**
3. Si muestra `aurelio104/APlat`, haz clic en **Disconnect**
4. **Connect Git Repository** → selecciona `aurelio104/Guru`
5. **Root Directory:** `apps/web`
6. Guarda

### Opción B: Crear proyecto nuevo desde Guru

1. **Add New** → **Project**
2. **Import** → `aurelio104/Guru`
3. **Root Directory:** `apps/web`
4. Añade `NEXT_PUBLIC_GURU_API_URL` = `https://guru-aurelio104-8e2f096a.koyeb.app`
5. **Deploy**

---

## 2. Reconectar Koyeb al repo Guru

1. Ve a [console.koyeb.com](https://console.koyeb.com)
2. Tu app **guru** → servicio **guru**
3. **Settings** → **Source** (o **Build**)
4. Cambia el repositorio a: `aurelio104/Guru`
5. **Branch:** `main`
6. **Build context / Root:** `apps/api` (o según tu Dockerfile)
7. Guarda y redeploy

---

## 3. Comprobar webhooks en GitHub

1. GitHub → [github.com/aurelio104/Guru](https://github.com/aurelio104/Guru) → **Settings** → **Webhooks**
2. Deberían aparecer webhooks de Vercel y Koyeb apuntando a Guru
3. Si no hay, Vercel/Koyeb los crearán al reconectar el repo

---

## Resumen

| Servicio | Repo correcto        | Qué comprobar                         |
|----------|----------------------|---------------------------------------|
| Git      | aurelio104/Guru      | `git remote -v` → origin = Guru       |
| Vercel   | aurelio104/Guru      | Settings → Git → repo conectado       |
| Koyeb    | aurelio104/Guru      | Source → Repository                   |
