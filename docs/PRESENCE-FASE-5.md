# GURU Presence — Fase 5: Dashboard avanzado y export

## Resumen

- Gráficos de ocupación (por hora, por día, por canal).
- Export de datos en CSV y JSON.
- Endpoints: `/api/presence/chart-data` y `/api/presence/export`.

## Endpoints

### GET /api/presence/chart-data

Parámetros: `site_id` (requerido), `period_days` (opcional, default 7).

Respuesta:

```json
{
  "ok": true,
  "chart_data": {
    "by_hour": [ { "hour": 0, "label": "00:00", "count": 5 }, ... ],
    "by_day": [ { "date": "2025-02-07", "label": "vie 7 feb", "count": 12 }, ... ],
    "by_channel": [ { "channel": "qr", "count": 10 }, { "channel": "geolocation", "count": 8 }, ... ]
  }
}
```

### GET /api/presence/export

Parámetros: `site_id` (requerido), `format` (csv | json), `period_days` (opcional, default 30).

- **CSV**: Headers `id, site_id, zone_id, user_id, channel, checked_in_at, checked_out_at`. BOM UTF-8.
- **JSON**: Objeto con `site_id`, `site_name`, `period_days`, `check_ins[]`.

Requiere autenticación (Bearer).

## Dashboard

- Gráfico de barras: check-ins por hora (6:00–22:00).
- Gráfico de barras: check-ins por día (últimos 7 días).
- Bloque por canal: geolocation, qr, ble, nfc, wifi_portal con conteo y porcentaje.
- Botones Exportar CSV y Exportar JSON (descarga con auth en headers).
