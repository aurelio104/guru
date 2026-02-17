# GURU — Estado del plan e ítems pendientes

**Propósito:** Documento de referencia para el equipo. Qué está hecho y qué falta por implementar.  
**Última actualización:** Febrero 2026

> **Plataforma inteligente / autocurable:** Ver [PLATAFORMA-INTELIGENTE.md](./PLATAFORMA-INTELIGENTE.md) para la visión de auto-desarrollo, health enriquecido, estado de plataforma y error boundaries.

---

## Resumen

| Estado | Cantidad |
|--------|----------|
| ✅ Hecho | 30 |
| ⚠️ Parcial | 0 |
| ❌ Pendiente | 4 |

*Revisión frente al código: muchas funcionalidades listadas antes como "Hecho" no existen en el repo; este documento refleja el estado real.*

---

## ✅ HECHO (implementado y verificado en el repo)

### Presencia y ubicación

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| Check-in BLE | Beacons iBeacon + Eddystone, Web Bluetooth | `apps/web/lib/ble-scanner.ts`, `apps/web/components/presence/BeaconAdmin.tsx` |
| Presencia por zona | Zonas, check-ins, analytics, co-presencia | `apps/api/src/presence-store.ts`, `apps/api/src/presence.routes.ts` |
| Captive portal WiFi | Portal para visitantes (check-in por nombre/documento) | `apps/web/app/portal/page.tsx` |
| Dashboard ocupación | Tiempo real, export CSV/JSON, occupancy, chart-data | `apps/web/app/dashboard/presence/page.tsx`, `GET /api/presence/export`, `/api/presence/occupancy`, `/api/presence/chart-data` |
| Admin beacons y NFC | Beacons y tags NFC por sitio | `BeaconAdmin.tsx`, `NfcTagAdmin.tsx`, `/api/presence/admin/beacons`, `/api/presence/admin/nfc-tags` |
| Cola offline Presence | Envío al recuperar red | `apps/web/lib/presence-offline-queue.ts` |
| WhatsApp alertas Presence | Alertas de presencia vía Baileys | `apps/api/src/presence-whatsapp-alerts.ts`, cron/admin presence-alerts |
| Instalación PWA | InstallPrompt, beforeinstallprompt | `apps/web/components/ui/InstallPrompt.tsx` |
| **Tracking activos BLE** | Assets con beacons: store, API, dashboard | `apps/api/src/assets-store.ts`, `assets.routes.ts`, `apps/web/app/dashboard/assets/page.tsx`, `GET/POST /api/assets`, `POST /api/assets/sighting`, etc. |
| **Catálogo comercial** | Servicios, cotización única/mensual | `apps/api/src/catalog-store.ts`, `GET /api/catalog/services`, `GET /api/catalog/quote?ids=...`, `apps/web/app/servicios/page.tsx` |
| **Geofencing** | Validación lat/lng en radio (haversine) | `apps/api/src/geofencing.routes.ts`, `GET /api/geofencing/validate` |
| **Verificación firma digital** | Validar hash SHA256/384/512 | `apps/api/src/verify-signature.routes.ts`, `POST /api/verify-signature` |
| **Serwist/Workbox PWA** | Service Worker, precache, fallback offline | `apps/web/next.config.ts`, `apps/web/app/sw.ts`, `@serwist/next` |
| **Página offline** | Fallback sin red | `apps/web/app/~offline/page.tsx` |
| **GURU Security** | Vulnerabilidades y escaneos | `apps/api/src/security-store.ts`, `security.routes.ts`, `apps/web/app/dashboard/security/page.tsx`, `/api/security/*` |
| **GDPR/LOPD** | Checklist cumplimiento | `apps/api/src/gdpr-store.ts`, `gdpr.routes.ts`, `apps/web/app/dashboard/gdpr/page.tsx`, `/api/gdpr/checklist` |
| **Respuesta incidentes** | Playbooks e incidentes | `apps/api/src/incidents-store.ts`, `incidents.routes.ts`, `apps/web/app/dashboard/incidents/page.tsx`, `/api/incidents/*` |
| **Slots** | Recursos y reservas | `apps/api/src/slots-store.ts`, `slots.routes.ts`, `apps/web/app/dashboard/slots/page.tsx`, `/api/slots/*` |
| **Reportes (base)** | Reportes y metadatos | `apps/api/src/reports-store.ts`, `reports.routes.ts`, `apps/web/app/dashboard/reports/page.tsx`, `/api/reports` |
| **GURU Commerce** | Productos y pedidos | `apps/api/src/commerce-store.ts`, `commerce.routes.ts`, `apps/web/app/dashboard/commerce/page.tsx`, `/api/commerce/*` |
| **WebSocket** | Ping/pong y broadcast Presence | `@fastify/websocket`, `GET /ws`, `ws-broadcast.ts`, broadcast en `presence.routes.ts` |
| **Background Sync** | Reintento check-ins desde SW al recuperar red | `app/sw.ts` (sync), `presence-offline-queue.ts` (registerSyncForPresence), check-in page (message listener) |
| **Web Push** | VAPID, subscribe/send, widget | `push-store.ts`, `push.routes.ts`, `DashboardWidgetPush`, `app/sw.ts` (push), `/api/push/*` |
| **OCR cédulas** | Tesseract en portal | `OcrCedulaCapture.tsx`, integrado en `app/portal/page.tsx` |
| **Reports Excel** | Subida, parseo, tabla | `POST /api/reports/upload-excel`, xlsx, `dashboard/reports` con upload y tabla |
| **Geofencing Omac** | Órdenes y validación llegada | `omac-store.ts`, `GET/POST /api/geofencing/omac/orders`, `POST /api/geofencing/omac/validate-arrival` |
| **Commerce WhatsApp** | Notificación al crear pedido | `GURU_COMMERCE_NOTIFY_PHONE`, `sendWhatsAppMessage` en `commerce.routes.ts` |
| **Cierre comercial** | Página producto y precios | `app/producto/page.tsx`, enlace en Nav |

### Auth e integración (API principal)

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| Rate limiting | 100 req/min + lockout login 5 fallos → 15 min | `apps/api/src/index.ts` |
| Passkey/WebAuthn | Login sin contraseña | `webauthn-store.ts`, `DashboardWidgetPasskey`, `/api/auth/webauthn/*` |

---

## ❌ PENDIENTE (no implementado)

### Prioridad alta

| Ítem | Descripción | Esfuerzo est. |
|------|-------------|---------------|
| **Pentest IA real** | OWASP Top 10 + LLM, integrar repos externos | 6–8 sem |

### Prioridad baja / largo plazo

| Ítem | Descripción | Esfuerzo est. |
|------|-------------|---------------|
| **Integración Fortinet / SOC** | Monitoreo P-CS/OACI, Ciber → GURU Security | 6–8 sem |
| **Evaluación seguridad por dominio** | Evaluación por dominio de aplicación | 4–6 sem |
| **Pago Móvil** | Verificación y auditoría de pagos móviles | No definido |

---

## Rutas API implementadas (referencia rápida)

| Módulo | Rutas (reales en el repo) |
|--------|---------------------------|
| **Presence** | `/api/presence/health`, `/api/presence/check-in`, `/api/presence/check-out/:id`, `/api/presence/events`, `/api/presence/active`, `/api/presence/zones`, `/api/presence/analytics`, `/api/presence/chart-data`, `/api/presence/export`, `/api/presence/co-presence`, `/api/presence/occupancy`, `/api/presence/validate-zone`, `/api/presence/admin/sites`, `/api/presence/admin/zones`, `/api/presence/admin/beacons`, `/api/presence/admin/nfc-tags` |
| **Auth** | `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/change-password`, `/api/auth/webauthn/*`, `/api/auth/phone/*` |
| **Dashboard** | `/api/dashboard/connections`, `/api/dashboard/visitors` |
| **WhatsApp** | `/api/whatsapp/status`, `/api/whatsapp/qr`, `/api/whatsapp/clean`, `/api/whatsapp/send` |
| **Admin** | `/api/admin/subscriptions`, `/api/admin/process-cutoffs`, `/api/admin/presence-alerts`, `/api/admin/mark-subscription-paid`, `/api/admin/audit-logs` |
| **Cron** | `/api/cron/process-cutoffs`, `/api/cron/presence-alerts` |
| **Otros** | `/api/analytics/visit`, `/api/contact`, `/api/health`, `/api/client/profile`, `/api/client/subscriptions` |
| **Catálogo** | `GET /api/catalog/services`, `GET /api/catalog/quote?ids=...` |
| **Geofencing** | `GET /api/geofencing/validate?lat=&lng=&target_lat=&target_lng=&radius_m=` |
| **Verify-signature** | `POST /api/verify-signature` (body: data, expectedHash, algorithm) |
| **Assets** | `GET/POST /api/assets`, `GET/DELETE /api/assets/:id`, `POST /api/assets/sighting`, `GET /api/assets/:id/sightings`, `GET /api/assets/sightings/recent` |
| **Security** | `GET/POST/PATCH/DELETE /api/security/vulnerabilities`, `GET/POST /api/security/scans`, `POST /api/security/scan` |
| **GDPR** | `GET /api/gdpr/checklist`, `PATCH /api/gdpr/checklist/:id` |
| **Incidents** | `GET/POST /api/incidents`, `GET/PATCH /api/incidents/:id`, `GET /api/incidents/playbooks` |
| **Slots** | `GET/POST /api/slots/resources`, `GET /api/slots/resources/:id/bookings`, `POST /api/slots/bookings`, `POST /api/slots/bookings/:id/cancel`, `GET /api/slots/bookings/recent` |
| **Reports** | `GET/POST/PATCH/DELETE /api/reports`, `GET /api/reports/:id` |
| **Commerce** | `GET/POST /api/commerce/products`, `GET/POST /api/commerce/orders`, `PATCH /api/commerce/orders/:id/status` |
| **WebSocket** | `GET /ws` (ping/pong, broadcast presence_checkin) |
| **Push** | `GET /api/push/vapid-public`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe`, `POST /api/push/send` |
| **Reports** | `POST /api/reports/upload-excel` (multipart) |
| **Geofencing Omac** | `GET/POST /api/geofencing/omac/orders`, `POST /api/geofencing/omac/validate-arrival` |

**No implementadas:** —

**Nota pruebas:** El script `scripts/test-production-api.sh` usa por defecto la API en Koyeb. Las pruebas 11–15 (catalog, quote, geofencing, verify-signature, assets) solo pasan con una API que tenga estas rutas desplegadas. Para probar todo en local: `API_URL=http://localhost:3001 ./scripts/test-production-api.sh` (con la API local en marcha).

---

## Variables de entorno necesarias

| Variable | Uso |
|----------|-----|
| `GURU_JWT_SECRET` | JWT auth (obligatorio en producción) |
| `GURU_ADMIN_PASSWORD` | Login admin (obligatorio en producción) |
| `GURU_DATA_PATH` | Directorio de datos (SQLite, stores) |
| `GURU_WEBAUTHN_STORE_PATH` | Persistencia Passkey |
| `GURU_WHATSAPP_AUTH_PATH` | Sesión WhatsApp (Baileys) |
| `CORS_ORIGIN` | Origen permitido para CORS (frontend) |
| `GURU_CRON_SECRET` | Cron process-cutoffs / presence-alerts |

Para **Web Push** (cuando se implemente): `GURU_VAPID_PUBLIC_KEY`, `GURU_VAPID_PRIVATE_KEY` — generar con `npx web-push generate-vapid-keys`.

---

## Cómo actualizar este documento

Al completar un ítem:
1. Mover de "Pendiente" a "Hecho" y añadir archivos/rutas reales.
2. Actualizar la tabla "Rutas API implementadas".
3. Actualizar la fecha de "Última actualización" y los contadores del Resumen.
