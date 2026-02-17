# Análisis exhaustivo: Ciberseguridad — Lo que tenemos, componentes descritos y costos en el mercado

**Paquete:** Ciberseguridad — GURU Security, GDPR/LOPD, incidentes, verificación firma, Jcloud.  
**Precio en catálogo GURU:** Costo único $150 · Mensual $79/mes.

Este documento inventaría **lo que está implementado en la plataforma GURU**, describe **los tres componentes adicionales** que definiste (análisis de red en tiempo real, gestión de red, ejecutable de auditoría con IA) y sitúa **costos de mercado** para el segmento completo.

---

## 1. Inventario: lo que tiene la plataforma GURU hoy (en el repo)

### 1.1 GURU Security (vulnerabilidades y escaneos)

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Vulnerabilidades** | Sí | CRUD: título, severidad (low/medium/high/critical), descripción, CVE opcional, estado (open/mitigated/closed), asset, remediación. Persistencia JSON en `GURU_DATA_PATH`. |
| **Escaneos** | Sí | Crear escaneo manual o programado; estado pending → running → completed/failed; `findingsCount`, `error`. La ejecución real es simulada (setTimeout); en producción se conectaría a un job/worker o a un escáner externo. |
| **API** | Sí | `GET/POST/PATCH/DELETE /api/security/vulnerabilities`, `GET /api/security/vulnerabilities/:id`, `GET/POST /api/security/scans`, `GET /api/security/scans/:id`, `POST /api/security/scan`. |
| **UI** | Sí | `/dashboard/security`: listado vulnerabilidades, crear/editar/eliminar, listado escaneos, botón "Ejecutar escaneo", export JSON. |

**Ubicación:** `apps/api/src/security-store.ts`, `security.routes.ts`, `apps/web/app/dashboard/security/page.tsx`.

### 1.2 GDPR / LOPD (checklist de cumplimiento)

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Checklist** | Sí | Ítems por categoría: breach (art. 33–34, notificación brecha, registro, comunicación), legal (art. 30, base legal, información interesado, consentimiento, DPA art. 28, EIPD, DPO), rights (acceso, rectificación, supresión, portabilidad, oposición, limitación, canal), security (cifrado, control de acceso, auditorías, pseudonimización, deber de secreto). |
| **Estados** | Sí | pending, in_progress, done, na. Notas por ítem. |
| **Seed** | Sí | `POST /api/gdpr/checklist/seed` añade ítems por defecto que falten. |
| **API** | Sí | `GET /api/gdpr/checklist`, `PATCH /api/gdpr/checklist/:id`. |
| **UI** | Sí | `/dashboard/gdpr`: listado por categoría, toggle estado, notas. |

**Ubicación:** `apps/api/src/gdpr-store.ts`, `gdpr.routes.ts`, `apps/web/app/dashboard/gdpr/page.tsx`.

### 1.3 Incidentes (registro y playbooks)

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Incidentes** | Sí | Título, descripción, severidad (low/medium/high/critical), estado (open, investigating, contained, resolved, closed), playbook asociado, reportedAt, updatedAt, resolvedAt, notes. |
| **Playbooks** | Sí | 7 por defecto: Brecha de datos, Malware/ransomware, Phishing/suplantación, DDoS, Acceso no autorizado/intrusión, Pérdida/robo de dispositivo, Exposición accidental de datos. Cada uno con pasos definidos. |
| **Seed** | Sí | `POST /api/incidents/playbooks/seed` añade playbooks por defecto. |
| **API** | Sí | `GET/POST /api/incidents`, `GET/PATCH /api/incidents/:id`, `GET/POST /api/incidents/playbooks`, `GET /api/incidents/playbooks/:id`, `POST .../playbooks/seed`. |
| **UI** | Sí | `/dashboard/incidents`: listado incidentes, crear, editar estado/notas, listado playbooks. |

**Ubicación:** `apps/api/src/incidents-store.ts`, `incidents.routes.ts`, `apps/web/app/dashboard/incidents/page.tsx`.

### 1.4 Verificación de firma / integridad

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Verificación hash** | Sí | `POST /api/verify-signature`: body `data` (string), `expectedHash`, `algorithm` opcional (sha256, sha384, sha512). Respuesta: `valid`, `computedHash`. Sin auth en la ruta actual (puede restringirse si se usa para datos sensibles). |

**Ubicación:** `apps/api/src/verify-signature.routes.ts`.

### 1.5 Auditoría (logs de cambios)

| Funcionalidad | Implementado | Descripción |
|---------------|--------------|-------------|
| **Logs** | Sí | SQLite `guru-audit.db`: acción (CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAIL, VERIFY, PROCESS), entidad, entity_id, user_id, user_email, ip, details (JSON). Persistencia en `GURU_DATA_PATH`. |
| **Consulta** | Sí | `GET /api/admin/audit-logs` (master): filtros entity, entity_id, user_id, action, limit. |

**Ubicación:** `apps/api/src/audit-store.ts`, rutas admin en `index.ts`. Documentación: `docs/SEGURIDAD-APLAT.md`.

### 1.6 Jcloud

| Estado | Nota |
|--------|------|
| **Por definir** | En `docs/PLAN-ACCION-ECOSISTEMA.md` y catálogo se menciona Jcloud como parte del módulo Ciberseguridad; alcance (producto propio, proveedor externo, APIs, auth, panel) pendiente de definición con producto/negocio. |

---

## 2. Los tres componentes que describes (visión de producto)

Has definido **tres bloques funcionales** que complementan lo anterior y que no están hoy en el repo GURU como tal:

### 2.1 Análisis de red en tiempo real (instalable)

- **Qué es:** Un componente **que se instala** en la red del cliente (agente o sensor).
- **Funciones:** Análisis de red en tiempo real, con **IA** que analiza y **bloquea conexiones externas** (detección y respuesta a nivel de red).
- **Encaje en el mercado:** Equivalente conceptual a **NDR (Network Detection and Response)** o a un **IDS/IPS** con capacidades de ML/IA: tráfico, conexiones salientes/entrantes, detección de anomalías y bloqueo.
- **Relación con lo existente:** El pilar **Ciber** (sistema de monitoreo P-CS/OACI, Fortinet) en `docs/CIBERSEGURIDAD-APLAT-ANALISIS.md` es un sistema operativo independiente que incluye servicios de red y seguridad; este “análisis de red en tiempo real instalable” podría ser un **producto empaquetado** derivado o integrado con esa capacidad.

### 2.2 Análisis de gestión de red

- **Qué es:** Gestión de red con foco en **movimientos de archivos**, **tráfico** y **bloqueo de conexiones externas no autorizadas**.
- **Funciones:** Visibilidad de tráfico y de movimiento de archivos; políticas para bloquear externas no autorizadas (lista blanca/negra, zonas permitidas).
- **Encaje en el mercado:** Cruce entre **DLP (Data Loss Prevention)** en movimiento de archivos, **gestión de tráfico** y **control de perimetral** (NGFW / políticas de salida). No es solo monitorización: incluye “bloque”.
- **Relación con lo existente:** Ciber y Hack (framework con `network-security/`, Fortinet, honeypot, DDoS) tienen módulos de red; este bloque sería la cara “gestión de red + bloqueo” empaquetada para el cliente.

### 2.3 Ejecutable de auditoría de plataforma (con IA)

- **Qué es:** Un **archivo ejecutable** (o script/paquete ejecutable) que:
  - Analiza y audita **en tiempo real** (o en una pasada completa) **toda una plataforma** (dominios, APIs, front, configuraciones, etc.).
  - Genera un **desglose absoluto** de la situación y de **vulnerabilidades**.
  - Usa **IA** para el análisis y para **recomendaciones**.
- **Encaje en el mercado:** Equivalente a **pentest automatizado + informe ejecutivo y técnico** con IA (OWASP Top 10, OWASP LLM, etc.), entregado como herramienta ejecutable o servicio bajo demanda.
- **Relación con lo existente:** Es exactamente el pilar **Auditoría Ciberseguridad** descrito en `docs/CIBERSEGURIDAD-APLAT-ANALISIS.md` y `ANALISIS-CARPETA-ALBATROS.md`: pentest avanzado con IA, informes por dominio (RESUMEN-EJECUTIVO, INFORME-TECNICO, PROPUESTA-VALOR-CLIENTE, etc.). Hoy es un sistema independiente (no en el repo GURU); el “ejecutable” sería la forma de empaquetarlo o exponerlo como producto (ejecutable local o job en la nube que devuelve el mismo tipo de salida).

---

## 3. Resumen: qué tenemos vs qué describes

| Bloque | En repo GURU | Componente que describes | Relación con pilares (Auditoría, Ciber, Hack) |
|--------|----------------|---------------------------|-----------------------------------------------|
| **GURU Security** | Sí (vulnerabilidades + escaneos) | Base para registrar hallazgos; el “escaneo” real puede alimentarse del ejecutable de auditoría o de NDR. | — |
| **GDPR/LOPD** | Sí (checklist) | Incluido en el paquete. | — |
| **Incidentes** | Sí (incidentes + playbooks) | Incluido en el paquete. | Hack (respuesta a incidentes) |
| **Verificación firma** | Sí (hash SHA256/384/512) | Incluido en el paquete. | — |
| **Auditoría (logs)** | Sí (audit-store, admin) | Base de trazabilidad y cumplimiento. | — |
| **Jcloud** | No (por definir) | Parte del nombre del paquete; definir alcance. | — |
| **Análisis de red en tiempo real** | No en repo | NDR/IDS con IA, instalable, bloqueo conexiones externas. | Ciber (monitoreo red/Fortinet) |
| **Gestión de red** | No en repo | Movimientos de archivos, tráfico, bloqueo externas no autorizadas. | Ciber / Hack (network-security) |
| **Ejecutable auditoría plataforma** | No en repo | Auditoría total + desglose + vulnerabilidades + IA y recomendaciones. | Auditoría Ciberseguridad (pentest + IA) |

---

## 4. Costos en el mercado (referencia)

### 4.1 GDPR / cumplimiento (checklist y gestión)

| Tipo | Rango aproximado (USD) | Nota |
|------|------------------------|------|
| Entrada / CMP básico | $8–199/mes | Usercentrics, Osano, etc.; a menudo por visitantes/usuarios. |
| Mid (ROPA, evaluaciones) | ~€197–529/mes (Sypher) | Checklist y registro de actividades. |
| Enterprise | Custom (OneTrust, Transcend) | Por contacto. |

Un **checklist GDPR/LOPD** como el de GURU se sitúa en el rango **bajo–medio** si se compara con suites completas; como módulo dentro de un paquete mayor tiene valor de **$20–80/mes** en equivalente.

### 4.2 Gestión de vulnerabilidades y escaneos

| Producto / tipo | Rango aproximado (USD) |
|-----------------|------------------------|
| Por activo (Rapid7, Tenable) | ~$2–3/activo/mes o $3.500/año para 100+ activos |
| Por tier (Attaxion) | $129/mes (40 activos) – $949/mes (360 activos) |
| Custom (CyCognito, Nucleus) | Presupuesto según activos/IPs/apps |

GURU Security hoy es **registro + escaneos (simulados)**; el valor “completo” se acerca cuando se integre con el **ejecutable de auditoría** o con escáneres externos. Equivalente de mercado para un VM básico: **$50–150/mes** en segmento SMB.

### 4.3 Respuesta a incidentes y playbooks (SOAR light)

| Tipo | Rango |
|------|--------|
| Community / free | Splunk SOAR (límite acciones/día), Cymph free (playbooks limitados). |
| Enterprise | IBM QRadar SOAR, FortiSOAR: presupuesto por usuarios/casos. |

Un módulo de **incidentes + playbooks** sin automatización SOAR completa se puede valorar en **$30–80/mes** como parte de un paquete.

### 4.4 Verificación de firma / integridad (hash)

- APIs de verificación de firma/hash: desde **€0.001 por request** (verificación simple) hasta precios por firma electrónica cualificada.
- Un endpoint **hash (SHA256/384/512)** como el de GURU es un commodity; en paquete se considera **valor añadido**, no un ítem de precio independiente grande (**$5–15/mes** en equivalente si se facturara solo).

### 4.5 NDR / análisis de red con IA y bloqueo

| Tipo | Rango aproximado (USD) |
|------|-------------------------|
| XDR por endpoint (ej. Cortex XDR) | ~$59–70/endpoint/mes |
| NDR (ExtraHop, Vectra, Darktrace, Fortinet) | Suele ser por datos/endpoints; enterprise, a menudo presupuesto. |
| Segmento SMB simplificado | $100–300/mes por sitio o por número de sensores. |

El **“análisis de red en tiempo real instalable con IA y bloqueo”** encaja en este rango según profundidad (solo detección vs detección+respuesta, número de nodos).

### 4.6 Gestión de red (tráfico + archivos + bloqueo)

- **DLP** y **NGFW** suelen facturarse por usuario/endpoint o por ancho de banda/datos.
- En conjunto (tráfico + movimiento de archivos + bloqueo externas): **$80–200/mes** en soluciones SMB/mid-market.

### 4.7 Auditoría de plataforma / pentest con IA (ejecutable)

- **Consultoría y auditoría** en NEGOCIO-APLAT y CIBERSEGURIDAD-APLAT-ANALISIS: **2.000 – 8.000 USD por proyecto** (pentest, informes, propuesta de valor).
- Herramientas de **escaneo continuo + informe con IA** (tipo Bugcrowd, Intrigue, etc.): desde **$100–400/mes** por proyecto hasta proyectos one-off de miles de dólares.
- Un **ejecutable que hace auditoría completa + desglose + IA** puede venderse como **costo único por auditoría** ($200–800) o como **cuota mensual** si se ofrece como escaneo recurrente ($80–200/mes).

---

## 5. Encaje del precio actual del paquete

- **Catálogo actual:** Costo único **$150** + **$79/mes** (Ciberseguridad).
- **Lo que cubre hoy en repo:** GURU Security (vulnerabilidades + escaneos), GDPR/LOPD (checklist), incidentes + playbooks, verificación de firma (hash), auditoría (logs). **Jcloud** por definir.
- **Lo que añadirías:** (1) Análisis de red en tiempo real instalable (IA + bloqueo), (2) Gestión de red (archivos + tráfico + bloqueo), (3) Ejecutable de auditoría de plataforma con IA y recomendaciones.

**Conclusión:**

- Para **solo lo que está hoy** en la plataforma (Security + GDPR + Incidentes + Verify + Audit), **$79/mes** está **alineado o por debajo** del mercado (equivalente a ~$130–250/mes si se compraran por separado en gama baja-media).
- El **costo único $150** puede interpretarse como **setup/onboarding** o como **pago único por acceso** al módulo; es bajo frente a típicos $200–800 por auditoría puntual o setup de cumplimiento.
- Si se incorporan los **tres componentes** (NDR instalable, gestión de red, ejecutable de auditoría con IA):
  - El **mensual** podría justificar **$129–199/mes** (por el valor NDR + gestión de red + auditoría recurrente).
  - El **costo único** podría subir a **$250–500** si el ejecutable de auditoría se entrega como licencia o por uso (una auditoría completa por dominio/plataforma).

---

## 6. Recomendaciones

1. **Cerrar definición de Jcloud** (alcance, si es propio o externo, APIs) para que el paquete Ciberseguridad quede completo en mensaje y facturación.
2. **Documentar los tres componentes** en un roadmap de producto:
   - **Componente 1:** Análisis de red en tiempo real (instalable, IA, bloqueo conexiones externas).
   - **Componente 2:** Gestión de red (movimientos de archivos, tráfico, bloqueo externas no autorizadas).
   - **Componente 3:** Ejecutable (o servicio) de auditoría de plataforma: análisis en tiempo real o bajo demanda, desglose y vulnerabilidades, análisis y recomendaciones con IA.
3. **Vincular explícitamente** el componente 3 con el pilar **Auditoría Ciberseguridad** (pentest + IA) ya descrito en `docs/CIBERSEGURIDAD-APLAT-ANALISIS.md`, y los componentes 1 y 2 con **Ciber** y **Hack** (red, Fortinet, políticas).
4. **Precio:** Mantener **$150 + $79/mes** para el paquete “solo plataforma actual” es conservador y competitivo. Si se añaden los tres componentes, considerar:
   - **Opción A:** Subir mensual a **$129–149/mes** y costo único a **$250–350**.
   - **Opción B:** Dejar el paquete base en $150 + $79 y ofrecer **add-ons** por “análisis de red instalable”, “gestión de red” y “auditoría ejecutable con IA” (precio por despliegue o por auditoría).

---

## 7. Referencias en el repo y docs

| Tema | Archivos / docs |
|------|------------------|
| Security | `apps/api/src/security-store.ts`, `security.routes.ts`, `apps/web/app/dashboard/security/page.tsx` |
| GDPR | `apps/api/src/gdpr-store.ts`, `gdpr.routes.ts`, `apps/web/app/dashboard/gdpr/page.tsx` |
| Incidentes | `apps/api/src/incidents-store.ts`, `incidents.routes.ts`, `apps/web/app/dashboard/incidents/page.tsx` |
| Verify signature | `apps/api/src/verify-signature.routes.ts` |
| Auditoría | `apps/api/src/audit-store.ts`, `docs/SEGURIDAD-APLAT.md` |
| Pilares (Auditoría, Ciber, Hack) | `docs/CIBERSEGURIDAD-APLAT-ANALISIS.md`, `ANALISIS-CARPETA-ALBATROS.md` |
| Plan y Jcloud | `docs/PLAN-ACCION-ECOSISTEMA.md`, `docs/PLAN-ESTADO-Y-PENDIENTES.md` |
| Catálogo | `apps/api/src/catalog-store.ts` (Ciberseguridad: priceOneTime 150, priceMonthly 79) |
