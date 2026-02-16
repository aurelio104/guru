# APlat — Estado del plan e ítems pendientes

**Propósito:** Documento de referencia para el equipo. Qué está hecho y qué falta por implementar.  
**Última actualización:** Febrero 2025

---

## Resumen

| Estado | Cantidad |
|--------|----------|
| ✅ Hecho | 15 |
| ⚠️ Parcial | 4 |
| ❌ Pendiente | 10 |

---

## ✅ HECHO (implementado)

### Presencia y ubicación

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| Check-in BLE | Beacons iBeacon + Eddystone, Web Bluetooth | `ble-scanner.ts`, `BeaconAdmin.tsx` |
| Presencia por zona | Zonas, check-ins, analytics, co-presencia | `presence-store.ts`, `presence.routes.ts` |
| Captive portal WiFi | Portal para visitantes | `/portal`, `app/portal/page.tsx` |
| Dashboard ocupación | Tiempo real, export CSV/JSON | `app/dashboard/presence/` |
| **Tracking activos BLE** | Assets con beacons | `assets-store.ts`, `/api/assets`, `app/dashboard/assets/` |

### PWA y móvil

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| Serwist/Workbox | Service Worker, precache, runtime cache | `app/sw.ts`, `app/serwist/[path]/route.ts` |
| Background Sync | Reintento automático de check-ins fallidos | `app/sw.ts` (BackgroundSyncPlugin) |
| Web Push | Suscripciones, notificaciones | `push-store.ts`, `push.routes.ts`, `DashboardWidgetPush` |
| Página offline | Fallback sin red | `app/~offline/page.tsx` |
| Instalación PWA | InstallPrompt, beforeinstallprompt | `InstallPrompt.tsx` |
| Cola offline Presence | Envío al recuperar red | `presence-offline-queue.ts` |

### Ciberseguridad

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| Rate limiting | 100 req/min en API | `@fastify/rate-limit` en `index.ts` |
| **APlat Security** | Dashboard vulnerabilidades, escaneos | `security-store.ts`, `security.routes.ts`, `/dashboard/security` |
| **GDPR/LOPD** | Checklist de cumplimiento | `gdpr-store.ts`, `gdpr.routes.ts`, `/dashboard/gdpr` |
| **Verificación firma digital** | Validar hash/integridad | `verify-signature.routes.ts`, `POST /api/verify-signature` |
| **Respuesta incidentes** | Playbooks + registro de incidentes | `incidents-store.ts`, `incidents.routes.ts`, `/dashboard/incidents` |

### Integración

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| WhatsApp alertas | Baileys, alertas Presence | `presence-whatsapp-alerts.ts` |
| Passkey/WebAuthn | Login sin contraseña | `webauthn-store.ts`, `DashboardWidgetPasskey` |
| **OCR cédulas** | Tesseract en portal | `OcrCedulaCapture.tsx`, `app/portal/page.tsx` |
| **Reserva de slots** | Recursos, slots, disponibilidad | `slots-store.ts`, `slots.routes.ts`, `/dashboard/slots` |
| **Reportes (base)** | API reportes | `reports-store.ts`, `reports.routes.ts`, `/dashboard/reports` |
| **APlat Commerce** | Catálogo, pedidos | `commerce-store.ts`, `commerce.routes.ts`, `/dashboard/commerce` |

### Infraestructura

| Ítem | Descripción | Archivos / rutas |
|------|-------------|------------------|
| **Geofencing** | API validación lat/lng en radio | `geofencing.routes.ts`, `GET /api/geofencing/validate` |
| **WebSocket** | Ping/pong básico | `index.ts`, `GET /ws` |

---

## ⚠️ PARCIAL (implementado pero incompleto)

| Ítem | Hecho | Falta |
|------|-------|-------|
| **APlat Security** | Dashboard, endpoints, escaneos simulados | Pentest real OWASP+LLM, integración scripts `hack/Auditoria Ciberseguridad` |
| **Geofencing** | API `validate` con haversine | Integración Omac: órdenes de trabajo, `order_id` |
| **APlat Reports** | API, dashboard básico | UI subida Excel, clasificación IA, gráficos |
| **APlat Commerce** | Catálogo, pedidos, API | Bot WhatsApp para pedidos (Baileys) |
| **WebSocket** | Ping/pong | Broadcast de eventos Presence para dashboards en tiempo real |

---

## ❌ PENDIENTE (no implementado)

### Prioridad alta

| Ítem | Descripción | Esfuerzo est. |
|------|-------------|---------------|
| **Cierre comercial Presence** | Documentación, demo, precios, firma producto | 1–2 sem |
| **Pentest IA real** | OWASP Top 10 + LLM, integrar repos externos | 6–8 sem |

### Prioridad media

| Ítem | Descripción | Esfuerzo est. |
|------|-------------|---------------|
| **Reports: subida Excel + IA** | UI upload, análisis columnas, gráficos | 4–6 sem |
| **Geofencing Omac** | Validación llegada a punto de trabajo por orden | 3–4 sem |
| **Commerce: bot WhatsApp** | Pedidos vía chat con Baileys | 2–4 sem |
| **WebSocket broadcast** | Eventos Presence en vivo para dashboards | 1–2 sem |

### Prioridad baja / largo plazo

| Ítem | Descripción | Esfuerzo est. |
|------|-------------|---------------|
| **Integración Fortinet / SOC** | Monitoreo P-CS/OACI, Ciber → APlat Security | 6–8 sem |
| **Evaluación seguridad por dominio** | Evaluación por dominio de aplicación | 4–6 sem |
| **Pago Móvil** | Verificación y auditoría de pagos móviles | No definido |

---

## Rutas API implementadas (referencia rápida)

| Módulo | Rutas |
|--------|-------|
| Presence | `/api/presence/*`, `/api/zones/*`, `/api/check-ins/*` |
| Push | `/api/push/subscribe`, `/api/push/send` |
| Assets | `GET/POST /api/assets`, `POST /api/assets/sighting` |
| Security | `GET /api/security/vulnerabilities`, `GET /api/security/scans`, `POST /api/security/scan` |
| Slots | `GET/POST /api/slots/resources`, `GET/POST /api/slots` |
| Reports | `GET/POST /api/reports` |
| GDPR | `GET /api/gdpr/checklist`, `PUT /api/gdpr/checklist/:id` |
| Geofencing | `GET /api/geofencing/validate?lat=&lng=&target_lat=&target_lng=&radius_m=` |
| Verify | `POST /api/verify-signature` |
| Incidents | `GET/POST /api/incidents/playbooks`, `GET/POST /api/incidents` |
| Commerce | `GET/POST /api/commerce/products`, `GET/POST /api/commerce/orders` |
| WebSocket | `GET /ws` |

---

## Variables de entorno necesarias

| Variable | Uso |
|----------|-----|
| `APLAT_JWT_SECRET` | JWT auth |
| `APLAT_VAPID_PUBLIC_KEY` | Web Push (cliente) |
| `APLAT_VAPID_PRIVATE_KEY` | Web Push (servidor) |
| `APLAT_DATA_PATH` | Directorio de datos (stores JSON) |

Generar VAPID: `npx web-push generate-vapid-keys`

---

## Cómo actualizar este documento

Al completar un ítem:
1. Mover de "Pendiente" o "Parcial" a "Hecho"
2. Añadir archivos/rutas relevantes
3. Actualizar la fecha de "Última actualización"
