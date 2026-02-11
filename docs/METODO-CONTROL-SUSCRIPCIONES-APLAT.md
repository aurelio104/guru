# Método: control de suscripciones mensuales desde APlat

Objetivo: desde APlat poder **controlar las mensualidades** de los proyectos desplegados (Omac, JCavalier, Maracay deportiva), con **recordatorio de pago por WhatsApp** (replicando la lógica de Omac) y **desconexión automática** si no hay pago en la fecha límite. Control vía **API/CLI** (Vercel, Koyeb) o script programado.

---

## 1. Reglas de negocio que quieres

| Cliente / proyecto   | Vencimiento              | Recordatorio WhatsApp      | Corte (desconexión)   |
|---------------------|---------------------------|----------------------------|------------------------|
| **Omac** (omac569.com)   | Primeros 5 días del mes   | Mensaje automático (día 1 y opcional día 4) | 5 a las **23:59** → pause hasta pago |
| **JCavalier**           | Primeros 5 días del mes   | Igual que Omac             | 5 a las **23:59** → pause hasta pago |
| **Maracay deportiva**   | Día **22** de cada mes   | Mensaje automático (ej. día 21) | 22 a las **23:59** → pause hasta pago |

- El mensaje de WhatsApp debe ser **automático** y replicar el flujo que ya tienes en **Omac** (Baileys o el método que uses allí).
- A las **23:59** del día límite, si no hay pago registrado → **desconexión**: el sitio/servicio queda pausado hasta que se registre el pago y se reactive.

---

## 2. ¿Es posible con lo que tenemos?

**Sí.** Con lo que tienes se puede montar un **sistema de control de suscripciones** que:

1. **Guarde** por cliente: proyecto (Vercel/Koyeb), día de vencimiento, teléfono WhatsApp, estado (activo/suspendido), última fecha de pago.
2. **Ejecute un cron** (diario o en horarios concretos) que:
   - Envíe recordatorio por WhatsApp cuando toque (días 1 y 4 para Omac/JCavalier; día 21 para Maracay).
   - El **día del corte a las 23:59** (5 o 22), si no hay pago → llame a la API de **Vercel** (o Koyeb) para **pausar** el proyecto/servicio.
3. **Al recibir el pago** (manual o futuro webhook): marcar como pagado y llamar a la API para **reanudar** el proyecto.

**Vercel:** tiene API para **pausar** y **reanudar** un proyecto (`POST .../pause`, `POST .../unpause`). Si Omac y JCavalier (y Maracay) están en Vercel, la “desconexión” es **pausar el proyecto**; el dominio deja de servir hasta que se reanude.

**Koyeb:** si algún proyecto corre en Koyeb (API, backend), se puede **pausar el servicio** o **escalar a 0** por API/CLI (consultar la referencia de Koyeb para el endpoint exacto). Lo mismo aplica para “reconectar”.

**Git:** por sí solo no desconecta un sitio. La desconexión se hace con la **API del proveedor** (Vercel/Koyeb). Git sirve para versionar el **script/código** que hace las llamadas (por ejemplo un script en el repo APlat que se ejecuta por cron).

**WhatsApp:** en Omac ya usas **Baileys** (o similar) para enviar mensajes. La idea es **reutilizar esa lógica** en un único “servicio de notificaciones APlat”: un proceso (puede vivir en la API de APlat en Koyeb o en un worker aparte) que tenga **un número de WhatsApp** y envíe los recordatorios de pago. No hace falta un bot por cliente; un solo bot/envío centralizado que mande a los 3 contactos según el calendario.

---

## 3. Método paso a paso (arquitectura)

### 3.1 Dónde vive la “verdad” de las suscripciones

- **Base de datos o archivo de configuración** con algo así por cliente:

  - `id`, `name` (ej. Omac, JCavalier, Maracay deportiva)
  - `provider`: `"vercel"` | `"koyeb"`
  - `projectId` (Vercel project id o nombre) o `serviceId` (Koyeb)
  - `dueDay`: `5` o `22`
  - `whatsappNumber`: número al que enviar recordatorio
  - `status`: `"active"` | `"suspended"`
  - `lastPaymentAt`: fecha del último pago registrado (para saber si ya pagó este mes)

- Puede ser:
  - **SQLite** en la API de APlat (Koyeb), con una tabla `subscriptions` o `billing_clients`, o
  - Un **JSON** en el repo (por ejemplo `apps/api/data/subscriptions.json`) que el script lea, si prefieres no tocar la API todavía.

### 3.2 Quién ejecuta la lógica (cron)

Tienes varias opciones; con lo que tienes, las más razonables son:

- **Opción A – Cron en la API de APlat (Koyeb)**  
  La API de APlat (Fastify en Koyeb) expone además un **cron interno** (o un endpoint protegido que solo llama un cron externo): cada día a las 00:05 (o 01:00) corre una función que:
  - Lee la fecha actual y la lista de clientes con sus `dueDay`.
  - **Si hoy es día de recordatorio** (1 o 4 para dueDay 5; 21 para dueDay 22) → envía WhatsApp.
  - **Si hoy es día de corte** (5 o 22) y son las 23:59 (o a las 00:00 del día siguiente, comprobando “el día anterior era 5 o 22 y no hay pago”) → llama a Vercel/Koyeb para pausar.

  Para “a las 23:59” exacto, en la práctica suele ejecutarse un **único job diario** (p. ej. 00:00 UTC) que mira “si ayer era día 5 o 22 y el cliente no tiene pago registrado en ese mes → pausar”.

- **Opción B – GitHub Actions (cron)**  
  Un workflow que corre **daily** (o dos veces al día), que:
  - Lee el JSON (o llama a la API de APlat) para saber qué clientes tocan hoy.
  - Envía recordatorio (llamando a un endpoint de la API de APlat que tenga Baileys/WhatsApp).
  - Si es día de corte y no hay pago → el mismo workflow llama a **Vercel API** (y si aplica Koyeb) con tokens guardados en GitHub Secrets. Aquí el “cerebro” puede ser la API (que devuelve “quién suspender”) y el Action solo ejecuta pause/unpause.

- **Opción C – Script local + cron del sistema (o tú lo ejecutas)**  
  Un script en el repo (p. ej. `scripts/billing-cron.mjs`) que:
  - Lee la configuración de suscripciones.
  - Compara fecha y reglas.
  - Envía WhatsApp (vía API de APlat que tenga el envío) y/o llama a Vercel/Koyeb por API.
  - Lo ejecutas tú con **CLI** cuando quieras (`node scripts/billing-cron.mjs`) o lo programás con **cron** en un servidor (o en tu máquina si está encendida a las 00:00).

En todos los casos el **método** es el mismo: un único proceso que, en una fecha/hora determinada, **decide** “enviar recordatorio” o “pausar proyecto” y ejecuta esa acción vía **API de WhatsApp** (Omac/APlat) y **API de Vercel/Koyeb**.

### 3.3 Flujo del recordatorio WhatsApp (replicar Omac)

- En **Omac** ya tienes el envío de mensajes (Baileys). Para no duplicar mantenimiento, lo ideal es:
  - **Centralizar el envío** en un solo lugar: por ejemplo un **servicio dentro de la API de APlat** (o un microservicio en Koyeb) que use la misma librería (Baileys) y **un número de WhatsApp dedicado a APlat** (no el de Omac), para no mezclar conversaciones.
  - Ese servicio expone algo como `POST /api/internal/send-whatsapp` (protegido con API key o JWT) con `{ to: "58...", message: "..." }`.
  - El **cron** (API, GitHub Action o script) solo decide el texto del mensaje y llama a ese endpoint.

- **Texto del mensaje:** puedes tomar el mismo criterio que en Omac (recordatorio de pago, vencimiento día 5 o 22). Ejemplo: *“APlat: Recordatorio – Su mensualidad vence el día 5. Por favor realizar el pago para mantener el servicio activo.”*

### 3.4 Flujo de “desconexión” (pause) y “reconexión” (unpause)

- **Vercel**
  - Pausar: `POST https://api.vercel.com/v9/projects/{projectIdOrName}/pause` (con `Authorization: Bearer VERCEL_TOKEN`). Si el proyecto es de un team, se suele pasar `?teamId=...`.
  - Reanudar: `POST .../unpause` (o el endpoint que documente Vercel para “resume”).
  - Efecto: el proyecto deja de servir tráfico hasta que se reanude.

- **Koyeb**
  - Consultar la [referencia de la API Koyeb](https://www.koyeb.com/docs/reference/api) para **pause service** o **scale to 0** (o stop/start). El script/cron llamaría a ese endpoint con el `service_id` de cada cliente que esté en Koyeb.
  - Reconexión: endpoint inverso (resume / scale to 1).

- **Quién llama:** el mismo proceso que corre el cron (API de APlat, GitHub Action o script con `VERCEL_TOKEN` y `KOYEB_TOKEN` en env). No hace falta “botón” en la UI para el corte automático: el **cron** es el que ejecuta la desconexión a las 23:59 (o 00:00 del día siguiente). Opcionalmente puedes tener un **botón en un panel admin de APlat** que llame a `POST /api/admin/subscriptions/:id/pause` o `unpause` para hacerlo manual.

### 3.5 Control vía CLI (Vercel, Koyeb, Git)

- **Vercel CLI:** `vercel project ls`, y para pausar/reanudar normalmente se usa la **API** (no el CLI estándar). Puedes hacer un script que use `curl` o `fetch` con `VERCEL_TOKEN` y que tú ejecutes cuando quieras: `node scripts/billing-pause.mjs --project=omac`.
- **Koyeb CLI:** si existe `koyeb service pause / resume`, el mismo script podría llamar al CLI en vez de la API. Lo importante es que el **cron** (o tú a mano) ejecute esa acción; da igual si es por API o por CLI desde un script.
- **Git:** no “desconecta” el sitio. Git sirve para guardar el código del script, la config de suscripciones (JSON o migraciones) y el flujo de cron (p. ej. en `.github/workflows/billing-cron.yml`). El control real es **Vercel/Koyeb API (o CLI)**.

Resumen: **sí puedes controlar todo desde “APlat”** en el sentido de: (1) un solo lugar donde se definen vencimientos y reglas, (2) un cron (en API, GitHub Actions o script) que envía WhatsApp y ejecuta pause/unpause vía Vercel/Koyeb. La “consola” puede ser un panel en APlat (futuro) o, de momento, **script + CLI/API** que tú ejecutes o que corra por cron.

---

## 4. Orden sugerido de implementación

1. **Config de suscripciones**  
   Definir en JSON o en BD (API APlat) los 3 clientes con: `dueDay` (5 o 22), `provider` + `projectId`/`serviceId`, `whatsappNumber`, `status`, `lastPaymentAt`.

2. **WhatsApp centralizado**  
   En la API de APlat (o en un worker en Koyeb) montar el envío por WhatsApp (replicar lógica de Omac con Baileys y un número para APlat). Endpoint interno `POST /api/internal/send-whatsapp`.

3. **Lógica de fechas**  
   Función que, dada la fecha actual y la config, devuelva: “hoy toca recordatorio para [Omac, JCavalier]” o “hoy toca recordatorio para [Maracay]” o “hoy toca corte para [Omac, JCavalier]” (día 5) o “hoy toca corte para [Maracay]” (día 22).

4. **Cron (primera versión)**  
   Un job que cada día (00:00 o 01:00):
   - Si toca recordatorio → llama al envío WhatsApp para los clientes que correspondan.
   - Si “ayer” era día 5 o 22 y el cliente no tiene `lastPaymentAt` en ese mes → llamar a Vercel (y Koyeb si aplica) para **pause**.

5. **Reconexión**  
   Cuando registres el pago (manual en BD o futuro webhook): actualizar `lastPaymentAt` y `status` y llamar a **unpause** en Vercel/Koyeb.

6. **CLI / script manual**  
   Scripts como `billing-cron.mjs` (o `billing-pause.mjs` / `billing-unpause.mjs`) que usen la misma lógica y que puedas ejecutar con `node scripts/...` o desde GitHub Actions con `VERCEL_TOKEN` y `KOYEB_TOKEN` en secrets.

Con esto tienes el **método** claro: un solo flujo de datos (suscripciones), un solo cron que aplica reglas por fecha y que actúa vía WhatsApp (replicando Omac) y vía API Vercel/Koyeb para desconectar/reconectar. Si quieres, el siguiente paso puede ser bajar esto a **diseño técnico** (tabla de BD, nombres de endpoints y formato del JSON de suscripciones) o a un **script mínimo** que solo haga “pause/unpause por proyecto” para probar con un cliente.