# Seguridad y Auditoría de APlat API

## Resumen Ejecutivo

APlat API implementa múltiples capas de seguridad para proteger contra vulnerabilidades comunes y garantizar que **todos los datos se guarden permanentemente** con un registro completo de auditoría.

## 1. Autenticación y Autorización

### JWT (JSON Web Tokens)
- **Algoritmo**: HS256
- **Secret**: `APLAT_JWT_SECRET` (obligatorio en producción)
- **Expiración**: 7 días
- **Validación**: En cada ruta protegida con `requireAuth()` o `requireRole()`

### Roles
- **master**: Administrador (email/contraseña en variables de entorno)
- **client**: Cliente registrado (email/contraseña hasheado en DB)

### Auditoría de Autenticación
- **LOGIN**: Cada login exitoso se registra con IP, timestamp y rol
- **LOGIN_FAIL**: Intentos fallidos con razón (credenciales inválidas, email inválido, etc.)
- **Registro de conexiones**: En memoria (últimas 200) y en auditoría permanente

## 2. Rate Limiting y Protección DDoS

### @fastify/rate-limit
```typescript
max: 100 requests por minuto
ban: 5 superaciones → ban temporal
```

- Evita abuso de endpoints públicos
- Por IP (usando X-Forwarded-For si está detrás de proxy)

### Lockout por fallos de login (anti fuerza bruta)
- **5 intentos fallidos** desde la misma IP → **bloqueo 15 minutos** (429)
- Solo se cuentan fallos (credenciales inválidas); los intentos correctos no consumen cupo
- Tras login exitoso se limpia el contador para esa IP

## 3. Validación de Entrada y Sanitización

### Validación
- **Email**: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Contraseña**: Mínimo 8 caracteres
- **Teléfono**: Normalización (solo dígitos)
- **Longitud**: Limits en campos de texto (ej. referrer: 500 chars)

### Sanitización
- Elimina null bytes, caracteres de control y `<>'"&\\` para prevenir XSS e inyección
- Límite de longitud por campo (`maxLength`) para evitar overflow y DoS
- Se aplica en email, nombres, mensajes, path y referrer

### Límites de entrada (anti DoS y overflow)
| Campo      | Máximo |
|-----------|--------|
| Email     | 254    |
| Contraseña (login) | 256 |
| Nombre    | 200    |
| Mensaje (contacto) | 5000 |
| Path (visitas) | 500 |
| Referrer  | 500    |

### Body limit
- **512 KB** máximo por request body (Fastify `bodyLimit`) para evitar payloads enormes

## 4. Headers de Seguridad (Helmet)

### @fastify/helmet
```typescript
Content-Security-Policy:
  - defaultSrc: ['self']
  - styleSrc: ['self', 'unsafe-inline']
  - scriptSrc: ['self']
  - imgSrc: ['self', 'data:', 'https:']

HSTS:
  - maxAge: 31536000 (1 año)
  - includeSubDomains: true
  - preload: true

Otros:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-Permitted-Cross-Domain-Policies: none
  - Referrer-Policy: strict-origin-when-cross-origin
```

### 404 en producción
- Las respuestas 404 no incluyen la URL solicitada en producción para no exponer rutas internas

## 5. Hashing de Contraseñas

### Algoritmo: scrypt
```typescript
SALT_LEN: 16 bytes (randomBytes)
KEY_LEN: 64 bytes
Formato: salt:hash (ambos en base64)
```

- **Seguridad**: Resistente a ataques rainbow table y GPU
- **Verificación**: Usando `timingSafeEqual` para prevenir timing attacks

## 6. Persistencia de Datos

### SQLite con sql.js
- **Ruta**: `APLAT_DATA_PATH` (debe ser volumen persistente en producción)
- **Guardado periódico**: Cada 20 segundos
- **Guardado al salir**: beforeExit, SIGINT, SIGTERM
- **Escritura atómica**: temp file + rename para evitar corrupción

### Todas las operaciones usan `dbRun()` que persiste automáticamente
- `createClient()` → INSERT client + audit
- `updateClientProfile()` → UPSERT profile + audit
- `updateClientPassword()` → UPDATE password + audit
- `addServiceSubscription()` → INSERT subscription + audit
- `markSubscriptionPaid()` → UPDATE subscription + audit
- `updateSubscription()` → UPDATE subscription + audit
- `deleteSubscription()` → DELETE subscription + audit

### WebAuthn (Passkey)
- Persistencia en JSON (`APLAT_WEBAUTHN_STORE_PATH`)
- `addCredential()` → writeFile + audit
- `updateCredentialLastUsed()` → writeFile + audit

## 7. Auditoría Completa

### Base de datos de auditoría: `aplat-audit.db`
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAIL, VERIFY, PROCESS
  entity TEXT NOT NULL,  -- client, profile, subscription, credential, auth
  entity_id TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  ip TEXT NOT NULL,
  details TEXT NOT NULL  -- JSON con datos adicionales
);
```

### Eventos auditados

| Acción | Entidad | Cuándo | Detalles |
|--------|---------|--------|----------|
| CREATE | client | Registro de usuario | email, mustChangePassword |
| UPDATE | client | Cambio de contraseña | field: "password" |
| UPDATE | profile | Actualización de perfil | campos modificados |
| CREATE | subscription | Nueva suscripción | phone, serviceName, dayOfMonth, amount |
| UPDATE | subscription | Marcar pago o editar | action: "mark_paid", cutoffDate o campos |
| DELETE | subscription | Eliminar suscripción | phone, serviceName |
| CREATE | credential | Registrar Passkey | deviceName |
| UPDATE | credential | Uso de Passkey | action: "used", counter |
| LOGIN | auth | Login exitoso | role |
| LOGIN_FAIL | auth | Login fallido | reason |

### Consulta de logs
```bash
GET /api/admin/audit-logs?entity=subscription&entity_id=abc123&limit=100
```

### Características
- **Persistencia**: Mismo mecanismo que datos principales (guardado periódico + al salir + atómico)
- **Retención**: Indefinida (se puede agregar política de limpieza)
- **Índices**: timestamp, entity+entity_id, user_id para consultas rápidas

## 8. Protección de Secrets

### Variables de entorno sensibles
- `APLAT_JWT_SECRET`: Generar con `openssl rand -hex 32`
- `APLAT_ADMIN_PASSWORD`: Contraseña fuerte (mínimo 12 caracteres, mayúsculas, números, símbolos)
- `APLAT_CRON_SECRET`: Para ejecutar cortes automáticos

### Nunca en código
- No hay secrets hardcodeados
- Valores por defecto solo para desarrollo local

## 9. CORS y Preflight

### Configuración
```typescript
origin: process.env.CORS_ORIGIN ?? true
methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
credentials: true
```

### Handler OPTIONS
- Responde 204 a todas las peticiones OPTIONS
- Evita 404 en preflight

## 10. Protección contra Inyección

### SQL Injection
- **Mitigación**: Uso exclusivo de prepared statements (sql.js con parámetros `?`)
- **NUNCA** se concatenan strings en queries

### XSS (Cross-Site Scripting)
- **Sanitización**: `sanitizeString()` en inputs de usuario
- **CSP**: Content-Security-Policy restringe scripts inline

### CSRF (Cross-Site Request Forgery)
- **Tokens JWT**: Deben enviarse en header `Authorization`
- **CORS**: Restricción de origen

## 11. Pruebas de Seguridad

### Persistencia
```bash
cd apps/api && pnpm test:persist
```
Verifica que datos sobreviven a reinicio del proceso.

### Rate Limiting
```bash
for i in {1..150}; do curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'; done
```
Debe retornar 429 (Too Many Requests) después de 100 requests.

### Headers de Seguridad
```bash
curl -I http://localhost:3001/api/health
```
Debe incluir: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`.

### Auditoría
```bash
# Crear cliente, perfil, suscripción
# Luego ver logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/audit-logs?limit=50
```

## 12. Lista de Verificación para Producción

- [ ] `APLAT_JWT_SECRET` configurado (32+ caracteres aleatorios)
- [ ] `APLAT_ADMIN_PASSWORD` fuerte (12+ caracteres, complejidad)
- [ ] `APLAT_CRON_SECRET` configurado si se usan cortes automáticos
- [ ] `CORS_ORIGIN` apunta al dominio del frontend (sin barra final)
- [ ] `APLAT_DATA_PATH` apunta a volumen persistente (ej. `/data` en Koyeb)
- [ ] `APLAT_WEBAUTHN_RP_ID` es el hostname del frontend (sin protocolo)
- [ ] Rate limiting habilitado (default: 100/min)
- [ ] Helmet habilitado (headers de seguridad)
- [ ] Auditoría inicializada (`initAuditDb()`)
- [ ] Logs de aplicación configurados (Fastify logger)
- [ ] Monitoreo de espacio en disco (volumen persistente)
- [ ] Backups periódicos de `aplat.db` y `aplat-audit.db`

## 13. Monitoreo y Alertas

### Métricas clave
- Tasa de login fallidos (> 10/min → posible ataque)
- Uso de rate limit (bans frecuentes → revisar configuración)
- Tamaño de base de datos (crecimiento anormal)
- Logs de auditoría (accesos no autorizados)

### Endpoints de monitoreo
- `GET /api/health` → Salud del servicio
- `GET /api/dashboard/connections` → Últimas conexiones (requiere auth)
- `GET /api/admin/audit-logs` → Logs de auditoría (requiere master)

## 14. Frontend (Next.js) – Headers de seguridad

- **X-Frame-Options**: SAMEORIGIN (evita clickjacking)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: camera, microphone, geolocation, payment, usb, interest-cohort deshabilitados
- **Content-Security-Policy**: default-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests
- **X-Permitted-Cross-Domain-Policies**: none

El token JWT se guarda en `localStorage`; en entornos de máximo riesgo considerar migrar a httpOnly cookie (requiere cambios en API y front).

## 15. Actualizaciones y Mantenimiento

### Dependencias
```bash
cd apps/api
pnpm update
pnpm audit
```

### Parches de seguridad
- Fastify: `pnpm update fastify @fastify/cors @fastify/helmet @fastify/rate-limit`
- jose (JWT): `pnpm update jose`
- sql.js: `pnpm update sql.js`

### Política de versiones
- Revisar dependencias mensualmente
- Aplicar parches críticos inmediatamente
- Probar en desarrollo antes de producción

## 16. Respuesta a Incidentes

### En caso de compromiso
1. **Rotación de secrets**: Cambiar `APLAT_JWT_SECRET`, `APLAT_ADMIN_PASSWORD`, `APLAT_CRON_SECRET`
2. **Revisar logs de auditoría**: Identificar accesos no autorizados
3. **Revocar tokens**: Tokens actuales quedan inválidos con nuevo secret
4. **Notificar usuarios**: Si hubo acceso a datos de clientes
5. **Backup y forense**: Respaldar DB para análisis

### Contactos
- Responsable de seguridad: [DEFINIR]
- Infraestructura: [DEFINIR]

## Resumen de Implementación

✅ **Rate limiting**: 100 req/min, ban tras 5 superaciones  
✅ **Lockout login**: 5 fallos → bloqueo 15 min por IP  
✅ **Body limit**: 512 KB por request  
✅ **Headers de seguridad**: Helmet con CSP, HSTS, X-Frame-Options DENY, X-Permitted-Cross-Domain-Policies  
✅ **Validación**: Email, contraseña, longitudes máximas por campo  
✅ **Sanitización**: Null bytes, control chars, caracteres peligrosos; límite de longitud  
✅ **Hashing**: scrypt con salt aleatorio, timingSafeEqual  
✅ **404 en producción**: Sin exponer URL en la respuesta  
✅ **Persistencia**: Guardado periódico, al salir, atómico  
✅ **Frontend**: CSP, frame-ancestors 'none', upgrade-insecure-requests, Permissions-Policy  
✅ **Auditoría**: Registro completo en `aplat-audit.db`  
✅ **JWT**: HS256 con secret fuerte  
✅ **CORS**: Origen restringido  
✅ **Secrets**: Solo en variables de entorno  

**Resultado**: Sistema robusto con múltiples capas de seguridad y auditoría completa de TODOS los cambios.
