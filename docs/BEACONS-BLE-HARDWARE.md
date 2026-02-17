# Beacons BLE — Hardware y configuración

Guía para usar beacons BLE con GURU Presence.

## Opciones de hardware

### Beacons comerciales

| Marca | Modelo | Precio aprox. | Comentarios |
|-------|--------|---------------|-------------|
| Estimote | Location Beacons | 15–30 €/u | Compatible iBeacon |
| Kontakt.io | Smart Beacon | 20–50 €/u | Configurable vía app |
| Radius Networks | RadBeacon | 15–25 €/u | USB, batería |

### ESP32 (económico)

| Opción | Precio | Comentarios |
|--------|--------|-------------|
| ESP32 DevKit | 3–8 €/u | Programable como iBeacon. Ver `hardware/esp32-beacon/` |

## Formato iBeacon

Los beacons usan el formato iBeacon de Apple:

- **UUID**: 16 bytes (ej. `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`)
- **Major**: 2 bytes (0–65535)
- **Minor**: 2 bytes (0–65535)

## Registrar un beacon en GURU

1. Obtenga UUID, Major y Minor del beacon (app del fabricante o herramienta de escaneo).
2. En Dashboard → Presence → Beacons BLE → Añadir.
3. Ingrese UUID, Major, Minor, nombre y zona.
4. Los visitantes podrán hacer check-in al detectar el beacon (cuando use app/PWA con BLE).

## Check-in por BLE

- **Web**: Chrome en Android soporta Web Bluetooth. Otros navegadores tienen soporte limitado.
- **App nativa**: Para mejor compatibilidad (iOS, todos los Android), use una app nativa que escanee BLE y llame a la API de check-in.
- **Alternativa**: Use QR o geolocalización que funcionan en cualquier navegador.

## API de check-in por BLE

```http
POST /api/presence/check-in
Content-Type: application/json

{
  "site_id": "uuid-del-sitio",
  "channel": "ble",
  "beacon_uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  "beacon_major": 1,
  "beacon_minor": 1
}
```

El beacon debe estar previamente registrado en el sitio.
