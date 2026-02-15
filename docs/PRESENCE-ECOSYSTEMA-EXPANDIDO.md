# APlat Presence — Ecosistema expandido

## Bluetooth (BLE)

### iBeacon + Eddystone
- **iBeacon** (Apple): UUID, major, minor. Escaneo vía Web Bluetooth.
- **Eddystone-UID** (Google): namespace (10B) + instance (6B). Soporte en escáner y API.

### Multi-beacon y RSSI
- Escaneo de 5 segundos: recolecta todos los beacons, elige el de **mayor RSSI**.
- RSSI en metadata del check-in para analytics.
- Admin: añadir beacon iBeacon o Eddystone (campo `eddystone_uid`).

### API Check-in BLE
```json
// iBeacon
{ "channel": "ble", "beacon_uuid": "...", "beacon_major": 1, "beacon_minor": 2, "beacon_rssi": -65 }

// Eddystone
{ "channel": "ble", "beacon_eddystone_uid": "NAMESPACE16HEXINSTANCE12HEX", "beacon_rssi": -70 }
```

---

## WiFi

### Captive portal (actual)
- Check-in al conectar a la red y completar el portal.

### SSID (config para futuro)
- `config_json` del sitio puede incluir `allowed_ssids: ["MiRed-5G", "Guest"]`.
- En entornos enterprise/captive avanzados, el portal puede recibir la SSID y validar.

### Limitaciones web
- No hay API estándar para escanear WiFi desde el navegador.

---

## NFC

### Lectura de tags (actual)
- Web NFC (Chrome Android). Check-in al acercar el teléfono al tag.

### Futuro: HCE (emulación)
- El teléfono como tarjeta requiere app nativa o Web NFC con soporte de escritura/emulación.

---

## Modo Smart Visit

1. **BLE** (3 s): si hay beacon registrado → check-in BLE.
2. **Geolocalización**: si hay coords o se obtienen → check-in por ubicación.
3. **Fallback**: indicar uso de QR o canal manual.

URL: `/presence/check-in?site_id=X&zone_id=Y&channel=smart`

---

## Co-presencia

`GET /api/presence/co-presence?site_id=X&date=2025-02-15`

Respuesta (anónima):
```json
{
  "ok": true,
  "co_presence": [
    {
      "zone_id": "...",
      "zone_name": "Recepción",
      "date": "2025-02-15",
      "total_check_ins": 45,
      "unique_visitors": 32,
      "max_simultaneous": 8
    }
  ]
}
```

---

## Find My Network

- **Apple Find My** es cerrado; no se puede usar para presencia en terceros.
- Alternativa: red propia tipo “encuentro” con dispositivos autorizados (app nativa).

---

## App nativa (roadmap)

Una app nativa desbloquearía:

- Escaneo BLE en background.
- Detección de redes WiFi conocidas.
- Geo-fencing y notificaciones de proximidad.
- NFC HCE (teléfono como tarjeta).

---

## App nativa (roadmap)

Una app nativa (React Native, Capacitor, Flutter) permitiría:

| Funcionalidad | Web | Nativo |
|---------------|-----|--------|
| BLE scan background | ❌ | ✅ |
| WiFi scan / SSID | ❌ | ✅ |
| Geo-fencing | Limitado | ✅ |
| NFC HCE | ❌ | ✅ |
| Notificaciones push | Limitado | ✅ |

**Recomendación**: Mantener PWA para check-in rápido; app nativa para “siempre presente” y automatización.

---

## Archivos clave

| Archivo | Función |
|---------|---------|
| `lib/ble-scanner.ts` | iBeacon + Eddystone, RSSI, selectStrongestBeacon |
| `app/presence/check-in/page.tsx` | Modo Smart, BLE multi-formato |
| `components/presence/BeaconAdmin.tsx` | Alta de iBeacon y Eddystone |
| `api/presence-store.ts` | `eddystone_uid` en beacons, `getBeaconByEddystoneUid` |
| `api/intelligence-engine.ts` | `getCoPresenceStats` |
