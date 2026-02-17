# Configuración del Captive Portal con CUDY AP1200

Guía para redirigir el captive portal del CUDY AP1200 a GURU Presence.

## Requisitos

- Punto de acceso CUDY AP1200
- Sitio GURU desplegado (ej. guru.vercel.app)
- `site_id` del sitio (obtener desde Dashboard → Presence → Admin)

## Pasos

### 1. Acceder a la interfaz del AP

1. Conéctese al WiFi del CUDY AP1200 (SSID por defecto en la etiqueta).
2. Abra el navegador y vaya a **http://cudyap.net** (o la IP indicada).
3. Inicie sesión con la contraseña configurada.

### 2. Habilitar Captive Portal

1. Vaya a **General Settings** (o Ajustes generales).
2. Active **Captive Portal**.
3. Guarde los cambios.

### 3. Configurar la URL de redirección

1. Vaya a **Wireless** (Inalámbrico).
2. Busque la opción de **Captive Portal** o **Portal personalizado**.
3. Si hay campo "URL externa" o "Custom portal URL", ingrese:

```
https://tu-dominio.com/portal?site_id=UUID_DEL_SITIO
```

Reemplace:
- `tu-dominio.com` por su dominio (ej. guru.vercel.app)
- `UUID_DEL_SITIO` por el ID del sitio (desde el dashboard)

### 4. Obtener el site_id

1. Inicie sesión en GURU como administrador.
2. Vaya a **Dashboard → Presence**.
3. El `site_id` aparece en la URL al seleccionar un sitio, o puede obtenerlo desde la API:
   - `GET /api/presence/admin/sites` (con token de master)
   - El campo `id` de cada sitio es el `site_id`.

### 5. Ejemplo de URL completa

```
https://guru.vercel.app/portal?site_id=1c71afa2-9839-4a50-a88c-d30aa147d616
```

### 6. Si no hay opción de URL externa

Algunos modelos de CUDY tienen un portal interno. En ese caso:

1. Use el portal integrado para mostrar un mensaje de bienvenida.
2. Incluya un enlace manual a `https://tu-dominio.com/portal?site_id=XXX`.
3. Los visitantes pueden hacer clic en el enlace para completar el check-in.

## Verificación

1. Conecte un dispositivo al WiFi del AP.
2. Debería redirigirse automáticamente a la página `/portal`.
3. Complete el formulario (nombre, documento, a quién visita).
4. Tras enviar, el check-in se registra y el visitante puede navegar.

## Soporte

- Documentación CUDY: https://docs.cudy.com
- Modelos con captive portal: WR1300, WR3000, AP1200 (verificar en el panel del modelo específico).
