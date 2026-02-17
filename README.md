# GURU

Plataforma integrada de ciberseguridad y gestión con autenticación avanzada (Passkey), WhatsApp, dashboard y análisis.

## ✨ Características

- 🔐 **Autenticación multi-factor**: Email/password + Passkey (WebAuthn)
- 📊 **Dashboard**: Métricas, conexiones, visitas, suscripciones
- 📬 **WhatsApp**: Integración con Baileys para notificaciones y gestión
- 👥 **Gestión de clientes**: Perfiles, suscripciones, pagos
- 📈 **Analytics**: Registro de visitas (público) y conexiones (autenticado)
- 🔒 **Seguridad completa**: Rate limiting, Helmet, validación, sanitización, auditoría

## 🔒 Seguridad

GURU implementa múltiples capas de seguridad:

- **Rate limiting**: 100 req/min (protección DDoS y fuerza bruta)
- **Headers**: Helmet con CSP, HSTS, X-Frame-Options
- **Validación**: Email, contraseña, longitud de campos
- **Sanitización**: Eliminación de caracteres peligrosos
- **Hashing**: scrypt con salt aleatorio
- **Auditoría**: Registro completo en `guru-audit.db`
- **JWT**: HS256 con secret fuerte
- **Persistencia**: Guardado periódico + al salir + escritura atómica

Ver [docs/SEGURIDAD-GURU.md](docs/SEGURIDAD-GURU.md) para detalles completos.

## 🏗️ Estructura

```
GURU/
├── apps/
│   ├── api/          # Backend (Fastify + SQLite + Auditoría)
│   └── web/          # Frontend (Next.js 15 + Tailwind 4)
├── docs/             # Documentación
├── scripts/          # Scripts de pruebas y deploy
└── .github/          # CI/CD workflows
```

## Cómo ejecutar

```bash
# Desde la raíz (con pnpm)
pnpm install
pnpm dev

# O desde apps/web
cd apps/web && pnpm install && pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Formulario de contacto:** para que envíe a la API, en `apps/web` crea `.env.local` con `NEXT_PUBLIC_GURU_API_URL=http://localhost:3001` y en otra terminal ejecuta `pnpm dev:api` (o `cd apps/api && pnpm dev`).

**Producción:** frontend en Vercel (`vercel --cwd apps/web --prod` tras `vercel login`); API en Koyeb (ya desplegada). Ver `docs/DEPLOY-PRODUCCION.md`.

## 🧪 Pruebas

```bash
# Pruebas de persistencia (clients, profiles, subscriptions)
cd apps/api && pnpm test:persist

# Pruebas de seguridad (rate limiting, headers, validación, auditoría)
./scripts/test-security.sh http://localhost:3001

# Pruebas de API en producción
./scripts/test-production-api.sh
```

## 📚 Documentación

- [Seguridad](docs/SEGURIDAD-GURU.md) - Guía completa de seguridad y auditoría
- [Deploy en Koyeb](docs/DEPLOY-KOYEB.md) - Configuración de variables y volúmenes
- [Deploy en producción](docs/DEPLOY-PRODUCCION.md) - Flujo completo de deploy
- [Negocio](docs/NEGOCIO-GURU.md) - Modelo de negocio y valoración
- [Servicios](docs/servicios.md) - Servicios ofrecidos
- [Portafolio](docs/portafolio.md) - Proyectos realizados

## Repositorio y producción

- **GitHub:** [github.com/aurelio104/Guru](https://github.com/aurelio104/Guru)
- **Frontend (Vercel):** [guru.vercel.app](https://guru.vercel.app)
- **API (Koyeb):** https://guru-aurelio104-9ad05a6a.koyeb.app
