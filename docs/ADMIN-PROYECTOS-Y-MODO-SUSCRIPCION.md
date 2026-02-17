# Admin: todos los proyectos desplegados + botón Modo suscripción

Objetivo: tener **todos los proyectos desplegados** listados como en GURU, con un **botón por proyecto que active el modo suscripción** y permita cargar los datos de pago. Los que no tengan modo suscripción quedan “normales”. Si mañana despliegas algo nuevo, que **pase a ser administrable en cuanto entre en la lista** (por sync desde Vercel o por alta manual).

---

## 1. Idea general

- **Una sola lista** = todos los proyectos en producción, la misma que alimenta el portafolio de GURU (misma fuente de verdad).
- **Cada proyecto** en esa lista se muestra en un **panel de administración** con:
  - Nombre, slug, URL de producción.
  - **Toggle “Modo suscripción”**: ON = se pueden configurar datos de pago y aplicar lógica de recordatorio/corte; OFF = solo listado, sin cobro ni pause.
- **Proyectos nuevos**: en cuanto un proyecto **entra en esa lista** (por sync con Vercel o porque lo añades a mano), aparece en el admin con “Modo suscripción” en OFF. Ahí puedes activarlo y cargar datos de pago cuando quieras.

Así, “estar todos los proyectos desplegados” y “que lo nuevo sea administrable” se resuelve con **una única lista de proyectos en producción** que usa tanto el portafolio como el admin.

---

## 2. Fuente de la lista: la misma que GURU

Hoy la lista de “qué está en producción” viene de:

- **`apps/web/data/portfolio-production-urls.json`**: slug → URL de producción.
- Se puede **actualizar con** `pnpm run sync:vercel` (sincroniza desde Vercel y mantiene/amplía el JSON).

Por tanto:

- **Lista de proyectos desplegados** = lo que hay en ese JSON (o lo que devuelva una API que lo lea y, si quieres, enriquezca con datos de Vercel).
- **Mañana despliegas algo nuevo** → lo añades a Vercel y ejecutas `pnpm run sync:vercel` (o lo añades a mano al JSON) → el nuevo proyecto **entra en la lista** → en el admin aparece con Modo suscripción OFF y ya es administrable (solo falta activar el toggle y cargar datos si quieres cobro).

No hace falta una “lista de admin” distinta: la lista es la de “proyectos en producción” que ya usa GURU. El admin solo añade **por proyecto** el estado “modo suscripción” y los datos de pago.

---

## 3. Por proyecto: normal vs modo suscripción

| Estado              | Qué se muestra / qué hace |
|---------------------|----------------------------|
| **Modo suscripción OFF** | Proyecto “normal”: solo aparece en el listado con nombre y URL. No se envían recordatorios ni se hace pause. |
| **Modo suscripción ON**  | Se muestran campos de **datos de pago** y se usa la lógica de suscripción (recordatorio WhatsApp, corte a las 23:59, pause en Vercel/Koyeb). |

Datos que tendría cada proyecto cuando **Modo suscripción** está ON (mismo criterio que en `METODO-CONTROL-SUSCRIPCIONES-APLAT.md`):

- Día de vencimiento (ej. 5 o 22).
- Teléfono para recordatorio WhatsApp.
- Proveedor (Vercel / Koyeb) e identificador del proyecto/servicio (para pause/unpause).
- Estado (activo / suspendido).
- Última fecha de pago registrada (opcional, para mostrar “al día” o “pendiente”).

Los que **no** tengan modo suscripción no necesitan esos campos; solo nombre y URL.

---

## 4. Dónde guardar “modo suscripción” y datos de pago

Opciones coherentes con lo que tienes:

- **Opción A – En la API de GURU (Koyeb)**  
  Una tabla (ej. `projects` o `deployments`) con: `slug`, `production_url`, `subscription_enabled` (boolean), y si está en true: `due_day`, `whatsapp_number`, `provider`, `project_id` (Vercel) o `service_id` (Koyeb), `status`, `last_payment_at`.  
  La lista de “qué proyectos existen” puede seguir viniendo del JSON (o de un endpoint que lea Vercel); el backend guarda solo el **estado de suscripción y datos de pago** por slug.

- **Opción B – JSON en repo**  
  Un archivo tipo `apps/web/data/subscription-settings.json` (o en `apps/api/data/`) donde por slug guardes si tiene modo suscripción y los datos. La lista de slugs sigue siendo la de `portfolio-production-urls.json`.  
  Ventaja: todo en repo y fácil de versionar. Desventaja: para cambiar “modo suscripción” o datos hay que editar y hacer commit (o un panel que edite ese JSON vía API y lo persista en disco/BD).

- **Opción C – Híbrido**  
  Lista de proyectos = `portfolio-production-urls.json` (o sync Vercel). Estado “modo suscripción” y datos de pago = API GURU (tabla en SQLite o similar). El panel de admin llama a la API para leer/escribir ese estado; la lista de “todos los desplegados” se construye leyendo el JSON (o un endpoint que devuelva eso).

Recomendación para escalar y no tocar Git cada vez que activas suscripción: **Opción A o C** (API guarda suscripción), lista de proyectos = misma que el portafolio (JSON + sync Vercel).

---

## 5. Flujo “mañana despliego algo nuevo”

1. Despliegas un proyecto nuevo en Vercel (o Koyeb) y, si aplica, lo añades al repo (o solo a Vercel).
2. Ejecutas **`pnpm run sync:vercel`** (o añades a mano una entrada en `portfolio-production-urls.json` con slug y URL).
3. Esa lista es la que usa el **portafolio** de GURU y la que debe usar el **admin**.
4. En el admin, el nuevo proyecto **aparece ya** en la tabla/listado con “Modo suscripción” en OFF (normal).
5. Si quieres cobrar por ese proyecto, activas el **botón “Modo suscripción”** y rellenás datos de pago (día, WhatsApp, provider/id). A partir de ahí corre la lógica de recordatorio y corte como en el método ya documentado.

Así, “que automáticamente pase a ser administrable” se cumple: **en cuanto el proyecto está en la lista de desplegados** (por sync o manual), aparece en el admin; el “automático” es que no hace falta crear a mano el proyecto en otro sitio, solo entra en la misma lista que ya alimenta GURU.

---

## 6. Resumen de pantalla de admin (propuesta)

- **Título**: “Proyectos desplegados” (o “Admin – Proyectos”).
- **Origen de la lista**: misma fuente que el portafolio (`portfolio-production-urls.json` + lo que añada `sync:vercel`).
- **Por cada proyecto** (fila o tarjeta):
  - Nombre/slug.
  - URL de producción (enlace).
  - **Switch “Modo suscripción”**: OFF = normal; ON = se muestran campos de pago y se aplica lógica de cobro/pause.
- Si **Modo suscripción** está ON:
  - Día de vencimiento, WhatsApp, proveedor (Vercel/Koyeb), id del proyecto/servicio, estado, última fecha de pago.
  - Botones opcionales: “Pausar ahora” / “Reanudar” (para pruebas o manual).
- **Proyectos nuevos**: no hay pantalla aparte; al actualizar la lista (sync o edición del JSON), el nuevo proyecto aparece en esta misma vista con el switch en OFF.

Con esto quedan cubiertos: (1) todos los proyectos desplegados como en GURU, (2) botón que activa modo suscripción y datos de pago, (3) los que no lo tengan = normales, (4) lo que despliegues mañana pasa a ser administrable en cuanto entre en esa lista.

Si quieres, el siguiente paso puede ser bajar esto a **rutas y componentes** concretos (ej. `/admin/proyectos`, tabla y formulario) o al **esquema de la API** (endpoints para listar proyectos, activar/desactivar modo suscripción y guardar datos de pago).
