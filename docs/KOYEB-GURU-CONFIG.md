# Configuración Koyeb GURU API

Copia completa de la configuración del servicio GURU en Koyeb.

## App y servicio

- **App:** guru
- **Servicio:** guru
- **URL:** https://guru-aurelio104-9ad05a6a.koyeb.app
- **Estado:** HEALTHY

## Origen

- **Repositorio:** github.com/aurelio104/Guru
- **Rama:** main
- **Builder:** Docker
- **Dockerfile:** Dockerfile.api (raíz del repo)

## Variables de entorno

| Variable | Valor |
|----------|-------|
| GURU_JWT_SECRET | (secreto 64 chars hex) |
| GURU_ADMIN_PASSWORD | APlat2025! |
| GURU_WEBAUTHN_RP_ID | aplat.vercel.app |
| GURU_WEBAUTHN_STORE_PATH | /data/webauthn-store.json |
| GURU_WHATSAPP_AUTH_PATH | /whatsapp-auth |
| CORS_ORIGIN | https://aplat.vercel.app |
| NODE_ENV | production |
| PORT | 3001 |

## Volúmenes

| Volumen | Path |
|---------|------|
| guru-api-data | /data |
| auth-bot1-guru | /whatsapp-auth |

## Puertos y health

- **Puerto:** 3001 (HTTP)
- **Health check:** TCP 3001, grace 5s, interval 30s
- **Ruta:** / → 3001

## Región

- was (Washington D.C.)

## Crear desde CLI

```bash
koyeb apps init guru \
  --git github.com/aurelio104/Guru \
  --git-branch main \
  --git-builder docker \
  --git-docker-dockerfile Dockerfile.api \
  --ports 3001:http \
  --routes "/:3001" \
  --instance-type nano \
  --regions was \
  --checks 3001:tcp \
  --env "GURU_JWT_SECRET=<tu-secret>" \
  --env "GURU_ADMIN_PASSWORD=<tu-password>" \
  --env "GURU_WEBAUTHN_RP_ID=aplat.vercel.app" \
  --env "GURU_WEBAUTHN_STORE_PATH=/data/webauthn-store.json" \
  --env "GURU_WHATSAPP_AUTH_PATH=/whatsapp-auth" \
  --env "CORS_ORIGIN=https://aplat.vercel.app" \
  --env "NODE_ENV=production" \
  --env "PORT=3001" \
  --volumes guru-api-data:/data \
  --volumes auth-bot1-guru:/whatsapp-auth
```

## Frontend (Vercel)

Actualiza `NEXT_PUBLIC_GURU_API_URL` en Vercel:

```
NEXT_PUBLIC_GURU_API_URL=https://guru-aurelio104-9ad05a6a.koyeb.app
```
