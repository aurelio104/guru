# Análisis completo: carpeta Albatros (Work)

**Objetivo:** Inventario de la carpeta local `Work/Albatros` con todas sus ramas y subcarpetas, para completar la información necesaria para valorar la empresa.

**Ámbito:** `/Users/aureliomedina/Documents/Work/Albatros`  
**Fecha de análisis:** 10 Feb 2026

---

## 1. Vista general de Work

```
Work/
├── Albatros/     ← ~118.500 archivos (PHP, JS, TS, etc.)
├── Aurelio/      ← ~29.400 archivos (incl. proyecto A/APlat)
└── PDF/          ← 8 archivos
```

Este documento se centra en **Albatros** y sus subcarpetas.

---

## 2. Árbol de Albatros (ramas principales)

```
Albatros/
├── Auditoria Ciberseguridad/   # Pentest + IA, informes por dominio
├── CIA/                        # Sitio web Next.js (landing/institucional)
├── Ciber/                      # Monitoreo ciberseguridad P-CS (Fortinet, OACI)
├── Control de Acceso/          # Sistema visitas/carnets (OCR, QR, PWA)
├── Cpanel/                     # Script descarga desde cPanel (Node/TS)
├── Gladys/                     # Análisis peligros OASI (Severidad) – React
├── Hack/                       # Framework seguridad + red + Fortinet
├── INTRANET/                   # Intranet legacy (PHP/Zend, XAMPP, MySQL, ~80k archivos)
├── Intranet Nueva/             # Intranet nueva (extranet.goalbatros.com, PHP/HTML)
├── Omac/                       # Monorepo: API + Web (órdenes de trabajo, passkeys, PWA)
├── Plataforma/                 # Plataforma integral Albatros (Next.js, ventas, intranet, KIU, Amadeus)
├── Presentacion albatros /     # Presentación interactiva (video, widgets, backend Koyeb)
├── Recordatorio/               # Recordatorios de pagos + IA + CalDAV + contabilidad
├── Script pagina/              # Script exploración/mapeo FlyEmbraer (descarga PDFs)
└── (otros si los hubiera)
```

---

## 3. Detalle por rama (qué hay, qué falta)

### 3.1 Auditoria Ciberseguridad

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Pentest avanzado con IA (OWASP Top 10, OWASP LLM 2025, spoofing, técnicas avanzadas). Genera informes por dominio. |
| **Stack** | Node 18+, TypeScript, scripts en `analisis/` (`pentest-ia-completo.ts`, etc.) |
| **Estructura** | `analisis/` (src, scripts export PDF/ZIP), `resultados/` (por dominio, ej. mundoiaanime.com, omac569.com) |
| **Entregables** | RESUMEN-EJECUTIVO.md, INFORME-TECNICO.md, reporte-completo.json, PROPUESTA-VALOR-CLIENTE.md, evidencia, export PDF/ZIP |
| **Qué hay** | Herramienta funcional, documentación de valor para cliente, anexos (amenazas IA, técnicas hacker). |
| **Qué puede faltar** | Listado explícito de clientes/dominios auditados; versionado/entregas formales por proyecto; integración con facturación. |

---

### 3.2 CIA

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Sitio web institucional/landing (Centro de Instrucción de Aviación o similar). |
| **Stack** | Next.js 16, React 19, Prisma, Tailwind 4, Node ≥24. |
| **Estructura** | `app/` (layout, page, ui: Header, Footer, Hero), `public/assets/` (banner, logos, fotos). |
| **Qué hay** | App Next.js con UI básica y assets. |
| **Qué puede faltar** | Contenido final (textos, programas, precios); integración con formularios/CRM; SEO y analytics; README específico de negocio. |

---

### 3.3 Ciber

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Monitoreo de ciberseguridad en tiempo real para Albatros (Programa P-CS, manual MG-P-CS-004). Cumplimiento OACI, Fortinet, detección de amenazas. |
| **Stack** | Backend Node/Express/TS + Socket.IO (puerto 3100), frontend React/Vite/TS (5173), CiberWin (Windows). |
| **Estructura** | `server/` (services: Fortinet, compliance, network, security), `client/` (dashboard, widgets), `CiberWin/` (cliente Windows), muchos .md de configuración. |
| **Qué hay** | Sistema completo: backend, frontend, docs (Fortinet, rate limiting, trusted hosts, API, GUI), releases. |
| **Qué puede faltar** | Documento de “valor de negocio” (ahorro, cumplimiento normativo); métricas de uso en producción; procedimientos de operación y escalado. |

---

### 3.4 Control de Acceso

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Control de acceso en oficinas: registro de visitas, OCR cédulas, carnets (VIS-XXXXX), QR, PWA. |
| **Stack** | Backend Express/TS (Koyeb), frontend React/Vite (Vercel), Tesseract.js, QR. |
| **Estructura** | `backend/` (controllers, services: access, auth, card, OCR, passkey, QR), `frontend/` (páginas: AccessForm, DashboardAdmin, ScanCard, etc.), CI/CD GitHub Actions. |
| **Qué hay** | Sistema desplegado (Vercel + Koyeb), documentación (DNS CAA/SPF/DMARC, seguridad, pentest), soporte offline. |
| **Qué puede faltar** | Métricas de uso (visitas/día, dispositivos); SLA y mantenimiento; posible integración con control físico (portero, tornos). |

---

### 3.5 Cpanel

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Descarga recursiva de contenido de cPanel (ej. `/home/extgoalb`) vía API. |
| **Stack** | Node 24, TypeScript. |
| **Estructura** | `src/download-cpanel.ts`, `downloaded/`. |
| **Qué hay** | Script operativo con variables de entorno (host, usuario, ruta, destino). |
| **Qué puede faltar** | Documentación de “producto” (si se ofrece como servicio); seguridad (rotación de credenciales, uso en pipeline). |

---

### 3.6 Gladys

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Análisis de peligros según metodología OASI (Severidad): frecuencia, exposición, consecuencias; niveles Crítico a Muy Bajo. |
| **Stack** | React, Vite, JSX. |
| **Estructura** | Componentes (DangerForm, DangerList, RiskMatrix, ActionPlan, AnalysisPanel, History), utils (oasiMethodology, aiAnalysis, incidentConsolidation). |
| **Qué hay** | App web funcional, documentación (OACI, consolidación incidentes, tipos de análisis). |
| **Qué puede faltar** | Persistencia (BD o export); integración con otros sistemas de seguridad operacional; informe ejecutivo reutilizable para valoración. |

---

### 3.7 Hack

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Framework de seguridad y confidencialidad (Alianzas Gancelot & Albatros): políticas, secretos, monitoreo, respuesta a incidentes, compliance. |
| **Stack** | Varios: `network-security/` (Node/TS, módulos Fortinet, honeypot, DDoS, forensic), `cyber-defense/`, scripts shell. |
| **Estructura** | `policies/`, `secrets/`, `monitoring/`, `incident-response/`, `compliance/`, `tools/`, `docs/`, `network-security/` (API, WebSocket, módulos). |
| **Qué hay** | Documentación de seguridad, scripts, módulos de red y Fortinet, muchos .md de estado y guías. |
| **Qué puede faltar** | Un “producto” empaquetado (si se vende); relación clara con ingresos o contratos; inventario de clientes que usan el framework. |

---

### 3.8 INTRANET (legacy)

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Intranet corporativa Albatros (gestión interna, módulos operativos). |
| **Stack** | PHP, Zend Framework, MySQL, XAMPP (Apache, MySQL, etc.). |
| **Estructura** | `xampp/htdocs/` (miles de PHP, JS, imágenes), documentación (COMO-INICIAR, CONFIGURACION-*, CORRECCIONES-*, fix-*.sql, fix-*.php). |
| **Qué hay** | Sistema grande en producción (o histórico), scripts de corrección y configuración, README con Docker. |
| **Qué puede faltar** | Inventario de módulos activos vs deprecados; roadmap de migración a Intranet Nueva o Plataforma; documentación de negocio (qué procesos cubre). |

---

### 3.9 Intranet Nueva

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Nueva intranet/extranet (extranet.goalbatros.com). |
| **Stack** | PHP, HTML, SCSS; carpeta `extranet.goalbatros.com/`. |
| **Estructura** | `extranet.goalbatros.com/`, `public_html/`, `tmp/` (sesiones), docs (REPORTE_ANALISIS_FINAL, CORRECCIONES_FINALES, SIN_BD). |
| **Qué hay** | Análisis y correcciones documentadas (incl. eliminación de archivo malicioso), páginas PHP/HTML corregidas, posibilidad de funcionar sin BD (mock). |
| **Qué puede faltar** | Definición de “producto mínimo” vs INTRANET legacy; plan de datos reales (BD); integración con Plataforma o single sign-on. |

---

### 3.10 Omac

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Sistema de órdenes de trabajo / asignaciones (Omac), con passkeys, PWA, cliente. |
| **Stack** | Monorepo pnpm: `apps/api` (Express/TS), `apps/web` (Next.js, Drizzle, SQLite, WebAuthn). |
| **Estructura** | API (auth, workOrders, assignments, metrics), web (admin, omac: assignments, work-orders, passkey, login), componentes (AssignmentCard, PasskeyPrompt, etc.), DB (Drizzle, SQLite). |
| **Qué hay** | Aplicación completa (auth, órdenes de trabajo, passkeys, PWA, despliegue Koyeb). |
| **Qué puede faltar** | Claridad si Omac es producto Albatros o externo; métricas de uso; documentación de licencia/contrato si se reutiliza en otros clientes. |

---

### 3.11 Plataforma

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Plataforma integral Albatros: intranet, venta de boletos, operaciones, gestión. Base desde Omac (Home, Login, Passkey, Dashboard). |
| **Stack** | Next.js 15, React 19, pnpm, Tailwind 4, Argon2, JWT, SQLite (better-sqlite3), KIU/Amadeus. |
| **Estructura** | App (buscar, login, dashboard), componentes (dashboard admin/ventas, Hikvision, KIU, ofertas, promociones), lib (auth, kiu, amadeus, hikvision, whatsapp), docs (deploy, seguridad, GTH, HIKVISION, usuarios). |
| **Qué hay** | Visión clara (VISION-PLATAFORMA.md), flujo de reserva, Mi cuenta, admin ventas/plataforma, integraciones (KIU, Amadeus, Pago Móvil, Hikvision). |
| **Qué puede faltar** | Passkey/WebAuthn completo (pendiente de portar desde Omac); métricas de negocio (reservas, ingresos); documentación de APIs para terceros. |

---

### 3.12 Presentacion albatros

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Presentación interactiva con video de fondo y widgets (institucional/marketing). |
| **Stack** | Next.js (frontend), backend Node (Koyeb), almacenamiento persistente (volúmenes). |
| **Estructura** | `app/` (admin: DocumentProcessor, PresentationsManager, WidgetEditor; componentes: VideoBackground, WidgetGrid), `backend/` (rutas: presentations, upload, content, backup). |
| **Qué hay** | Deploy en Koyeb, guías de almacenamiento, backup, recuperación, múltiples .md de verificación. |
| **Qué puede faltar** | Número de presentaciones activas; uso real (eventos, clientes); si es producto vendible o solo interno. |

---

### 3.13 Recordatorio

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Recordatorios de pagos con IA (texto/voz), eventos recurrentes en CalDAV (Nextcloud), contabilidad (asientos, conciliación, estados financieros). |
| **Stack** | Next.js, LocalAI, Whisper, CalDAV, TypeScript. |
| **Estructura** | `app/api/` (incomes, payments, accounting, analytics, bcv, export), componentes (Dashboard, IncomeForm, PaymentList, Accounting, VoiceAssistant), lib (ai, accounting, caldav, ml, nlp). |
| **Qué hay** | Sistema rico: ingresos, pagos, contabilidad, analítica, IA, voz, documentación fiscal. |
| **Qué puede faltar** | Si es producto Albatros o personal; métricas de usuarios; packaging para reventa (SaaS). |

---

### 3.14 Script pagina

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Script para explorar y descargar contenido de FlyEmbraer (manuales PDF, etc.) manteniendo estructura de carpetas. |
| **Stack** | Node 24, TypeScript. |
| **Estructura** | `src/` (explore-routes, map-structure, index), env.example. |
| **Qué hay** | Herramienta operativa con README (credenciales, ONLY_MANUALS, REQUIRE_LOGIN). |
| **Qué puede faltar** | Definición de uso (interno vs producto); no subir credenciales; política de uso de datos de FlyEmbraer. |

---

## 4. Resumen para valoración

### 4.1 Activos claros (productos/sistemas con valor)

| Rama | Valor principal |
|------|------------------|
| **Plataforma** | Core de negocio: venta de vuelos, intranet, integraciones (KIU, Amadeus, Pago Móvil, Hikvision). |
| **Control de Acceso** | Producto desplegado (PWA, OCR, carnets, QR), desplegable para otras oficinas. |
| **Ciber** | Cumplimiento normativo (P-CS, OACI), monitoreo Fortinet, diferenciador en aviación. |
| **Auditoria Ciberseguridad** | Servicio de pentest con informes y propuesta de valor; recurrente y facturable. |
| **INTRANET (legacy)** | Base instalada; valor por migración, soporte o sustitución. |
| **Presentacion albatros** | Activo de marketing/institucional; reutilizable en eventos. |
| **Recordatorio** | Producto con IA y contabilidad; potencial SaaS o interno. |
| **Omac** | Sistema de órdenes de trabajo y passkeys; reutilizable como producto o white-label. |

### 4.2 Activos de soporte / internos

| Rama | Nota |
|------|------|
| **Cpanel** | Utilidad operativa (backups, migraciones). |
| **Script pagina** | Herramienta específica (FlyEmbraer). |
| **Hack** | Framework y políticas de seguridad; valor más organizacional que producto directo. |
| **Gladys** | Herramienta OASI; valor en seguridad operacional. |
| **CIA** | Web institucional; valor de marca y captación. |

### 4.3 Lo que suele faltar para una valoración completa

1. **Ingresos y contratos**  
   Por producto/servicio: facturación recurrente, proyectos puntuales, mantenimiento.

2. **Métricas de uso**  
   Usuarios activos, reservas (Plataforma), visitas registradas (Control de Acceso), dominios auditados (Auditoria), etc.

3. **Documentación de producto**  
   One-pagers, precios, SLA, para Ciber, Control de Acceso, Auditoria, Recordatorio.

4. **Estado legal e IP**  
   Licencias de código (Omac vs Albatros), marcas, contratos con Gancelot u otros.

5. **Roadmap y dependencias**  
   Migración INTRANET → Intranet Nueva / Plataforma; Passkey completo en Plataforma; integración de Recordatorio/Gladys con el ecosistema.

6. **Inventario de clientes**  
   Lista de clientes por producto (auditorías, control de acceso, Ciber, etc.).

7. **Costes y mantenimiento**  
   Hosting (Koyeb, Vercel), dominios, tiempo interno por proyecto.

---

## 5. Siguientes pasos sugeridos (para anexar y valorar)

1. **Completar este árbol** con cualquier otra carpeta bajo `Work/Albatros` que no esté listada.
2. **Añadir por rama:**  
   - ¿Producto/servicio vendible? (sí/no)  
   - ¿En producción? (sí/no, URL o entorno)  
   - Cliente principal (Albatros, externo, ambos).  
3. **Crear un “inventario de entregables”** por proyecto (informes, builds, repos, documentación cliente).  
4. **Unificar logos y nombres** en un solo documento o carpeta (por producto/marca) para presentación y valoración.  
5. **Repetir el mismo tipo de análisis** para `Work/Aurelio` y `Work/PDF` cuando se quiera valorar el conjunto “Work” o solo Aurelio.

Si quieres, el siguiente paso puede ser: (a) profundizar en una rama concreta, (b) generar una tabla “producto / en producción / ingresos / falta” a partir de este documento, o (c) esbozar un índice de documentos (logos, one-pagers, métricas) a rellenar para la valoración.
