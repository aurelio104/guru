# GURU Presence — PostgreSQL y alertas WhatsApp

## PostgreSQL

### Configuración

- **Variable de entorno**: `GURU_POSTGRES_URL`
- Si está definida, Presence usa PostgreSQL. Si no, usa SQLite (sql.js).

### Ejemplo

```
GURU_POSTGRES_URL=postgresql://user:pass@host:5432/dbname
```

### Schema (auto-creado al iniciar)

- `presence_sites`, `presence_zones`, `presence_check_ins`, `presence_beacons`, `presence_nfc_tags`
- IDs UUID
- Índices en `site_id`, `zone_id`, `user_id`, `channel`, `checked_in_at`

### Migración desde SQLite

Para migrar datos existentes, usa un script que lea de SQLite e inserte en PostgreSQL. No se incluye por defecto.

---

## Alertas WhatsApp

### Configuración

- **Variable de entorno**: `GURU_PRESENCE_ALERT_PHONE`
- Números separados por coma (E.164, ej. `50412345678,50487654321`)

### Cuándo se envían

- **Pico de ocupación**: ocupación actual ≥ 90% del pico del día
- **Anomalía**: check-ins hoy > 1.5× el promedio diario de la última semana

### Rate limit

- Máximo 1 alerta por tipo por sitio por hora

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/cron/presence-alerts` | `x-cron-secret` = GURU_CRON_SECRET | Cron (cada 5–15 min) |
| POST | `/api/admin/presence-alerts` | JWT master | Disparo manual desde dashboard |

Query opcional: `?site_id=xxx` para limitar a un sitio.

### Cron de ejemplo (Koyeb, GitHub Actions, etc.)

```
POST /api/cron/presence-alerts
Header: x-cron-secret: <GURU_CRON_SECRET>
```

Cada 10–15 minutos.

### Requisitos

- WhatsApp conectado (QR escaneado)
- `GURU_PRESENCE_ALERT_PHONE` configurado
