# Persistencia de datos en APlat — Todo guardado permanentemente

Todo lo que guarda la API se escribe en disco. No hay datos solo en memoria que se pierdan al reiniciar, siempre que el directorio de datos esté en un **volumen persistente**.

## Base de datos más óptima para APlat

La opción actual es la más adecuada para este proyecto:

| Componente | Tecnología | Motivo |
|------------|------------|--------|
| **Clientes, perfiles, suscripciones** | **SQLite** (sql.js) | Un solo archivo `aplat.db`, sin servidor extra, backup = copiar el archivo. Ideal para un solo despliegue (ej. un servicio en Koyeb). |
| **Auditoría** | **SQLite** (sql.js) | Mismo esquema: `aplat-audit.db`, persistente y fácil de auditar/exportar. |
| **Presence (sitios, zonas, check-ins)** | **SQLite** o **PostgreSQL** | SQLite por defecto (`aplat-presence.db`). Opcional PostgreSQL si defines `DATABASE_URL` (varios nodos o integración con otros sistemas). |
| **Passkey (WebAuthn), reportes, incidentes, etc.** | **Archivos JSON** en el mismo directorio | Escritura inmediata en disco, un directorio = un backup. |

**Ventajas de no usar solo PostgreSQL:**

- Sin dependencia externa: la API arranca y ya tiene “base de datos” (archivos en `APLAT_DATA_PATH`).
- Un único directorio (`/data`) para volúmenes: montas un volumen y todo queda persistido.
- Backup: copiar la carpeta `data/` (o el volumen) incluye SQLite + JSON.
- SQLite es muy robusto para lecturas/escrituras concurrentes moderadas (una instancia de API).

Si en el futuro necesitas varias réplicas de la API leyendo/escribiendo la misma base, la opción sería migrar a **PostgreSQL** (o otro SQL remoto) para esos datos; para un solo nodo, la configuración actual es óptima.

## Dónde se guarda cada cosa

Todo depende de **`APLAT_DATA_PATH`** (por defecto `./data`). En producción conviene usar un volumen montado, por ejemplo `/data`.

| Dato | Archivo o base | Persistencia |
|------|-----------------|--------------|
| Clientes, perfiles, suscripciones, códigos teléfono | `aplat.db` (SQLite) | Guardado en cada cambio + intervalo 20 s + al salir (SIGINT/SIGTERM) |
| Auditoría (logs de acciones) | `aplat-audit.db` (SQLite) | Cada evento de auditoría |
| Passkey (WebAuthn) | `webauthn-store.json` (o `APLAT_WEBAUTHN_STORE_PATH`) | Por defecto dentro de `APLAT_DATA_PATH`; cada registro/uso |
| Presence (sitios, zonas, check-ins) | `aplat-presence.db` (SQLite) o PostgreSQL | Intervalo + al salir; o PostgreSQL si `DATABASE_URL` |
| Reportes, incidentes, playbooks, GDPR, comercio, assets, seguridad, slots, Omac, catálogo, push | Varios `.json` en `APLAT_DATA_PATH` | Escritura en disco en cada cambio |

## Cómo garantizar que todo quede guardado permanentemente

1. **Definir `APLAT_DATA_PATH`** en el entorno de producción (ej. `/data`).
2. **Montar un volumen persistente** en esa ruta (en Koyeb: volumen → mount path `/data`).
3. Opcional pero recomendado: **`APLAT_WEBAUTHN_STORE_PATH=/data/webauthn-store.json`** para que Passkey esté en el mismo volumen (si no lo defines, la API usa por defecto `{APLAT_DATA_PATH}/webauthn-store.json`).

Con eso, reinicios y redeploys no borran datos: todo sigue en el volumen.

## Resumen

- **Base de datos óptima aquí:** SQLite (clientes, auditoría, presence por defecto) + archivos JSON en un solo directorio.
- **Todo se guarda en disco** en cada operación relevante (y/o con guardado periódico y al cerrar el proceso).
- **Persistencia “permanente”** = volumen persistente montado en `APLAT_DATA_PATH` y variables de entorno correctas (ver `apps/api/env.example` y `docs/DEPLOY-KOYEB.md`).
