# GURU — Plan Maestro: Portafolio, Servicios y Plataforma

**Objetivo:** Organizar el portafolio de proyectos, definir la oferta de servicios digitales de GURU y preparar la presentación para inversión y venta.

---

## 1. Análisis exhaustivo del portafolio (GitHub aurelio104)

### 1.1 Resumen por categoría

| Categoría | Repositorios | Capacidad demostrada |
|----------|--------------|----------------------|
| **Plataformas / centros de mando** | Omac, plataforma-albatros | Next.js 15, React 19, dashboards, intranet, venta de boletos, integraciones (Amadeus, KIU, Hikvision, WhatsApp) |
| **Control y operaciones** | control-acceso-albatros, rt-reportes | Control de acceso con OCR/QR, PWA de reportes multiempresa, Excel inteligente, roles y auditoría |
| **Web / presentación** | JCavalier, albatros-presentacion, WebArJC, WebArEspacio, WebArGeo, WebArEpacio, maracay-deportiva | Sitios web, posiblemente AR/geo |
| **Apps / productos** | RayPremios, Cuadernos, CuadernosOficial, BAMVino, MundoIAanime, BotArbi, memoria, mi-app-guru, gvx-demo | Apps específicas, bots, IA, vino, premios, cuadernos |
| **Admin / negocio** | Admin, bantx, insurance-app, repropaper | Paneles admin, fintech/seguros, impresión |
| **Otros** | hack | Seguridad / pruebas |

---

### 1.2 Análisis detallado por proyecto (repos analizados)

#### Omac — Centro de mando inteligente
- **Stack:** Next.js 15, TypeScript, SQLite (better-sqlite3), Argon2, JWT, WebAuthn (passkeys), Baileys (WhatsApp), Recharts, Tailwind.
- **Qué hace:** Operaciones inteligentes de campus: auth (email/pass + passkeys), dashboards, integración WhatsApp, despliegue Vercel + Koyeb.
- **Documentación:** ENV-VARIABLES, planes de seguridad, DNS, pentest.
- **Valor para GURU:** Base reutilizable para "centros de mando" y dashboards empresariales; referencia de seguridad y auth moderna.

#### plataforma-albatros — Intranet, venta de boletos y operaciones
- **Stack:** Next.js 15, React 19, Tailwind 4, Framer Motion, Recharts, Argon2, JWT, SQLite, Baileys, Amadeus, KIU, Hikvision.
- **Qué hace:** Búsqueda de vuelos (Amadeus/KIU), flujo de reserva completo (pasajeros, pago móvil, PNR), "Mi cuenta" (reservas, perfil, viajeros, puntos), intranet por roles (Junta, GTH, AVSEC, Ops, Finanzas), admin de ofertas/promos, PWA, E2E con Playwright.
- **Documentación:** VISION-PLATAFORMA.md (inventario + roadmap), certificaciones, conexión KIU/Amadeus, Hikvision.
- **Valor para GURU:** Caso estrella: plataforma de venta de vuelos + intranet empresarial; muestra capacidad full-stack, integraciones GDS y sistemas corporativos.

#### control-acceso-albatros — Control de acceso inteligente
- **Stack:** Node 24, TypeScript, React 19, Vite, Express, Tailwind 4, Tesseract.js (OCR), QR.
- **Qué hace:** Registro de visitas (manual o OCR desde cédulas), fotos, carnets con QR, historial; optimizado para smartphone/iPad; modo sin conexión.
- **Valor para GURU:** Servicio de "control de acceso + recepción digital" para oficinas y edificios.

#### rt-reportes — PWA de reportes multiempresa
- **Stack:** Backend Fastify + TypeScript (Node 24), Frontend React 19 + Vite + Tailwind 4, SQLite, PWA.
- **Qué hace:** Subida de Excel, extracción inteligente de columnas (con opción IA/OpenAI), dashboard (totales, góndolas, prioridades), roles (Master, Uploader, Boss), historial y auditoría, placeholder WhatsApp.
- **Valor para GURU:** Producto "reportes y control contable desde Excel" para PYMEs o cadenas; base para servicios de automatización de datos.

#### Resto de repos (inferido por nombre y contexto)
- **JCavalier:** Posible panel/admin o producto con marca.
- **RayPremios, Cuadernos, CuadernosOficial:** Productos de premios y cuadernos (apps/web).
- **BAMVino, insurance-app, bantx:** Verticales (vino, seguros, banca/transacciones).
- **MundoIAanime, BotArbi, memoria, mi-app-guru:** IA, bots, memoria/notas, app "guru".
- **gvx-demo:** Demo (probablemente gráficos/visualización o producto).
- **maracay-deportiva:** Contenido deportivo/medio.
- **WebArJC, WebArEspacio, WebArGeo, WebArEpacio:** Sitios web y posiblemente experiencias AR/geo.
- **albatros-presentacion:** Presentación institucional Albatros.
- **Admin, repropaper, hack:** Admin genérico, impresión, seguridad/pruebas.

---

### 1.3 Mapa de capacidades técnicas (lo que ya sabes hacer)

| Capacidad | Evidencia en repos |
|-----------|--------------------|
| **Frontend moderno** | Next.js 15, React 19, Vite, Tailwind 4, Framer Motion, Recharts, PWA |
| **Backend y API** | Next.js API Routes, Fastify, Express, TypeScript |
| **Auth y seguridad** | Argon2, JWT, WebAuthn/Passkeys, roles, CORS, auditoría |
| **Bases de datos** | SQLite (better-sqlite3), modelos usuarios/reservas/reportes |
| **Integraciones** | Amadeus, KIU, Hikvision, WhatsApp (Baileys), Excel, OCR (Tesseract), QR |
| **DevOps / deploy** | Vercel, Koyeb, Docker, GitHub Actions |
| **Calidad** | Playwright E2E, ESLint, documentación técnica y de seguridad |
| **UX móvil** | Control de acceso responsive, PWA, "sin conexión" |

---

## 2. Catálogo de servicios GURU (qué vender)

Propuesta de **servicios digitales** alineados con lo que ya tienes construido:

1. **Plataformas web y aplicaciones a medida**
   - Sitios corporativos, landing pages, PWAs.
   - Intranets y portales con roles (como Albatros).
   - Bases: Omac, plataforma-albatros, JCavalier, WebAr*.

2. **Venta y reservas online**
   - Motores de búsqueda y reserva (vuelos, servicios).
   - Integración con GDS (KIU, Amadeus) y pasarelas de pago.
   - Caso de referencia: plataforma-albatros.

3. **Centros de mando y dashboards**
   - Dashboards operativos y de negocio.
   - Métricas, gráficos, alertas (con opción WhatsApp).
   - Bases: Omac, rt-reportes.

4. **Control de acceso y recepción digital**
   - Registro de visitas con OCR (cédulas) y QR.
   - Carnets digitales e historial.
   - Caso: control-acceso-albatros.

5. **Automatización de datos y reportes**
   - Carga de Excel, extracción inteligente de columnas.
   - Reportes multiempresa, priorización, gráficas.
   - Base: rt-reportes.

6. **Integraciones y APIs**
   - APIs propias o integración con terceros (GDS, cámaras, WhatsApp, bancos).
   - Microservicios y backends para frontends existentes.

7. **Consultoría y auditoría**
   - Seguridad (pentest, DNS, variables de entorno).
   - Documentación técnica y planes de mejora (como en Omac/plataforma-albatros).

---

## 3. Plan de acción (corto y medio plazo)

### Fase 1 — Ordenar y presentar (2–3 semanas)

1. **Unificar la lista de proyectos**
   - Mantener en `_repos` o en un solo documento una tabla con: nombre, descripción en 1 línea, stack, estado (producción/demo/archivo), y si es "caso de estudio" para venta.
   - Marcar 4–6 proyectos "estrellas" para el inversionista (ej.: plataforma-albatros, Omac, rt-reportes, control-acceso-albatros + 2 más).

2. **Documento "Portafolio GURU" (PDF o Notion)**
   - Una página por proyecto estrella: problema, solución, stack, resultado (enlaces o capturas).
   - Una página de "capacidades técnicas" (resumen del mapa anterior).
   - Una página de "servicios que ofrecemos" (catálogo anterior).

3. **Pitch para inversión**
   - Problema: "Tenemos capacidad y proyectos dispersos; falta estructura para vender."
   - Solución: "GURU como marca que agrupa servicios digitales y portafolio ordenado."
   - Tracción: clientes o proyectos ya entregados (Albatros, RT, etc.).
   - Uso de inversión: tiempo para comercializar, mejorar producto, y/o construir la plataforma de portafolio (Fase 2).

### Fase 2 — Plataforma GURU (sitio + portafolio) (4–8 semanas)

4. **Landing / sitio GURU**
   - Home: qué es GURU, propuesta de valor, servicios (enlaces al catálogo).
   - Sección "Portafolio" o "Proyectos": tarjetas por proyecto con descripción corta, stack, y "Ver caso" (detalle o enlace externo).
   - Contacto / CTA para empresas e inversionistas.
   - Stack sugerido: Next.js + Tailwind (consistente con Omac/plataforma-albatros); despliegue en Vercel.

5. **Área "Solo inversionistas" (opcional)**
   - Subdominio o ruta protegida con contraseña con: métricas, roadmap, proyecciones, documentos legales si aplica.

### Fase 3 — Comercialización y producto (continuo)

6. **Convertir proyectos en "productos"**
   - Definir 2–3 "productos empaquetados" (ej.: "Control de acceso GURU", "Reportes desde Excel GURU") con precio o paquete base.
   - Reutilizar código de control-acceso-albatros y rt-reportes como base white-label.

7. **Procesos internos**
   - Cómo se cotiza, se entrega y se da soporte (plantillas, plazos, SLA básico).
   - Repositorio o doc interno "GURU – Procesos" para que cualquier dev pueda alinearse.

---

## 4. Alcance de lo que desarrollaremos (plataforma GURU)

### 4.1 Sitio web GURU (prioridad 1)

- **Alcance**
  - Una sola web (o subdominio) con:
    - Home (mensaje, servicios, CTA).
    - Portafolio (lista de proyectos con filtros opcionales: tipo, stack).
    - Detalle de proyecto (nombre, descripción, tecnologías, resultado/demo si hay).
    - Servicios (catálogo con breve descripción).
    - Contacto (formulario y/o email).
  - Diseño profesional y responsive; contenido en español.
  - Despliegue en Vercel; dominio propio cuando lo definas.

- **Fuera de alcance en v1**
  - Login de clientes, facturación, blog (se pueden añadir después).
  - Backoffice completo (se puede limitar a formulario de contacto y email).

### 4.2 Documentos y artefactos (prioridad 1)

- **Portafolio.pdf (o equivalente)**
  - Resumen ejecutivo + proyectos estrella + capacidades + servicios.
- **Pitch deck**
  - 5–10 diapositivas para inversionista: problema, solución, equipo/capacidad, tracción, uso de fondos, siguiente paso.

### 4.3 Productos empaquetados (prioridad 2, después del sitio)

- Versiones "GURU" de:
  - Control de acceso (a partir de control-acceso-albatros).
  - Reportes desde Excel (a partir de rt-reportes).
- Configuración por cliente (nombre, logo, colores) y despliegue por entorno.

---

## 5. Próximos pasos inmediatos

1. **Confirmar** los 4–6 proyectos estrella que quieres en el portafolio y el orden de importancia.
2. **Crear** en este repo la estructura del sitio GURU (por ejemplo `apps/web` o `sites/guru`) con Next.js + Tailwind.
3. **Redactar** los textos del Home, Servicios y Portafolio (una versión corta por proyecto).
4. **Definir** nombre de dominio y marca (logo, colores) para GURU.
5. **Programar** una revisión del Plan Maestro con el inversionista (reunión o documento compartido).

---

## 6. Estructura sugerida del repositorio GURU

```
GURU/
├── README.md                 # Descripción del proyecto GURU
├── GURU-PLAN-MAESTRO.md      # Este documento
├── docs/
│   ├── portafolio.md         # Lista detallada de proyectos (tabla)
│   ├── servicios.md          # Catálogo de servicios
│   └── pitch.md              # Guion o bullets del pitch
├── apps/
│   └── web/                  # Next.js site (landing + portafolio)
│       ├── app/
│       ├── components/
│       └── package.json
└── _repos/                   # Clones de referencia (opcional, o solo doc)
    └── ...
```

---

*Documento generado a partir del análisis de los repositorios de GitHub (aurelio104). Conexión SSH a GitHub verificada desde este entorno. Para profundizar en un repo no analizado aquí, se puede clonar y añadir su resumen a `docs/portafolio.md`.*
