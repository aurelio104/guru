# Logos del portafolio

Logos recopilados desde las carpetas `public` de cada proyecto (Work/Albatros y Work/Aurelio) para mostrarlos en la sección Portafolio del sitio APlat.

## Mapeo archivo → proyecto

| Archivo | Proyecto | Origen |
|---------|----------|--------|
| `plataforma-albatros.png` | Plataforma Albatros | Albatros/Plataforma/public/logo.png |
| `control-acceso-albatros.png` | Control de acceso | Albatros/Control de Acceso/frontend/public/logoCA.png |
| `Omac.png`, `Omac.svg` | Omac | Albatros/Omac/apps/web/public/ |
| `albatros-presentacion.png` | Albatros Presentación | Albatros/Presentacion albatros /public/images/logoB.png |
| `cia.png` | CIA (sitio institucional) | Albatros/CIA/public/assets/logo.png |
| `ciber.png` | Ciber (monitoreo P-CS) | Albatros/Ciber/client/public/logotB.png |
| `rt-reportes.png` | RT Reportes | Aurelio/RT/frontend/public/logo.png |
| `JCavalier.png` | JCavalier | Aurelio/Jcavalier/frontend/public/LogoB.png |
| `maracay-deportiva.png` | Maracay Deportiva | Aurelio/maracay-deportiva/frontend/public/LogoB.png |
| `MundoIAanime.png` | MundoIAanime | Aurelio/Mundoiaanime/.../frontend/public/logo.png |
| `BotArbi.png`, `BotArbi.svg` | BotArbi | Aurelio/BotArbi/public/icon.png, icon.svg |

El componente `Portfolio.tsx` busca `/portafolio/{slug}.png` (y opcionalmente `.svg`). Los slugs coinciden con los de la lista de repos (ej. `rt-reportes`, `JCavalier`, `Omac`).

Proyectos sin logo en esta carpeta muestran la inicial del nombre como fallback.
