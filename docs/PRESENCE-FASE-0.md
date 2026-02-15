# APlat Presence — Fase 0 Completada

## Resumen

Fase 0 del plan de desarrollo APlat Presence implementada: base API, modelo de datos, módulo de inteligencia, PWA y rutas.

## Archivos creados

### API (apps/api/src/)

| Archivo | Descripción |
|---------|-------------|
| `presence-store.ts` | Almacén SQLite: sites, zones, check_ins, beacons, nfc_tags |
| `intelligence-engine.ts` | Análisis, geolocalización, insights, métricas, recomendaciones |
| `presence.routes.ts` | Endpoints: check-in, events, analytics, admin |

### Web (apps/web/)

| Ruta | Descripción |
|------|-------------|
| `/portal` | Captive portal WiFi — formulario público de check-in |
| `/presence/check-in` | Check-in por geolocalización (PWA) |
| `/dashboard/presence` | Dashboard de presencia (master) — métricas, insights, recomendaciones |

## Endpoints API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/presence/health` | No | Salud del servicio |
| POST | `/api/presence/check-in` | Opcional | Registrar check-in (geolocation, wifi_portal, qr, ble, nfc) |
| POST | `/api/presence/check-out/:id` | Sí | Registrar salida |
| GET | `/api/presence/events` | Sí | Historial de check-ins |
| GET | `/api/presence/active` | Sí | Check-ins activos (sin check-out) |
| GET | `/api/presence/zones` | Sí | Zonas por site |
| GET | `/api/presence/analytics` | Sí | Contexto analítico con insights |
| GET | `/api/presence/occupancy` | Sí | Métricas de ocupación |
| GET | `/api/presence/validate-zone` | Sí | Validar coordenadas en zona |
| GET | `/api/presence/admin/sites` | Master | Listar sites |
| POST | `/api/presence/admin/sites` | Master | Crear site |
| POST | `/api/presence/admin/zones` | Master | Crear zona (GeoJSON) |
| POST | `/api/presence/admin/beacons` | Master | Registrar beacon |
| GET | `/api/presence/admin/beacons` | Master | Listar beacons |
| POST | `/api/presence/admin/nfc-tags` | Master | Registrar tag NFC |
| GET | `/api/presence/admin/nfc-tags` | Master | Listar tags NFC |

## Módulo de Inteligencia

- **Geolocalización**: Point-in-polygon, Haversine, validación de zonas
- **Métricas**: Ocupación actual, pico del día, permanencia promedio, por zona y canal
- **Insights**: Pico de ocupación, canal preferido, anomalías, tiempo de permanencia
- **Recomendaciones**: Sugerencias contextuales (ej. habilitar BLE)

## Uso

### Captive portal (CUDY AP1200)

1. Configurar en el router la URL de redirección: `https://tu-dominio/portal?site_id=UUID_DEL_SITE`
2. Obtener el `site_id` desde el dashboard (admin) o API `/api/presence/admin/sites`
3. Los visitantes completan el formulario y quedan registrados

### Check-in por geolocalización

1. Crear una zona con polígono GeoJSON en el admin
2. Compartir enlace: `/presence/check-in?site_id=XXX&zone_id=YYY`
3. El usuario permite ubicación y registra llegada

### Dashboard

1. Login como master
2. Ir a Dashboard → Presence
3. Ver métricas, activos, insights y recomendaciones

## Base de datos

- `aplat-presence.db` en `APLAT_DATA_PATH` (por defecto `data/`)
- Sitio por defecto "Sede Principal" creado automáticamente

## Próximas fases

- **Fase 1**: QR, mejoras captive portal, onboarding geolocalización
- **Fase 2**: BLE Beacons
- **Fase 3**: ESP32 como beacon
- **Fase 4**: NFC
- **Fase 5**: Dashboard avanzado, export
- **Fase 6**: Offline, push, documentación
