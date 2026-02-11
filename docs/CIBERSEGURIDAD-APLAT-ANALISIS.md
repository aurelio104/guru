# Análisis completo: Ciberseguridad en APlat

Documento que analiza la parte de ciberseguridad de APlat: los tres pilares (Auditoría Ciberseguridad, Ciber, Hack), su estado real, por qué no están desplegados públicamente y qué valor aportan a la plataforma y a la valoración.

---

## 1. Resumen ejecutivo

- **En el sitio APlat** la sección **Ciberseguridad** (`#ciberseguridad`) muestra tres pilares: **Auditoría Ciberseguridad**, **Ciber** y **Hack**.
- Los tres son **sistemas que están en funcionamiento** (código listo, usados en contexto personal/interno), pero **no están desplegados públicamente** porque son productos de uso personal o interno (Albatros/alianzas), no comerciales abiertos.
- Forman parte de la **capacidad y el portafolio** de APlat: demuestran conocimiento en pentest, monitoreo, cumplimiento normativo (OACI, P-CS) y framework de seguridad. Suman a la valoración como **activos técnicos y diferenciadores**.

---

## 2. Los tres pilares (qué son y qué hay)

### 2.1 Auditoría Ciberseguridad

| Aspecto | Detalle |
|--------|----------|
| **Qué es** | Herramienta de **pentest avanzado con IA**: auditorías de seguridad con OWASP Top 10 y OWASP LLM 2025 (spoofing, técnicas avanzadas). Genera informes por dominio. |
| **Stack** | Node 18+, TypeScript. Scripts en `analisis/` (ej. `pentest-ia-completo.ts`), export PDF/ZIP. |
| **Estructura** | `analisis/` (src, scripts), `resultados/` por dominio (ej. mundoiaanime.com, omac569.com). |
| **Entregables** | RESUMEN-EJECUTIVO.md, INFORME-TECNICO.md, reporte-completo.json, PROPUESTA-VALOR-CLIENTE.md, evidencia, export PDF/ZIP. |
| **Estado** | **Operativo.** Se ejecuta cuando se necesita; no es un servicio público en la nube. Uso personal/interno para auditorías. |
| **Valor para APlat** | Servicio de **consultoría y auditoría** facturable (pentest, informes, propuesta de valor). Recurrente. Referencia en NEGOCIO-APLAT y servicios: 2.000 – 8.000 USD por proyecto. |

---

### 2.2 Ciber

| Aspecto | Detalle |
|--------|----------|
| **Qué es** | **Sistema de monitoreo de ciberseguridad en tiempo real** para el Programa P-CS (manual MG-P-CS-004). Cumplimiento OACI, integración Fortinet, detección de amenazas. |
| **Stack** | Backend Node/Express/TS + Socket.IO (puerto 3100), frontend React/Vite/TS (5173), cliente Windows **CiberWin**. |
| **Estructura** | `server/` (services: Fortinet, compliance, network, security), `client/` (dashboard, widgets), `CiberWin/` (cliente Windows), documentación (Fortinet, rate limiting, trusted hosts, API, GUI), releases. |
| **Estado** | **Operativo.** Sistema completo (backend + frontend + CiberWin). No desplegado como producto público; uso en contexto Albatros / programa P-CS / personal. |
| **Valor para APlat** | **Cumplimiento normativo** (P-CS, OACI), monitoreo Fortinet. Diferenciador en aviación y sectores regulados. Base para ofrecer “monitoreo de ciberseguridad” como servicio o producto empaquetado si en el futuro se decide desplegar para terceros. |

---

### 2.3 Hack

| Aspecto | Detalle |
|--------|----------|
| **Qué es** | **Framework de seguridad y confidencialidad** (Alianzas Gancelot & Albatros): políticas, secretos, monitoreo, respuesta a incidentes, compliance. |
| **Stack** | `network-security/` (Node/TS: módulos Fortinet, honeypot, DDoS, forensic), `cyber-defense/`, scripts shell. |
| **Estructura** | `policies/`, `secrets/`, `monitoring/`, `incident-response/`, `compliance/`, `tools/`, `docs/`, `network-security/` (API, WebSocket, módulos). |
| **Estado** | **Operativo** como conjunto de políticas, documentación y módulos. No es una app desplegada en una URL pública; valor organizacional e interno. |
| **Valor para APlat** | Demuestra **capacidad en seguridad operacional**: políticas, respuesta a incidentes, integración con Fortinet y red. Refuerza el mensaje “ciberseguridad como prioridad” y la oferta de consultoría (documentación, planes de mejora). |

---

## 3. Por qué no están desplegados públicamente

- Son productos/sistemas **en uso** (corren cuando se necesitan), pero **no publicados en internet** como servicio abierto porque:
  - **Uso personal o interno:** pensados para Albatros, programa P-CS, alianzas o uso propio.
  - **Alcance deliberado:** no se ha buscado exponerlos como SaaS o landing pública; se mantienen como capacidad interna y como demostración de portafolio en el sitio APlat.
- En la web de APlat ya se aclara: *“Sistemas independientes · No desplegados públicamente”* y cada tarjeta lleva la etiqueta *“Sistema independiente”*.

---

## 4. Cómo encajan en la valoración y en el pitch

| Elemento | Contribución |
|----------|---------------|
| **Capacidad demostrada** | Pentest con IA, monitoreo en tiempo real (Fortinet, OACI), framework de políticas y respuesta a incidentes. No es solo “consultoría de seguridad”: hay herramientas y sistemas construidos. |
| **Activos reutilizables** | Auditoría (scripts + informes) y Ciber (backend + frontend + CiberWin) pueden, si se decide, empaquetarse o desplegarse para otros clientes (aviación, empresas reguladas, auditorías). |
| **Diferenciación** | Pocas product studios en la región muestran ciberseguridad (OWASP LLM, P-CS, Fortinet) como parte del portafolio. Refuerza la propuesta de valor “tecnología y seguridad”. |
| **Ingresos potenciales** | Auditoría Ciberseguridad ya está en el catálogo de precios (2k–8k USD); Ciber y Hack apoyan ofertas de monitoreo y consultoría. |

Para el **inversionista** puedes resumir así: *“Además del portafolio público (Omac, JCavalier, etc.), tenemos tres pilares de ciberseguridad que ya están operativos pero son de uso personal/interno: auditorías con IA, monitoreo tipo P-CS/OACI y un framework de seguridad. No están en la nube como producto público, pero forman parte de la capacidad y del valor de la plataforma.”*

---

## 5. Dónde aparece en APlat

| Lugar | Contenido |
|-------|-----------|
| **Sitio web** | Sección `#ciberseguridad` (componente `CybersecurityPillars`), con fondo `CybersecurityBackground`, título “Ciberseguridad como prioridad” y las tres tarjetas (Auditoría, Ciber, Hack). |
| **Navegación** | Enlace “Ciberseguridad” en Nav y Footer. |
| **Logos** | `public/portafolio/auditoria-ciberseguridad.png`, `ciber.png`. Hack sin logo (icono Lock). |
| **Servicios** | En `Services.tsx` se menciona “Seguridad, pentest, DNS y documentación técnica”. |
| **Docs** | Este análisis; detalle técnico y de valor en `ANALISIS-CARPETA-ALBATROS.md` (Auditoria Ciberseguridad, Ciber, Hack). |

---

## 6. Checklist para presentación al inversionista

- [ ] Dejar claro que **los tres pilares están operativos** (no son solo mockups).
- [ ] Explicar que **no están desplegados públicamente** porque son de uso personal/interno.
- [ ] Recalcar que **suman capacidad y activos** a la valoración (pentest, monitoreo, cumplimiento, framework).
- [ ] Mencionar **potencial de ingresos** (auditorías 2k–8k USD; monitoreo/compliance si se empaqueta).
- [ ] Mostrar la sección **Ciberseguridad** del sitio como prueba de que la plataforma incluye esta línea de producto.

---

*Análisis alineado con `ANALISIS-CARPETA-ALBATROS.md`, `CybersecurityPillars.tsx` y `docs/NEGOCIO-APLAT.md`. Actualizar si cambia el estado (despliegue público, clientes, precios) de alguno de los tres pilares.*
