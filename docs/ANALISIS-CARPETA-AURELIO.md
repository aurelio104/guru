# Análisis completo: carpeta Aurelio (Work)

**Objetivo:** Inventario de la carpeta local `Work/Aurelio` con todas sus ramas y subcarpetas, para completar la información necesaria para valorar el portafolio (empresa / marca Aurelio / GURU).

**Ámbito:** `/Users/aureliomedina/Documents/Work/Aurelio`  
**Fecha de análisis:** 10 Feb 2026

---

## 1. Vista general de Work/Aurelio

```
Work/Aurelio/
├── A/                    # GURU — sitio + API (monorepo Next + Fastify)
├── BotArbi/              # Analizador/ejecutor arbitraje cripto (Binance, CCXT)
├── Fotos/                # Mejora de resolución con IA (Real-ESRGAN, ComfyUI, integración Jcavalier)
├── GVX/                  # GVX City Screens — reserva de slots en pantallas urbanas
├── Jcavalier/            # E-commerce con bot de WhatsApp inteligente (backend + frontend)
├── maracay-deportiva/    # Sistema puntos, ventas y administración (Maracay Deportiva)
├── Mundoiaanime/         # MundoIAanime — cursos/ventas + bot WhatsApp (backend + frontend)
├── Pago Movil/           # App bancaria — verificación pagos, auditoría (Python, PostgreSQL)
└── RT/                   # PWA reportes multiempresa (Excel, totales, góndolas, roles)
```

**Total aproximado:** ~29.400 archivos (muchos en `Mundoiaanime` por builds/deps).

---

## 2. Árbol detallado por carpeta

### 2.1 A (GURU)

```
A/
├── apps/
│   ├── api/          # API Fastify (formulario contacto) — Koyeb
│   └── web/          # Sitio público GURU — Next.js 15, Tailwind 4 — Vercel
├── docs/             # Portafolio, servicios, deploy, análisis Albatros/Aurelio
├── scripts/          # sync-vercel-domains.mjs
├── APLAT-PLAN-MAESTRO.md
├── package.json, pnpm-workspace.yaml
└── README.md
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Marca GURU: servicios digitales (plataformas web, venta/reservas, centros de mando, control de acceso, reportes, integraciones). Sitio público + API contacto. |
| **Stack** | Next.js 15, Tailwind 4, TypeScript (web); Node 24, Fastify (api). |
| **Qué hay** | Landing (Hero, Servicios, Portfolio, Contact, HowItWorks, Intelligence), login, docs (portafolio, servicios, DEPLOY-*, ANALISIS-CARPETA-ALBATROS). Plan maestro con análisis de repos y capacidades. |
| **Qué puede faltar** | Logos por proyecto; métricas (visitas, leads); página de precios/servicios; casos de éxito con datos. |

---

### 2.2 BotArbi (Bitcoin Arbitrage Analyzer)

```
BotArbi/
├── app/              # Next.js: páginas (bot, admin, trazabilidad), api (29 rutas .ts)
├── components/       # ApiValidator, ExecutionTracker, widgets (Capital, Opportunity, Performance)
├── data/             # ~335 archivos (md + json) — datos de análisis / bot-learning
├── lib/              # arbitrage, binance-arbitrage, bot/risk-manager, auth, security
├── logs/             # Simulaciones (complete-simulation, profitable-operations, etc.)
├── scripts/          # ~85 archivos (js, ts, sh) — pruebas, migración, seguridad
├── package.json      # bitcoin-arbitrage-analyzer, Next 14, ccxt, better-sqlite3, recharts
└── *.md              # ESTADO-*, ANALISIS-*, CREDENCIALES-*, MONITOREO-*
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Análisis y ejecución de arbitraje en cripto (Binance, CCXT). Dashboard, trazabilidad, validaciones de profit, riesgo. |
| **Stack** | Next.js 14, React 18, TypeScript, better-sqlite3, ccxt, recharts, next-pwa. |
| **Qué hay** | Lógica de arbitraje, risk manager, múltiples validaciones para solo ejecutar con ganancia, docs de estado y operaciones reales, datos y logs de simulaciones. |
| **Qué puede faltar** | Claridad si es producto vendible o personal; métricas reales de rendimiento; cumplimiento regulatorio si hay dinero real; documentación de “valor” para terceros. |

---

### 2.3 Fotos

```
Fotos/
├── app/              # Next.js: API (enhance, integrations/jcavalier), páginas (viewer, generate)
├── data/             # Jobs (jcavalier colecciones, photogrammetry zapatos)
├── public/models/    # Modelos 3D generados (.glb)
├── scripts/          # remove_bg.py, spin_mockup.py, upscale.py, jcavalier-worker.js
├── requirements.txt  # Python (Real-ESRGAN, etc.)
├── env.example
└── README.md
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Subir foto → mejorar resolución con Real-ESRGAN (Python). Opcional: ComfyUI (txt2img, img2img, inpainting), visor 3D, webhook para Jcavalier (colecciones/productos). |
| **Stack** | Next.js, Tailwind, Python 3.9+, PyTorch, Real-ESRGAN, ComfyUI (externo). |
| **Qué hay** | API enhance, integración Jcavalier (import/status), página generate (ComfyUI), viewer 3D, datos de jobs y fotogrametría. |
| **Qué puede faltar** | Si se ofrece como servicio: precios, SLA; documentación de uso para clientes externos; métricas de uso. |

---

### 2.4 GVX (GVX City Screens)

```
GVX/
├── api/              # Express + TypeScript, multer, CORS — demo API (Koyeb)
├── web/              # Estático: index.html, admin.html, screen.html, css/gvx.css, js/
├── .env, .env.koyeb-example
└── (sin README en raíz)
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Reserva de slots (15 s) en pantallas urbanas. Pasos: 1) Agenda (fecha, ciudad, pantalla), 2) Sube video, 3) Confirma/pago. Admin y pantalla (screen) para visualización. |
| **Stack** | API: Node, Express, TypeScript, multer. Web: HTML/CSS/JS estático, manifest, sw.js. |
| **Qué hay** | Demo funcional; API desplegada en Koyeb (URL en index); flujo de reserva y subida de video. |
| **Qué puede faltar** | README de producto; si hay cliente real (Maracay/Caracas); pasarela de pago real; inventario de pantallas. |

---

### 2.5 Jcavalier

```
Jcavalier/
├── backend/          # Node/TS: main.ts, flows (ecommerce, delivery, payment, thankyou), handlers, intelligence (AI, RAG, vision, OCR), routes (admin, catalog, whatsapp, passkey), MongoDB
├── frontend/         # React/JSX, imágenes (104 jpg), admin
├── data/catalogo.json
├── Dockerfile, Procfile, vercel.json
├── scripts/          # deploy-images, migrateCatalog, setup-github-token
└── *.md              # ANALISIS_ERRORES_KOYEB_VERCEL, CONFIGURACION_AUTO_DEPLOY, PLAN_MIGRACION_TAILWIND_4, etc.
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | E-commerce con bot de WhatsApp inteligente: catálogo, pedidos, pagos, entrega, recomendaciones, IA, visión (reconocimiento producto), OCR comprobantes, passkey. |
| **Stack** | Backend: Node 24, TypeScript, MongoDB. Frontend: React, Tailwind (migración a v4 en curso). |
| **Qué hay** | Motor conversacional, flows completos, handlers (pedido, estado, pago, imagen comprobante), intelligence (intent, RAG, ML, fraud), admin (pedidos, catálogo, estadísticas), integración con Fotos (webhook). |
| **Qué puede faltar** | Un “one-pager” producto; si es white-label o solo Jcavalier; métricas de ventas/usuarios; documentación para revender el stack. |

---

### 2.6 maracay-deportiva

```
maracay-deportiva/
├── backend/          # Node/TS, Express, MongoDB — ~139 archivos (controllers, routes, etc.)
├── frontend/         # React, Vite — ~221 archivos (páginas, componentes, imágenes)
├── data/             # bot-modules.json, catalogo.json, promo-config.json
├── backups/          # Configuraciones (koyeb, vercel, git)
├── scripts/          # configurar-todo, dev, koyeb-set-env, test-login-*
├── docs/             # CATALOGO_VACIO_Y_404_IMAGENES.md
├── koyeb.yaml, vercel.json, Dockerfile
└── Muchos .md        # DEPLOY_*, ESTADO_*, SOLUCION_*, USUARIOS_Y_CONTRASEÑAS, etc.
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Sistema de puntos, ventas y administración para Maracay Deportiva. Roles: Master, Admin, Cliente. Módulos: puntos, venta catálogos ($5 = 9 pts), retiro premios, historial. |
| **Stack** | Backend: Node ≥20, TypeScript, MongoDB. Frontend: React, Vite. Deploy: Koyeb (backend), Vercel (frontend). |
| **Qué hay** | Dashboards por rol, calculadora de puntos, catálogos, premios, historial; documentación extensa de deploy y troubleshooting. |
| **Qué puede faltar** | Métricas de negocio (ventas, puntos canjeados); relación contractual con Maracay Deportiva; roadmap post-lanzamiento. |

---

### 2.7 Mundoiaanime (MundoIAanime)

```
Mundoiaanime/
└── MundoIAanime/
    ├── backend/      # Node/TS: WhatsApp, cursos, pedidos, visitas, analytics, OCR, IA, recomendaciones, A/B testing, alertas
    ├── frontend/     # React (admin, público)
    └── (estructura similar a Jcavalier en concepto)
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | Plataforma de cursos/ventas con bot WhatsApp: pedidos, comprobantes, pagos, visitas, analytics, recomendaciones, IA (curso detector, intent, voz). |
| **Stack** | Backend: Node, TypeScript, MongoDB. Frontend: React. |
| **Qué hay** | Handlers (pedido curso, comprobante, pago verificado), servicios (cursos, analytics, marketing automation, prediction), rutas (cursos, pedidos, visitas, admin). |
| **Qué puede faltar** | Diferenciación clara vs Jcavalier (vertical cursos vs e-commerce genérico); métricas; si es cliente real (MundoIAanime) o producto reutilizable. |

---

### 2.8 Pago Movil

```
Pago Movil/
├── app_bancaria Nueva/   # Versión actual: API + app PyQt (dashboard, login, movimientos, auditoría, verificación, tasa)
├── app_bancariaOriginal/ # Versión original (misma estructura)
├── app_bancaria.zip
├── APP_BANCARIA_OPCION_RECOMENDADA_MAC.txt
└── (README en app_bancaria Nueva/README_LOCAL.md)
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | App bancaria para verificación de pagos (Pago Móvil), auditoría, movimientos, tasa BCV, export PDF/comandas. Interfaz desktop (PyQt, temas dark/light). |
| **Stack** | Python, PostgreSQL, API (api_server.py), PyQt (views: dashboard, login, home, movimientos, paymovil, auditoria, config). |
| **Qué hay** | API de verificación, controladores (auth, movimientos, tasa, verificacion, audit), BD (schema, migrate), scripts (create_user, create_api_key, seed). |
| **Qué puede faltar** | README en raíz; si es producto interno o para terceros; documentación de API pública; relación con integración Pago Móvil en Plataforma Albatros. |

---

### 2.9 RT (Reportes Multiempresa)

```
RT/
├── backend/          # Fastify, TypeScript, SQLite — auth, upload Excel, intelligence (clasificación columnas), dashboard, users, webauthn, whatsapp
├── frontend/         # React 19, Vite, Tailwind 4 — Login, Dashboard, Admin, Passkey, widgets (Upload, Totals, Gondolas, Chart, History)
├── docs/             # INTELIGENCIA_PROCESO.md, PRUEBAS.md
├── DEPLOY.md, INSTRUCCIONES_DESPLIEGUE.md, RESUMEN_PROYECTO.md
├── Proyecto RT.pdf   # Especificación
├── .koyeb.yaml, vercel.json
└── package.json
```

| Aspecto | Contenido |
|--------|-----------|
| **Propósito** | PWA de reportes multiempresa: subir Excel, extracción inteligente de columnas (opción IA), dashboard (totales, góndolas, prioridades), roles (Master, Uploader, Boss), historial, auditoría. |
| **Stack** | Backend: Node 24, Fastify, TypeScript, SQLite (better-sqlite3). Frontend: React 19, Vite, Tailwind 4, PWA. |
| **Qué hay** | Login, Passkey/WebAuthn, upload Excel, clasificación de columnas, widgets (totales, ventas, gastos, góndolas, gráficas), admin de usuarios, documentación de deploy (Koyeb + Vercel). |
| **Qué puede faltar** | Clientes/empresas usando el sistema; métricas de uso; si la “inteligencia” usa OpenAI u otro (coste); especificación en PDF alineada con lo implementado. |

---

## 3. Resumen para valoración (Aurelio / GURU)

### 3.1 Activos con valor claro

| Carpeta | Valor principal |
|---------|------------------|
| **A (GURU)** | Marca y sitio público; plan maestro; base para presentación a inversión/venta. |
| **Jcavalier** | E-commerce + bot WhatsApp completo (IA, visión, OCR, flows); reutilizable como producto o white-label. |
| **maracay-deportiva** | Sistema de puntos y ventas en producción; caso de uso concreto (cliente Maracay Deportiva). |
| **RT** | Producto reportes/Excel multiempresa; roles, PWA, deploy listo; base para automatización de datos. |
| **Fotos** | Mejora de imagen con IA + integración Jcavalier; valor para e-commerce y fotogrametría. |
| **GVX** | Producto “pantallas urbanas”; demo listo; potencial de ingresos por slots/publicidad. |

### 3.2 Activos de soporte / internos / experimentales

| Carpeta | Nota |
|---------|------|
| **BotArbi** | Arbitraje cripto; valor técnico alto; riesgo regulatorio y operativo; definir si es producto o personal. |
| **Mundoiaanime** | Similar stack a Jcavalier (cursos + WhatsApp); valor si hay cliente real o se empaqueta como vertical. |
| **Pago Movil** | Utilidad para verificación de pagos; relación con Albatros/Plataforma; documentar si es producto o interno. |

### 3.3 Lo que suele faltar para una valoración completa

1. **Ingresos y contratos** por proyecto (GURU, Jcavalier, maracay-deportiva, RT, GVX, Fotos).
2. **Métricas de uso**: usuarios activos, ventas, reportes subidos, slots reservados, etc.
3. **One-pagers o fichas de producto** por cada activo vendible.
4. **Logos y nombres** unificados (ya iniciado en A con portafolio; completar por proyecto).
5. **Relación Albatros ↔ Aurelio**: qué es compartido (ej. Pago Móvil, Control de Acceso), qué es solo Aurelio.
6. **Estado legal e IP**: marcas (GURU, Jcavalier, GVX), licencias de código.
7. **Costes**: hosting (Koyeb, Vercel), dominios, tiempo por proyecto.

---

## 4. Cruce con carpeta Albatros

- **A (GURU)** incluye en `docs/` el análisis de la carpeta **Albatros** (`ANALISIS-CARPETA-ALBATROS.md`).
- Proyectos que aparecen en ambos contextos (Albatros y/o Plan Maestro): Omac, plataforma-albatros, control-acceso-albatros, rt-reportes, JCavalier, maracay-deportiva, MundoIAanime, BotArbi, gvx-demo, albatros-presentacion.
- Para una **valoración unificada** (empresa que engloba Albatros + Aurelio/GURU), conviene tener un único inventario de productos, ingresos y métricas, y este documento (Aurelio) junto con el de Albatros son la base.

---

## 5. Siguientes pasos sugeridos

1. Completar **logos** y **nombres** por proyecto en A (portafolio y docs).
2. Añadir por carpeta: **¿En producción?** (sí/no, URL), **¿Cliente/ingresos?** (sí/no), **Rol** (producto vendible / interno / experimental).
3. Crear **fichas de producto** (one-pager) para: GURU, Jcavalier, maracay-deportiva, RT, GVX, Fotos.
4. Unificar en un **índice** (en A/docs o en Work) los documentos: ANALISIS-CARPETA-ALBATROS.md, ANALISIS-CARPETA-AURELIO.md, portafolio.md, servicios.md, APLAT-PLAN-MAESTRO.md.
5. Cuando corresponda: repetir estilo de análisis para **Work/PDF** u otras carpetas que entren en la valoración.
