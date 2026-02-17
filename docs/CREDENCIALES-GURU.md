# Credenciales GURU — Resumen

## Master / Admin (rol master)

Para iniciar sesión como administrador en el dashboard:

| Entorno | Email | Contraseña | Dónde configurar |
|---------|-------|------------|------------------|
| **Local** | `gurumaster@guru.local` | `Maracay.1` | `apps/api/.env` |
| **Producción (Koyeb)** | `gurumaster@guru.local` | `Maracay.1` | Variables de entorno del servicio Koyeb |

**URLs de login:**
- Local: http://localhost:3000/login (con API en 3001)
- Producción: https://guru.vercel.app/login (o tu dominio Vercel)

---

## Desarrollo (valores por defecto)

Si no existe `.env`, la API usa:
- **Email:** `admin@guru.local`
- **Contraseña:** `GURU2025!-SOLO-DESARROLLO`

Ver `apps/api/env.example`.

---

## Clientes (rol client)

Los clientes se registran en `/register` o vía invitación por WhatsApp. Cada uno tiene su propio email y contraseña (o temporal que deben cambiar).

---

## Otras credenciales

| Recurso | Variable / Ubicación |
|---------|----------------------|
| **JWT** | `GURU_JWT_SECRET` en Koyeb / `.env` |
| **Vercel CLI** | `VERCEL_TOKEN` en `.env.vercel` |
| **Passkey** | Solo master; se registra en el dashboard |
| **WhatsApp** | Sesión en volumen `auth-bot1-guru` |

---

## Scripts de configuración

- **Koyeb:** `./scripts/configure-gurumaster-production.sh` — aplica credenciales master en producción
- **Vercel:** `./scripts/vercel-set-api-url.sh` — configura `NEXT_PUBLIC_GURU_API_URL`
- **Tests producción:** `ADMIN_EMAIL` y `ADMIN_PASSWORD` como variables de entorno para `test-production-api.sh` y `test-security.sh`
