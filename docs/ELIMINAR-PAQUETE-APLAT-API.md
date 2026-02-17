# Eliminar paquete aplat-api de GitHub Packages

Para dejar solo **guru-api** y eliminar el paquete legacy **aplat-api**:

## Pasos

1. Ve a **GitHub** → tu perfil o organización → **Packages**
   - Perfil: https://github.com/aurelio104?tab=packages
   - O desde el repo: GitHub → **Packages** (columna derecha)

2. Haz clic en **aplat-api**

3. En el menú de la derecha: **Package settings**

4. Desplázate hasta **Danger Zone**

5. Haz clic en **Delete this package**

6. Escribe el nombre del paquete para confirmar: `aplat-api`

7. Confirma la eliminación

---

## Estado actual

- **guru-api** — Se publica automáticamente con cada push a `main` (workflow `.github/workflows/docker-api.yml`)
- **aplat-api** — Legacy; eliminar manualmente siguiendo los pasos anteriores
