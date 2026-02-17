# GURU

Plataforma integrada de ciberseguridad y gestión con autenticación avanzada (Passkey), WhatsApp, dashboard y análisis.

## ✨ Características

- 🔐 **Autenticación multi-factor**: Email/password + Passkey (WebAuthn)
- 📊 **Dashboard**: Métricas, conexiones, visitas, suscripciones
- 📬 **WhatsApp**: Integración con Baileys para notificaciones y gestión
- 👥 **Gestión de clientes**: Perfiles, suscripciones, pagos
- 📈 **Analytics**: Registro de visitas (público) y conexiones (autenticado)
- 🔒 **Seguridad completa**: Rate limiting, Helmet, validación, sanitización, auditoría

## 🔒 Seguridad

GURU implementa múltiples capas de seguridad:

- **Rate limiting**: 100 req/min (protección DDoS y fuerza bruta)
- **Headers**: Helmet con CSP, HSTS, X-Frame-Options
- **Validación**: Email, contraseña, longitud de campos
- **Sanitización**: Eliminación de caracteres peligrosos
- **Hashing**: scrypt con salt aleatorio
- **Auditoría**: Registro completo en `guru-audit.db`
- **JWT**: HS256 con secret fuerte
- **Persistencia**: Guardado periódico + al salir + escritura atómica
