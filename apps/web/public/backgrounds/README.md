# Imágenes de fondo (última generación / futuristas)

Las secciones Hero, Servicios y Cómo funciona usan **imágenes de fondo sutiles** cuando existen en esta carpeta. Si no hay archivos, se muestra solo la textura SVG y los orbes (el sitio se ve bien igual).

## Archivos opcionales

| Archivo           | Uso                          | Sección(es)        |
|------------------|------------------------------|--------------------|
| `hero-bg.jpg`    | Fondo del Hero (pantalla principal) | Hero               |
| `section-bg.jpg`| Fondo de Servicios y Cómo funciona   | Servicios, Cómo funciona |

## Recomendaciones

- **Formato:** JPG o WebP (buen equilibrio tamaño/calidad).
- **Resolución:** 1920×1080 o superior; se usa `background-size: cover`.
- **Estilo:** Oscuro, tech, futurista (circuitos, redes, datos, espacio, líneas de luz). Evitar imágenes muy claras o con mucho detalle que compitan con el texto.
- **Peso:** Comprimir para web (< 300 KB por imagen si es posible).

Al añadir `hero-bg.jpg` y/o `section-bg.jpg`, se mostrarán con **opacidad muy baja** (≈5 %) para que la interfaz siga siendo legible y de aspecto “última generación”.
