# GURU — Plan de acción: ecosistema completo para venta B2B

**Objetivo:** Completar la plataforma como **ecosistema listo para ofrecer a otras empresas**: catálogo de servicios, paquetes, membresías mensuales, costo único + suscripción por servicio, y todos los módulos (Presence, Ciberseguridad + Jcloud, Reportes, Commerce, etc.) operativos.

**Última actualización:** Febrero 2026

---

## 1. Visión comercial

### Modelo de venta

- **Catálogo de servicios:** cada servicio del ecosistema (Presence, Ciberseguridad, Reportes, Commerce, Slots, etc.) es un ítem seleccionable.
- **Precios por servicio:**
  - **Costo único (opcional):** pago inicial por activación/setup.
  - **Membresía mensual:** precio recurrente por servicio/mes.
- **Flujo cliente (empresa):**
  1. Elige: “Quiero Servicio 1, Servicio 2, Servicio 4”.
  2. El sistema muestra: total costo único + total mensual (suma de cada servicio elegido).
  3. Confirmación → contrato/suscripción mensual acorde a los servicios seleccionados.

### Servicios del ecosistema (catálogo objetivo)

| ID | Servicio | Descripción breve | Hoy |
|----|----------|-------------------|-----|
| 1 | **Presence** | Check-in BLE/NFC, zonas, portal, ocupación, alertas WhatsApp, export, (futuro: assets, PWA completa) | Parcial |
| 2 | **Ciberseguridad** | GURU Security (vulnerabilidades, escaneos), GDPR/LOPD, incidentes, verificación firma, **Jcloud** | Por hacer |
| 3 | **Reportes** | Subida Excel, análisis, gráficos, dashboard reportes | Por hacer |
| 4 | **Commerce** | Catálogo, pedidos, (futuro: bot WhatsApp pedidos) | Por hacer |
| 5 | **Slots** | Reserva de recursos y slots, disponibilidad | Por hacer |
| 6 | **Geofencing** | Validación lat/lng en radio (ej. órdenes de trabajo) | Por hacer |
| 7 | **Web Push / PWA** | Notificaciones, offline, Background Sync | Por hacer |
| 8 | **Otros** | OCR cédulas (portal), Verify firma, integraciones (Fortinet/SOC, etc.) | Por hacer |

*Jcloud: integrar como parte del módulo Ciberseguridad (según definición de producto/servicio que tengáis).*

---

## 2. Fases del plan de acción

### Fase 0 — Capa comercial (catálogo + paquetes + totales)

**Objetivo:** Que una empresa pueda “elegir servicios” y ver **costo único total + suscripción mensual total**.

| # | Tarea | Entregable | Est. |
|---|--------|------------|------|
| 0.1 | **Catálogo de servicios** en BD/API | Tabla o store `service_catalog`: id, name, slug, description, price_one_time, price_monthly, active | 1 sem |
| 0.2 | **API catálogo** | `GET /api/catalog/services` (público o con auth); opcional `GET /api/catalog/quote?ids=1,2,4` → { totalOneTime, totalMonthly, items[] } | 0,5 sem |
| 0.3 | **UI selección de servicios** | Página o flujo: listado de servicios con checkbox, al elegir 1,2,4 → resumen: total único + total mensual | 1 sem |
| 0.4 | **Vincular suscripciones actuales al catálogo** | Que las suscripciones por cliente/empresa referencien `catalog_service_id` y opcionalmente `price_one_time`/`price_monthly` para histórico y facturación | 1 sem |

**Resultado Fase 0:** Flujo “selecciono servicio 1, 2, 4 → me da monto total y suscripción mensual” operativo.

---

### Fase 1 — Presence completo

**Objetivo:** Presence como producto cerrado: todo lo ya planificado + lo que falta en el repo.

| # | Tarea | Entregable | Est. |
|---|--------|------------|------|
| 1.1 | **Tracking activos BLE** | `assets-store.ts`, `/api/assets`, CRUD assets, sighting; UI `app/dashboard/assets/` | 2–3 sem |
| 1.2 | **PWA completa** | Serwist/Workbox: `app/sw.ts`, `app/serwist/[path]/route.ts`, precache, runtime cache | 1–2 sem |
| 1.3 | **Background Sync** | Reintento de check-ins fallidos desde el Service Worker | 1 sem |
| 1.4 | **Web Push** | VAPID, `push-store.ts`, `push.routes.ts`, `/api/push/subscribe`, `/api/push/send`, `DashboardWidgetPush` | 2–3 sem |
| 1.5 | **Página offline** | `app/~offline/page.tsx` como fallback sin red | 0,5 sem |
| 1.6 | **WebSocket** | `GET /ws` en API, ping/pong; opcional: broadcast eventos Presence para dashboards en tiempo real | 1–2 sem |
| 1.7 | **OCR cédulas en portal** | Tesseract, `OcrCedulaCapture.tsx`, integración en `app/portal/page.tsx` | 1–2 sem |

**Resultado Fase 1:** Presence ofrecible como “servicio completo” (check-in, zonas, portal, ocupación, assets, PWA, push, offline, WebSocket, OCR).

---

### Fase 2 — Ciberseguridad (GURU Security + Jcloud)

**Objetivo:** Módulo Ciberseguridad listo para vender: vulnerabilidades, escaneos, cumplimiento, incidentes, verificación firma e **integración Jcloud**.

| # | Tarea | Entregable | Est. |
|---|--------|------------|------|
| 2.1 | **GURU Security** | `security-store.ts`, `security.routes.ts`, `/api/security/vulnerabilities`, `/api/security/scans`, `POST /api/security/scan`; UI `/dashboard/security` | 3–4 sem |
| 2.2 | **GDPR/LOPD** | `gdpr-store.ts`, `gdpr.routes.ts`, checklist cumplimiento; UI `/dashboard/gdpr` | 2 sem |
| 2.3 | **Verificación firma digital** | `verify-signature.routes.ts`, `POST /api/verify-signature` (validar hash/integridad) | 1–2 sem |
| 2.4 | **Respuesta a incidentes** | `incidents-store.ts`, `incidents.routes.ts`, playbooks, registro de incidentes; UI `/dashboard/incidents` | 2–3 sem |
| 2.5 | **Integración Jcloud** | Definir alcance (auth, APIs, panel, etc.) e implementar integración en el módulo Ciberseguridad | Por definir |

**Resultado Fase 2:** Ciberseguridad como servicio vendible (Security + GDPR + incidentes + verify + Jcloud).

---

### Fase 3 — Reportes, Commerce, Slots, Geofencing

**Objetivo:** Resto de servicios del catálogo implementados y enlazables al modelo de paquetes/membresías.

| # | Tarea | Entregable | Est. |
|---|--------|------------|------|
| 3.1 | **Reportes (base)** | `reports-store.ts`, `reports.routes.ts`, `/api/reports`, UI `/dashboard/reports` | 2–3 sem |
| 3.2 | **Reportes: Excel + IA** | UI subida Excel, análisis columnas, clasificación IA, gráficos | 4–6 sem |
| 3.3 | **Slots** | `slots-store.ts`, `slots.routes.ts`, recursos, slots, disponibilidad; UI `/dashboard/slots` | 3–4 sem |
| 3.4 | **GURU Commerce** | `commerce-store.ts`, `commerce.routes.ts`, catálogo, pedidos; UI `/dashboard/commerce` | 4–6 sem |
| 3.5 | **Commerce: bot WhatsApp** | Pedidos vía chat con Baileys | 2–4 sem |
| 3.6 | **Geofencing** | `geofencing.routes.ts`, `GET /api/geofencing/validate?lat=&lng=&target_lat=&target_lng=&radius_m=` | 1–2 sem |
| 3.7 | **Geofencing Omac** | Integración órdenes de trabajo (validación llegada a punto) | 3–4 sem |

**Resultado Fase 3:** Todos los servicios del catálogo (Reportes, Commerce, Slots, Geofencing) disponibles para incluir en paquetes y membresías.

---

### Fase 4 — Cierre producto y venta

**Objetivo:** Documentación, precios, demo y proceso de firma para vender el ecosistema.

| # | Tarea | Entregable | Est. |
|---|--------|------------|------|
| 4.1 | **Cierre comercial Presence** | Documentación, demo, precios, firma producto Presence | 1–2 sem |
| 4.2 | **Precios y paquetes por servicio** | Definir y cargar en catálogo: price_one_time y price_monthly por cada servicio (Presence, Ciberseguridad, etc.) | 0,5 sem |
| 4.3 | **Flujo de alta de empresa/cliente** | Alta de “empresa” que contrata N servicios → creación de suscripciones mensuales acorde al catálogo | 1–2 sem |
| 4.4 | **Pentest / seguridad** | Pentest real (OWASP + LLM), integración con GURU Security; opcional integración Fortinet/SOC a largo plazo | 6–8 sem (paralelo) |

**Resultado Fase 4:** Ecosistema vendible con precios claros, flujo “selecciono 1, 2, 4 → total + mensual” y proceso de contratación.

---

## 3. Resumen por prioridad (orden sugerido)

1. **Fase 0** — Catálogo + cotización (costo único + mensual) para “servicio 1, 2, 4”.
2. **Fase 1** — Completar Presence (assets, PWA, push, offline, WebSocket, OCR).
3. **Fase 2** — Ciberseguridad completo + Jcloud.
4. **Fase 3** — Reportes, Commerce, Slots, Geofencing.
5. **Fase 4** — Cierre comercial, precios, alta de empresas y (en paralelo) pentest/seguridad.

---

## 4. Jcloud

- **Estado:** No hay referencias en el repo hoy; se deja como ítem explícito del módulo Ciberseguridad.
- **Acción:** Definir con producto/negocio: qué es Jcloud (producto propio, proveedor externo, APIs, auth, etc.) y añadir la tarea 2.5 con alcance y estimación cuando esté definido.

---

## 5. Relación con PLAN-ESTADO-Y-PENDIENTES.md

- **PLAN-ESTADO-Y-PENDIENTES.md:** Estado actual del código (qué está hecho / qué falta por módulo).
- **Este documento (PLAN-ACCION-ECOSISTEMA):** Plan de acción para tener el **ecosistema completo** y la **capa comercial** (paquetes, membresías mensuales, total único + total mensual por servicios elegidos).

Al completar cada ítem de este plan, actualizar también PLAN-ESTADO-Y-PENDIENTES.md (mover ítems de Pendiente a Hecho y actualizar rutas/variables).

---

## 6. Checklist rápido “Ecosistema listo para vender”

- [ ] Catálogo de servicios en API con precio único y mensual.
- [ ] UI: seleccionar servicios (ej. 1, 2, 4) y ver total único + total mensual.
- [ ] Presence completo (incl. assets, PWA, push, offline, WebSocket, OCR).
- [ ] Ciberseguridad completo (Security, GDPR, incidentes, verify, Jcloud).
- [ ] Reportes, Commerce, Slots, Geofencing implementados y enlazables al catálogo.
- [ ] Precios y paquetes definidos y cargados en catálogo.
- [ ] Flujo de alta de empresa/cliente que contrata N servicios y genera suscripciones mensuales.

Cuando todos estén marcados, el ecosistema estará en condiciones de ofrecerse a otras empresas con paquetes y membresías mensuales acorde a la planificación inicial.
