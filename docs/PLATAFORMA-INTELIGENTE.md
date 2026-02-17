# GURU — Visión: plataforma inteligente, autocurable y en auto-desarrollo

**Propósito:** Referencia de cómo la plataforma se orienta a ser autocurable, aprender de su estado e ir integrando lo que falta.  
**Última actualización:** Febrero 2026

---

## 1. Objetivos

| Concepto | Descripción |
|----------|-------------|
| **Inteligente** | La plataforma expone estado agregado (conteos, sugerencias) y permite ver qué falta o qué requiere atención. |
| **Autocurable** | Errores en el front se capturan (error boundaries), el API expone salud y uptime; los flujos tienen reintentos y mensajes claros. |
| **Auto-desarrollo** | El dashboard muestra sugerencias basadas en datos reales (ej. "Crear una sede", "X vulnerabilidades abiertas") para guiar la configuración. |

---

## 2. Implementado

### 2.1 API

| Elemento | Descripción |
|----------|-------------|
| **GET /api/health** | Responde `ok`, `service`, `version`, `uptime_seconds`, `env`. Permite a orquestadores y monitoreo comprobar que el servicio está vivo. |
| **GET /api/platform/status** | (Auth master.) Agrega conteos de: sedes, productos, pedidos, activos, reportes, vulnerabilidades abiertas, incidentes abiertos, GDPR pendientes. Devuelve una lista de **sugerencias** (ej. "Crear al menos una sede en Presence", "N vulnerabilidad(es) abierta(s)"). |

### 2.2 Web

| Elemento | Descripción |
|----------|-------------|
| **Error boundary (error.tsx)** | Captura errores en rutas y muestra mensaje amigable con "Reintentar" e "Ir al inicio". |
| **Global error (global-error.tsx)** | Captura errores críticos en la raíz y ofrece recargar. |
| **Widget "Estado de la plataforma"** | En el panel de control (rol master) muestra conteos por módulo y sugerencias para completar configuración. |

### 2.3 Módulos con estado vacío y resumen

En línea con lo anterior, los módulos del dashboard (Presence, Security, GDPR, Incidentes, Reportes, Commerce, Activos) tienen:

- Resumen de conteos (totales, pendientes, etc.).
- Estado vacío claro con texto explicativo y CTA (ej. "Crear primer producto", "Completar checklist").
- Mensajes de error unificados y reintentos donde aplica.

---

## 3. Próximos pasos (orientación)

- **Health avanzado:** Incluir en `/api/health` comprobaciones de escritura en `GURU_DATA_PATH` o disponibilidad de PostgreSQL si aplica (readiness).
- **Auditoría y aprendizaje:** Usar logs de auditoría existentes para detectar patrones (ej. rutas más usadas, errores recurrentes) y exponerlos en un panel o en sugerencias.
- **Integración continua:** Scripts de prueba (test-public-api, test-production-api) y, si se añade CI, ejecutarlos en cada push para detectar regresiones.
- **Auto-completado de configuración:** Endpoints tipo "seed" (como en GDPR e Incidentes) para rellenar datos por defecto cuando falten; el widget de estado puede enlazar a esas acciones.

---

## 4. Cómo actualizar este documento

Al añadir funcionalidad que contribuya a "inteligente / autocurable / auto-desarrollo", documentarla en la sección 2 (Implementado) o 3 (Próximos pasos) y actualizar la fecha.
