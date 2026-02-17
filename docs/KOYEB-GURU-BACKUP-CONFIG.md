# Backup: Configuración actual del despliegue Guru en Koyeb

**Copiado el:** 2026-02-17  
**Antes de eliminar y recrear el despliegue.**

## App y servicio

| Campo | Valor |
|-------|-------|
| App | guru |
| Servicio | guru |
| URL | https://guru-aurelio104-8e2f096a.koyeb.app |

## Origen (Git)

| Campo | Valor |
|-------|-------|
| Repositorio | github.com/aurelio104/Guru |
| Rama | main |
| Builder | Docker |
| Dockerfile | Dockerfile.api |

## Variables de entorno

| Variable | Valor nuevo |
|----------|-------------|
| PORT | 3001 |
| NODE_ENV | production |
| CORS_ORIGIN | https://guru.vercel.app |
| GURU_ADMIN_EMAIL | gurumaster@guru.local |
| GURU_ADMIN_PASSWORD | Maracay.1 |
| GURU_WEBAUTHN_RP_ID | guru.vercel.app |
| GURU_WEBAUTHN_STORE_PATH | /data/webauthn-store.json |
| GURU_WHATSAPP_AUTH_PATH | /whatsapp-auth |

## Volúmenes

| Nombre | Path |
|--------|------|
| guru-api-data | /data |
| auth-bot1-guru | /whatsapp-auth |

## Infraestructura

Región: was, Puerto: 3001, Health: tcp 3001, Instance: nano
