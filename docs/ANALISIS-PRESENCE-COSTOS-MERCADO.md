# Análisis exhaustivo: Presence — Lo que tenemos y costos en el mercado

**Paquete:** Presence — Check-in BLE/NFC, zonas, portal, ocupación, alertas WhatsApp, export.  
**Precio propuesto en GURU:** $99/mes.

---

## 1. Inventario exacto de lo que tiene la plataforma GURU (Presence)

### 1.1 Canales de check-in (5)

| Canal | Implementado | Descripción técnica | Ubicación en código |
|-------|--------------|---------------------|----------------------|
| **Geolocalización** | Sí | Point-in-polygon (GeoJSON), Haversine, umbral de precisión por zona. Validación lat/lng dentro de polígono. | `presence-store`, `intelligence-engine` (isPointInPolygon, haversineDistanceMeters), `POST /api/presence/check-in` (channel: geolocation) |
| **QR** | Sí | URL única por zona; un toque abre la PWA y registra check-in con `zone_id` en query. | `presence.routes`, dashboard genera QR por zona (`/presence/check-in?site_id=...&zone_id=...`) |
| **WiFi Portal (captive)** | Sí | Portal público: formulario nombre/email/documento/visiting; redirección desde router (ej. CUDY AP1200). Check-in con channel: wifi_portal. | `/portal`, `portal/page.tsx`, `docs/CUDY-AP1200-CAPTIVE-PORTAL.md` |
| **BLE (beacons)** | Sí | iBeacon (UUID, major, minor) y Eddystone UID. Web Bluetooth en Chrome Android; beacons registrados por sitio/zona. | `BeaconAdmin.tsx`, `ble-scanner.ts`, `POST /api/presence/check-in` (channel: ble), `docs/BEACONS-BLE-HARDWARE.md` |
| **NFC** | Sí | Tags NFC con Web NFC (Chrome Android). Tag ID único por tag; registro por sitio/zona. | `NfcTagAdmin.tsx`, `POST /api/presence/check-in` (channel: nfc) |

### 1.2 Zonas y sitios

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Sitios (sites)** | Sí | CRUD vía API; nombre, `enabled_channels` (geolocation,qr,wifi_portal,ble,nfc), config JSON. Sitio por defecto "Sede Principal" creado al iniciar. |
| **Zonas por sitio** | Sí | Polígono GeoJSON por zona; `accuracy_threshold_meters`; CRUD admin. Validación point-in-polygon para geolocation. |
| **Multi-sitio** | Sí | Varios sitios; filtro por `site_id` en analytics, export, occupancy. |

### 1.3 Portal

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Página de portal** | Sí | Ruta `/portal`; query `site_id`; formulario público (nombre, email, documento, a quién visita). Envía check-in con channel `wifi_portal`. |
| **Integración CUDY AP1200** | Sí (documentada) | Redirección del captive portal del AP a URL tipo `https://dominio/portal?site_id=UUID`. Documentación en `docs/CUDY-AP1200-CAPTIVE-PORTAL.md`. |

### 1.4 Ocupación y métricas

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Ocupación actual** | Sí | Activos ahora (check-ins sin check-out). Endpoint `GET /api/presence/active`. |
| **Métricas de ocupación** | Sí | `OccupancyMetrics`: current, peak_today, peak_hour_today, average_dwell_minutes, by_zone, by_channel. `GET /api/presence/occupancy`, `GET /api/presence/analytics`. |
| **Motor de inteligencia** | Sí | `intelligence-engine.ts`: insights (occupancy_peak, anomaly_unusual_activity, pattern_typical_day, trend_*, zone_comparison, channel_preference, dwell_time_insight, recommendation); recomendaciones contextuales. |
| **Gráficos (chart data)** | Sí | Por hora, por día, por canal. `GET /api/presence/chart-data`. Dashboard con gráficos (Recharts). |
| **Co-presence** | Sí | Estadísticas de co-presencia por zona/fecha. `GET /api/presence/co-presence`. |

### 1.5 Alertas WhatsApp

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Alertas por ocupación/anomalía** | Sí | Pico de ocupación (≥90% del pico del día); anomalía (check-ins hoy > 1.5× promedio semanal). Mensaje por WhatsApp vía Baileys. |
| **Rate limit** | Sí | 1 alerta por tipo por sitio por hora. |
| **Configuración** | Sí | `GURU_PRESENCE_ALERT_PHONE` (números separados por coma). Cron `POST /api/cron/presence-alerts` o disparo manual `POST /api/admin/presence-alerts`. |
| **Documentación** | Sí | `docs/PRESENCE-POSTGRESQL-WHATSAPP.md`. |

### 1.6 Export

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Export CSV** | Sí | `GET /api/presence/export?site_id=...&format=csv&period_days=30`. Columnas: id, site_id, zone_id, user_id, channel, checked_in_at, checked_out_at. BOM UTF-8. |
| **Export JSON** | Sí | `GET /api/presence/export?site_id=...&format=json&period_days=30`. Objeto con site_id, site_name, period_days, check_ins. |
| **Límite** | 10 000 registros por export. | Configurable en código. |

### 1.7 Cola offline (PWA)

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Cola offline** | Sí | Check-ins fallidos por falta de red se guardan en `localStorage`; al recuperar conexión se envían. `presence-offline-queue.ts`. |
| **UI estado offline** | Sí | Indicador de estado y número de check-ins pendientes. |

### 1.8 Check-out

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Check-out** | Sí | `POST /api/presence/check-out/:id` (auth). Marca `checked_out_at` para calcular tiempo de permanencia. |

### 1.9 Admin y dashboard

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Dashboard Presence** | Sí | `/dashboard/presence`: selector de sitio, métricas, activos, insights, recomendaciones, gráficos (por hora/día/canal), QR por zona, enlace portal, export (CSV/JSON), botón alertas manual. |
| **CRUD Beacons BLE** | Sí | `BeaconAdmin`: alta de beacons (UUID, major, minor, Eddystone UID, nombre, zona). |
| **CRUD Tags NFC** | Sí | `NfcTagAdmin`: alta de tags (tag_id, nombre, sitio, zona). |
| **CRUD Sitios** | Sí | API + UI (crear primer sitio "Sede Principal"). |
| **CRUD Zonas** | Sí | Crear/editar/eliminar zonas con polígono GeoJSON. |

### 1.10 Infraestructura y persistencia

| Aspecto | Implementado | Descripción |
|---------|--------------|-------------|
| **Base de datos** | Sí | SQLite (`guru-presence.db`) o PostgreSQL si `GURU_POSTGRES_URL`. Tablas: sites, zones, check_ins, beacons, nfc_tags. |
| **WebSockets** | Sí | Broadcast de eventos (ej. nuevo check-in) para actualización en tiempo real. `ws-broadcast.ts`. |
| **Firmware beacon** | Sí (opcional) | `hardware/esp32-beacon/`: firmware para ESP32 como iBeacon (bajo costo vs beacons comerciales). |

---

## 2. Resumen de capacidades (checklist para venta)

- [x] Check-in por **geolocalización** (point-in-polygon, zonas GeoJSON)
- [x] Check-in por **QR** (URL por zona)
- [x] Check-in por **portal WiFi** (captive portal, integración CUDY)
- [x] Check-in por **BLE** (iBeacon + Eddystone), admin de beacons
- [x] Check-in por **NFC** (Web NFC), admin de tags
- [x] **Zonas** y **sitios** multi-sede
- [x] **Ocupación**: actual, pico del día, por zona, por canal, tiempo de permanencia
- [x] **Motor de inteligencia**: insights (pico, anomalía, tendencias, preferencia de canal, recomendaciones)
- [x] **Alertas WhatsApp** (pico de ocupación, anomalía; rate limit 1/hora/tipo/sitio)
- [x] **Export** CSV y JSON (hasta 10k registros, periodo configurable)
- [x] **Cola offline** en PWA
- [x] **Check-out** y métricas de permanencia
- [x] **Dashboard** con gráficos, QR por zona, enlace portal, export, disparo manual de alertas
- [x] **Documentación**: CUDY AP1200, beacons BLE, PostgreSQL, alertas WhatsApp
- [x] **Firmware ESP32** (beacon económico)

---

## 3. Costos en el mercado (referencia)

### 3.1 Asistencia / presencia / ocupación (workplace)

| Producto / tipo | Modelo de precio | Rango aproximado (USD) | Qué incluye (resumen) |
|-----------------|------------------|------------------------|------------------------|
| **Timenox** | Por plan/mes | $0 (10 empleados, QR) · $15 (ilimitado, GPS) · $29 (foto, presencia en tiempo real) | Check-in QR/GPS, verificación foto, presencia. Sin BLE/NFC ni portal. |
| **Relogix (Conexus)** | Por m²/año | ~$0.02–0.11/sq ft/mes (asistencia vs ocupación vs Pro) | Sensores, ocupación, utilización; por superficie. |
| **iotspot** | Por escritorio/mes | Desde €0/desk (contacto) | Reserva de escritorio, salas, analytics de ocupación. |
| **Mapiq, Offision** | Enterprise / custom | Custom (250+ empleados) | Ocupación, planificación de espacios, integraciones. |

### 3.2 Gestión de visitas (visitor management)

| Producto / tipo | Modelo de precio | Rango aproximado (USD) | Qué incluye (resumen) |
|-----------------|------------------|------------------------|------------------------|
| **iLobby VisitorOS** | Por plan/mes | Desde ~$199/mes (Corporate) | Visitantes, notificaciones, iPad, QR, branding. |
| **Eptura / Teem** | Por plan | Varios tiers | QR, RFID, WiFi guest, listas de vigilancia, API. |
| **Segmento típico** | Por ubicación/mes | $30–100 (básico) · $100–300 (mid) · $300+ (enterprise) | QR, NFC/RFID, portal, API; hardware aparte ($500–3000). |

### 3.3 Qué suele costar “todo junto” (multi-canal + ocupación + alertas + export)

- Soluciones que cubren **varios canales** (geoloc, QR, BLE, NFC, portal) + **ocupación** + **alertas** + **export** suelen estar en:
  - **$100–250/mes por ubicación** (mid-market),
  - **$200–400+/mes** en enterprise o con hardware incluido.
- Productos más baratos ($15–30/mes) suelen ofrecer solo 1–2 canales (QR o GPS) y sin motor de insights ni alertas proactivas por WhatsApp.

---

## 4. Posicionamiento del producto GURU Presence

| Criterio | GURU Presence | Comentario |
|----------|----------------|------------|
| **Canales** | 5 (geoloc, QR, portal, BLE, NFC) | Más canales que muchos competidores en su rango. |
| **Ocupación e insights** | Sí (actual, pico, por zona/canal, dwell time, insights automáticos) | Nivel “occupancy & utilization” / “Pro”. |
| **Alertas proactivas** | Sí (WhatsApp: pico y anomalía) | Valor añadido frente a solo dashboards. |
| **Export** | CSV + JSON, periodo configurable | Estándar para reporting y compliance. |
| **Offline** | Cola en PWA | Poco común en soluciones baratas. |
| **Hardware** | Sin hardware incluido; documentación CUDY + beacons + ESP32 | Cliente puede usar su propio AP y beacons (o ESP32 barato). |
| **Multi-sitio** | Sí | Varias sedes bajo una misma cuenta. |

---

## 5. Conclusión y recomendación de precio

- **Lo que tenemos:** Sistema completo de presencia multi-canal (geoloc, QR, portal WiFi, BLE, NFC), zonas GeoJSON, portal captive documentado (CUDY), ocupación en tiempo real, motor de insights, alertas por WhatsApp, export CSV/JSON, cola offline, dashboard con gráficos y admin de beacons/NFC. Base SQLite o PostgreSQL, WebSockets, documentación y opción de beacon económico (ESP32).
- **Mercado:** Productos comparables (varios canales + ocupación + alertas/export) suelen estar en **$100–250/mes por ubicación**; soluciones más limitadas en **$15–50/mes**.
- **Precio propuesto:** **$99/mes** para el paquete Presence es **conservador y muy competitivo** para lo que incluye (5 canales, ocupación, insights, alertas WhatsApp, export). Permite posicionar GURU como “todo en uno” a precio mid-low, con margen para subir a **$129–149/mes** si se añaden garantías SLA, más sitios incluidos o integraciones (calendario, acceso físico, etc.).

---

## 6. Referencias en el repo

| Tema | Archivos / docs |
|------|------------------|
| API Presence | `apps/api/src/presence.routes.ts`, `presence-store.ts`, `intelligence-engine.ts`, `presence-whatsapp-alerts.ts` |
| Web: check-in, portal, dashboard | `apps/web/app/presence/check-in/page.tsx`, `app/portal/page.tsx`, `app/dashboard/presence/page.tsx` |
| BLE / NFC admin | `apps/web/components/presence/BeaconAdmin.tsx`, `NfcTagAdmin.tsx`, `lib/ble-scanner.ts` |
| Offline | `apps/web/lib/presence-offline-queue.ts` |
| Docs | `docs/PRESENCE-README.md`, `PRESENCE-FASE-0.md`, `PRESENCE-POSTGRESQL-WHATSAPP.md`, `CUDY-AP1200-CAPTIVE-PORTAL.md`, `BEACONS-BLE-HARDWARE.md` |
| Hardware | `hardware/esp32-beacon/` |
