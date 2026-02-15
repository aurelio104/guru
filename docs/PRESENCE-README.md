# APlat Presence — Documentación completa

Sistema de registro de presencia multi-canal con inteligencia contextual, analytics y soporte offline.

## Características

- **Check-in por geolocalización** — Validación point-in-polygon / Haversine
- **Check-in por QR** — URL única por zona, un toque
- **Check-in por WiFi Portal** — Captive portal para redes corporativas
- **Check-in por BLE** — iBeacon con Web Bluetooth (Chrome Android)
- **Check-in por NFC** — Tags NFC con Web NFC (Chrome Android)
- **Cola offline** — Check-ins guardados localmente y enviados al recuperar red
- **Motor de inteligencia** — Insights, recomendaciones, métricas
- **Export** — CSV y JSON
- **Firmware ESP32** — Beacon iBeacon listo para flash

## Arquitectura

```
apps/api/src/          → presence-store, presence.routes, intelligence-engine
apps/web/              → Check-in, Dashboard, Portal, BeaconAdmin, NfcTagAdmin
hardware/esp32-beacon/ → Firmware beacon
docs/                  → Guías por fase
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/presence/health | Health check |
| POST | /api/presence/check-in | Check-in (público/portal; auth opcional) |
| POST | /api/presence/check-out/:id | Check-out (auth) |
| GET | /api/presence/events | Historial check-ins (auth) |
| GET | /api/presence/active | Activos ahora (auth) |
| GET | /api/presence/analytics | Analytics + insights (auth) |
| GET | /api/presence/chart-data | Datos para gráficos (auth) |
| GET | /api/presence/export | Export CSV/JSON (auth) |
| GET | /api/presence/zones | Zonas por sitio (auth) |
| GET/POST | /api/presence/admin/sites | CRUD sitios (master) |
| GET/POST | /api/presence/admin/zones | CRUD zonas (master) |
| GET/POST | /api/presence/admin/beacons | CRUD beacons BLE (master) |
| GET/POST | /api/presence/admin/nfc-tags | CRUD tags NFC (master) |

## Variables de entorno

- `APLAT_DATA_PATH` — Directorio para SQLite (default: `./data`)
- `APLAT_JWT_SECRET` — Secreto JWT
- `NEXT_PUBLIC_APLAT_API_URL` — URL de la API (web)

## Canales y restricciones

| Canal | Requiere | Plataforma |
|-------|----------|------------|
| geolocation | lat, lng, zone_id | Todos |
| qr | zone_id en URL | Todos |
| wifi_portal | Portal configurado | Todos |
| ble | Web Bluetooth | Chrome Android |
| nfc | Web NFC | Chrome Android |

## Offline

Los check-ins fallidos por falta de red se guardan en `localStorage`. Al recuperar conexión se envían automáticamente. La UI muestra el estado offline y el número de pendientes.

## Fases del proyecto

- **Fase 0**: Base (API, store, PWA, motor de inteligencia)
- **Fase 1**: Geoloc, captive portal, QR, onboarding
- **Fase 2**: Beacons BLE (admin + check-in)
- **Fase 3**: Firmware ESP32 beacon
- **Fase 4**: NFC (admin + check-in)
- **Fase 5**: Dashboard avanzado, gráficos, export
- **Fase 6**: Offline queue, documentación

## Notas de implementación Push (futuro)

Para notificaciones push se requiere:
- VAPID keys
- Service Worker con `push` event
- Endpoint backend para enviar notificaciones (web-push)
- Permiso del usuario en el navegador
