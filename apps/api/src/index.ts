import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  initStoreDb,
  getClientByEmail,
  createClient,
  getClientById,
  updateClientProfile,
  setPhoneVerified,
  setMustChangePassword,
  updateClientPassword,
  setPhoneCode,
  consumePhoneCode,
  addServiceSubscription,
  getSubscriptionsByPhone,
  getSubscriptionById,
  getNextCutoffDate,
  getLastMissedCutoffDate,
  processCutoffs,
  markSubscriptionPaid,
  getAllSubscriptions,
  normalizePhone,
  updateSubscription,
  deleteSubscription,
  getClientByPhone,
} from "./clients-store.js";
import {
  getCredentialByCredentialId,
  getCredentialsByUserId,
  addCredential,
  setChallenge,
  getAndConsumeChallenge,
  updateCredentialLastUsed,
} from "./webauthn-store.js";
import { initAuditDb, logAudit, getAuditLogs } from "./audit-store.js";

const app = Fastify({ logger: true });

// Seguridad: Headers HTTP (Helmet)
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Seguridad: Rate limiting (protección DDoS y fuerza bruta)
await app.register(rateLimit, {
  max: 100, // 100 requests
  timeWindow: "1 minute", // por minuto
  ban: 5, // después de 5 superaciones, ban temporal
});

await app.register(cors, {
  origin: (() => {
    const origin = process.env.CORS_ORIGIN;
    const isProduction = process.env.NODE_ENV === "production";
    
    if (!origin && isProduction) {
      console.warn("⚠️  ADVERTENCIA: CORS_ORIGIN no configurado en producción. Recomendado: configurar dominio específico");
    }
    
    return origin || true;
  })(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
});

// Responder OPTIONS (preflight) con 200 para que CORS no devuelva 404
app.addHook("onRequest", async (request, reply) => {
  if (request.method === "OPTIONS") {
    return reply.status(204).send();
  }
});

const JWT_SECRET = (() => {
  const secret = process.env.APLAT_JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  
  if (!secret && isProduction) {
    throw new Error("❌ SEGURIDAD: APLAT_JWT_SECRET es obligatorio en producción. Generar con: openssl rand -hex 32");
  }
  
  if (isProduction && secret && secret.length < 32) {
    console.warn("⚠️  ADVERTENCIA: APLAT_JWT_SECRET debería tener al menos 32 caracteres");
  }
  
  return new TextEncoder().encode(secret || "dev-aplat-secret-SOLO-DESARROLLO-CAMBIAR");
})();

const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const key = scryptSync(password, salt, KEY_LEN);
  return `${salt.toString("base64")}:${Buffer.from(key).toString("base64")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, keyB64] = stored.split(":");
  if (!saltB64 || !keyB64) return false;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const key = scryptSync(password, salt, KEY_LEN);
    const storedKey = Buffer.from(keyB64, "base64");
    return timingSafeEqual(key, storedKey);
  } catch {
    return false;
  }
}

/** Sanitización: eliminar caracteres peligrosos para prevenir inyección */
function sanitizeString(input: string): string {
  return input.replace(/[<>'"&]/g, "").trim();
}

/** Validación de email */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/** Registro de conexiones (quién se conecta y desde dónde) — en memoria; ampliable a DB */
export type ConnectionRecord = {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
};
const connectionLog: ConnectionRecord[] = [];
const MAX_CONNECTIONS = 200;

/** Registro de visitas a la página (quién entra al sitio). Como MundoIAanime. */
export type VisitorRecord = {
  id: string;
  ip: string;
  userAgent: string;
  path: string;
  referrer: string;
  timestamp: string;
};
const visitorLog: VisitorRecord[] = [];
const MAX_VISITORS = 500;

function getClientIp(request: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return request.ip ?? "unknown";
}

type ContactBody = {
  name?: string;
  email?: string;
  message?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

// Auth: login email/password — admin (env) o cliente (store)
app.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
  const { email, password } = request.body ?? {};
  const ip = getClientIp(request);
  const userAgent = request.headers["user-agent"] ?? "unknown";
  const ts = new Date().toISOString();

  if (!email?.trim() || !password?.trim()) {
    connectionLog.unshift({
      id: crypto.randomUUID(),
      email: email?.trim() ?? "",
      ip,
      userAgent,
      timestamp: ts,
      success: false,
    });
    if (connectionLog.length > MAX_CONNECTIONS) connectionLog.pop();
    logAudit({
      action: "LOGIN_FAIL",
      entity: "auth",
      entity_id: "login",
      user_id: null,
      user_email: email?.trim() ?? null,
      ip,
      details: JSON.stringify({ reason: "missing_credentials" }),
    });
    return reply.status(400).send({ ok: false, error: "Faltan email o contraseña." });
  }

  const adminEmail = process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local";
  const adminPassword = (() => {
    const pass = process.env.APLAT_ADMIN_PASSWORD;
    const isProduction = process.env.NODE_ENV === "production";
    
    if (!pass && isProduction) {
      throw new Error("❌ SEGURIDAD: APLAT_ADMIN_PASSWORD es obligatorio en producción");
    }
    
    if (pass && pass.length < 12 && isProduction) {
      console.warn("⚠️  ADVERTENCIA: APLAT_ADMIN_PASSWORD debería tener al menos 12 caracteres");
    }
    
    return pass || "APlat2025!-SOLO-DESARROLLO";
  })();
  const emailNorm = sanitizeString(email.trim().toLowerCase());

  if (!isValidEmail(emailNorm)) {
    logAudit({
      action: "LOGIN_FAIL",
      entity: "auth",
      entity_id: "login",
      user_id: null,
      user_email: emailNorm,
      ip,
      details: JSON.stringify({ reason: "invalid_email" }),
    });
    return reply.status(400).send({ ok: false, error: "Email inválido." });
  }

  // 1) Admin
  if (emailNorm === adminEmail.toLowerCase() && password === adminPassword) {
    const token = await new SignJWT({ sub: "1", email: adminEmail, role: "master" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
    connectionLog.unshift({
      id: crypto.randomUUID(),
      email: adminEmail,
      ip,
      userAgent,
      timestamp: ts,
      success: true,
    });
    if (connectionLog.length > MAX_CONNECTIONS) connectionLog.pop();
    logAudit({
      action: "LOGIN",
      entity: "auth",
      entity_id: "1",
      user_id: "1",
      user_email: adminEmail,
      ip,
      details: JSON.stringify({ role: "master" }),
    });
    return reply.status(200).send({ ok: true, role: "master", token });
  }

  // 2) Cliente
  const client = getClientByEmail(emailNorm);
  if (client && verifyPassword(password, client.passwordHash)) {
    const token = await new SignJWT({
      sub: client.id,
      email: client.email,
      role: "client",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
    connectionLog.unshift({
      id: crypto.randomUUID(),
      email: client.email,
      ip,
      userAgent,
      timestamp: ts,
      success: true,
    });
    if (connectionLog.length > MAX_CONNECTIONS) connectionLog.pop();
    const requirePasswordChange = !!client.mustChangePassword;
    logAudit({
      action: "LOGIN",
      entity: "auth",
      entity_id: client.id,
      user_id: client.id,
      user_email: client.email,
      ip,
      details: JSON.stringify({ role: "client", requirePasswordChange }),
    });
    return reply.status(200).send({
      ok: true,
      role: "client",
      token,
      requirePasswordChange,
    });
  }

  connectionLog.unshift({
    id: crypto.randomUUID(),
    email: email.trim(),
    ip,
    userAgent,
    timestamp: ts,
    success: false,
  });
  if (connectionLog.length > MAX_CONNECTIONS) connectionLog.pop();
  logAudit({
    action: "LOGIN_FAIL",
    entity: "auth",
    entity_id: "login",
    user_id: null,
    user_email: emailNorm,
    ip,
    details: JSON.stringify({ reason: "invalid_credentials" }),
  });
  return reply.status(401).send({ ok: false, error: "Credenciales inválidas." });
});

// Registro de cliente (solo rol client)
type RegisterBody = { email?: string; password?: string };
app.post<{ Body: RegisterBody }>("/api/auth/register", async (request, reply) => {
  const { email, password } = request.body ?? {};
  const ip = getClientIp(request);
  if (!email?.trim() || !password?.trim()) {
    return reply.status(400).send({ ok: false, error: "Faltan email o contraseña." });
  }
  const emailNorm = sanitizeString(email.trim().toLowerCase());
  if (!isValidEmail(emailNorm)) {
    return reply.status(400).send({ ok: false, error: "Email inválido." });
  }
  const adminEmail = (process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local").toLowerCase();
  if (emailNorm === adminEmail) {
    return reply.status(400).send({ ok: false, error: "Este correo está reservado." });
  }
  if (getClientByEmail(emailNorm)) {
    return reply.status(409).send({ ok: false, error: "Ya existe una cuenta con este correo." });
  }
  if (password.length < 8) {
    return reply.status(400).send({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." });
  }
  const client = createClient(emailNorm, hashPassword(password), { ip });
  const token = await new SignJWT({
    sub: client.id,
    email: client.email,
    role: "client",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return reply.status(201).send({
    ok: true,
    role: "client",
    token,
    message: "Cuenta creada. Completa tu perfil en el dashboard.",
  });
});

// Verificar token y devolver usuario actual
app.get("/api/auth/me", async (request, reply) => {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return reply.status(401).send({ ok: false, error: "No autorizado." });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload as { role?: string }).role;
    let requirePasswordChange = false;
    if (role === "client" && payload.sub) {
      const client = getClientById(String(payload.sub));
      requirePasswordChange = !!client?.mustChangePassword;
    }
    return reply.status(200).send({
      ok: true,
      user: {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        requirePasswordChange,
      },
    });
  } catch {
    return reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
  }
});

// Cliente: cambiar contraseña (obligatorio tras invitación con contraseña temporal)
type ChangePasswordBody = { currentPassword?: string; newPassword?: string };
app.post<{ Body: ChangePasswordBody }>("/api/auth/change-password", async (request, reply) => {
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const ip = getClientIp(request);
  const body = request.body ?? {};
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword?.trim()) {
    return reply.status(400).send({ ok: false, error: "Faltan contraseña actual o nueva." });
  }
  if (newPassword.length < 8) {
    return reply.status(400).send({ ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." });
  }
  const client = getClientById(user.sub);
  if (!client) return reply.status(404).send({ ok: false, error: "Cliente no encontrado." });
  if (!verifyPassword(currentPassword, client.passwordHash)) {
    return reply.status(401).send({ ok: false, error: "Contraseña actual incorrecta." });
  }
  updateClientPassword(client.id, hashPassword(newPassword), { ip, userId: user.sub });
  return reply.status(200).send({ ok: true, message: "Contraseña actualizada. Ya puedes usar tu nueva contraseña." });
});

// Listar últimas conexiones (solo con token válido)
app.get("/api/dashboard/connections", async (request, reply) => {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return reply.status(401).send({ ok: false, error: "No autorizado." });
  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
  }
  const limit = Math.min(Number((request.query as { limit?: string }).limit) || 50, 100);
  return reply.status(200).send({
    ok: true,
    connections: connectionLog.slice(0, limit),
  });
});

// Registrar visita a la página (público, sin auth). Lo llama el front al cargar.
type VisitBody = { path?: string; referrer?: string };
app.post<{ Body: VisitBody }>("/api/analytics/visit", async (request, reply) => {
  const ip = getClientIp(request);
  const userAgent = request.headers["user-agent"] ?? "unknown";
  const referrerHeader = request.headers["referer"] ?? request.headers["referrer"];
  const ref = typeof referrerHeader === "string" ? referrerHeader : Array.isArray(referrerHeader) ? referrerHeader[0] : "";
  const body = request.body ?? {};
  const path = typeof body.path === "string" ? body.path : "/";
  const referrer = typeof body.referrer === "string" ? body.referrer : ref;
  visitorLog.unshift({
    id: crypto.randomUUID(),
    ip,
    userAgent,
    path,
    referrer: referrer.slice(0, 500),
    timestamp: new Date().toISOString(),
  });
  if (visitorLog.length > MAX_VISITORS) visitorLog.pop();
  return reply.status(200).send({ ok: true });
});

// Listar últimas visitas a la página (solo con token válido)
app.get("/api/dashboard/visitors", async (request, reply) => {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return reply.status(401).send({ ok: false, error: "No autorizado." });
  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
  }
  const limit = Math.min(Number((request.query as { limit?: string }).limit) || 100, 200);
  return reply.status(200).send({
    ok: true,
    visitors: visitorLog.slice(0, limit),
  });
});

// Helper: verificar JWT y responder 401 si no es válido
async function requireAuth(
  request: { headers: { authorization?: string } },
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    await reply.status(401).send({ ok: false, error: "No autorizado." });
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub?: string; email?: string; role?: string };
  } catch {
    await reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
    return null;
  }
}

async function requireRole(
  request: { headers: { authorization?: string } },
  reply: { status: (code: number) => { send: (body: unknown) => unknown } },
  role: "client" | "master"
) {
  const user = await requireAuth(request, reply);
  if (!user) return null;
  if (user.role !== role) {
    await reply.status(403).send({ ok: false, error: "Sin permiso para este recurso." });
    return null;
  }
  return user;
}

// --- WhatsApp (carga perezosa para no bloquear arranque si /data falla) ---
let whatsappModule: Awaited<typeof import("./whatsapp.js")> | null = null;
async function getWhatsApp() {
  if (!whatsappModule) {
    try {
      whatsappModule = await import("./whatsapp.js");
    } catch (err) {
      app.log.warn(err, "WhatsApp module failed to load");
      return null;
    }
  }
  return whatsappModule;
}

app.get("/api/whatsapp/status", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const wa = await getWhatsApp();
  if (!wa) return reply.status(200).send({ ok: true, connected: false });
  try {
    const connected = await wa.isWhatsAppConnected();
    return reply.status(200).send({ ok: true, connected });
  } catch (err) {
    request.log.warn(err);
    return reply.status(200).send({ ok: true, connected: false });
  }
});

app.get("/api/whatsapp/qr", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const wa = await getWhatsApp();
  if (!wa) return reply.status(200).send({ ok: true, qr: null, message: "WhatsApp no disponible." });
  const generate = (request.query as { generate?: string }).generate === "true";
  try {
    let qr: string | null = wa.getCurrentQR();
    if (!qr && generate) qr = await wa.getWhatsAppQR();
    if (qr) return reply.status(200).send({ ok: true, qr });
    const rateLimit = wa.getQRRateLimitInfo();
    if (rateLimit.isRateLimited) {
      return reply.status(200).send({
        ok: true,
        qr: null,
        message: `Espera ${rateLimit.remainingMinutes} minuto(s) antes de generar otro QR.`,
        rateLimited: true,
        remainingMinutes: rateLimit.remainingMinutes,
      });
    }
    const cooldown = wa.getCooldownInfo();
    if (cooldown.inCooldown) {
      return reply.status(200).send({
        ok: true,
        qr: null,
        message: cooldown.isLinkingError
          ? `Error de vinculación. Desvincula dispositivos antiguos y espera ${cooldown.remainingMinutes} minutos.`
          : `Cooldown activo. Espera ${cooldown.remainingMinutes} minutos.`,
        cooldown: true,
        linkingError: cooldown.isLinkingError,
      });
    }
    if (wa.hasLinkingError()) {
      return reply.status(200).send({
        ok: true,
        qr: null,
        message: "Error de vinculación. Desvincula dispositivos antiguos en WhatsApp.",
        linkingError: true,
      });
    }
    const connected = await wa.isWhatsAppConnected();
    if (connected) {
      return reply.status(200).send({ ok: true, qr: null, message: "WhatsApp ya está conectado.", connected: true });
    }
    return reply.status(200).send({ ok: true, qr: null, message: "Solicita un nuevo QR con el botón Obtener QR." });
  } catch (err) {
    request.log.warn(err);
    return reply.status(200).send({ ok: true, qr: null, error: "internal_error", message: "Error al obtener QR." });
  }
});

app.post("/api/whatsapp/clean", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const wa = await getWhatsApp();
  if (!wa) return reply.status(200).send({ ok: false, message: "WhatsApp no disponible." });
  try {
    const result = await wa.cleanWhatsAppCredentials();
    return reply.status(200).send({ ok: result.success, message: result.message });
  } catch (err) {
    request.log.warn(err);
    return reply.status(500).send({ ok: false, message: "Error al limpiar credenciales." });
  }
});

app.post<{ Body: { phoneNumber?: string; message?: string } }>("/api/whatsapp/send", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const wa = await getWhatsApp();
  if (!wa) return reply.status(503).send({ ok: false, error: "WhatsApp no disponible." });
  const { phoneNumber, message } = request.body ?? {};
  if (!phoneNumber?.trim() || !message?.trim()) {
    return reply.status(400).send({ ok: false, error: "Se requieren phoneNumber y message." });
  }
  try {
    const result = await wa.sendWhatsAppMessage(phoneNumber.trim(), message.trim());
    if (result.success) {
      return reply.status(200).send({ ok: true, success: true, messageId: result.messageId, jid: result.jid });
    }
    return reply.status(500).send({ ok: false, error: result.error ?? "Error al enviar." });
  } catch (err) {
    request.log.warn(err);
    return reply.status(500).send({ ok: false, error: "Error al enviar mensaje." });
  }
});

// --- Cliente: perfil, teléfono, suscripciones ---
type ProfileBody = {
  nombres?: string;
  apellidos?: string;
  identidad?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  tipoServicio?: string;
};

app.get("/api/client/profile", async (request, reply) => {
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const client = getClientById(user.sub);
  if (!client) return reply.status(404).send({ ok: false, error: "Cliente no encontrado." });
  return reply.status(200).send({
    ok: true,
    profile: client.profile ?? null,
    email: client.email,
  });
});

app.put<{ Body: ProfileBody }>("/api/client/profile", async (request, reply) => {
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const ip = getClientIp(request);
  const body = request.body ?? {};
  const client = getClientById(user.sub);
  if (!client) return reply.status(404).send({ ok: false, error: "Cliente no encontrado." });
  const prevPhone = client.profile?.telefono ?? "";
  const nextPhone = (body.telefono ?? prevPhone).trim();
  const updated = updateClientProfile(user.sub, {
    nombres: body.nombres?.trim(),
    apellidos: body.apellidos?.trim(),
    identidad: body.identidad?.trim(),
    telefono: nextPhone || prevPhone,
    telefonoVerificado: nextPhone && normalizePhone(nextPhone) === normalizePhone(prevPhone) ? (client.profile?.telefonoVerificado ?? false) : false,
    direccion: body.direccion?.trim(),
    email: body.email?.trim() || client.email,
    tipoServicio: body.tipoServicio?.trim(),
  }, { ip, userId: user.sub });
  return reply.status(200).send({ ok: true, profile: updated?.profile });
});

app.post<{ Body: { phone?: string } }>("/api/auth/phone/send-code", async (request, reply) => {
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const phone = (request.body as { phone?: string })?.phone?.trim();
  if (!phone) return reply.status(400).send({ ok: false, error: "Teléfono requerido." });
  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  setPhoneCode(phone, code, user.sub);
  const wa = await getWhatsApp();
  let jid: string | undefined;
  if (wa) {
    const toSend = normalizePhone(phone);
    if (toSend.length >= 8) {
      const result = await wa.sendWhatsAppMessage(toSend, `Tu código de verificación APlat: ${code}. Válido 10 minutos.`);
      jid = result.jid;
    }
  }
  return reply.status(200).send({ ok: true, message: "Código enviado por WhatsApp.", jid });
});

app.post<{ Body: { phone?: string; code?: string } }>("/api/auth/phone/verify", async (request, reply) => {
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const { phone, code } = (request.body as { phone?: string; code?: string }) ?? {};
  if (!phone?.trim() || !code?.trim()) return reply.status(400).send({ ok: false, error: "Teléfono y código requeridos." });
  if (!consumePhoneCode(phone.trim(), code.trim(), user.sub)) {
    return reply.status(400).send({ ok: false, error: "Código inválido o expirado." });
  }
  setPhoneVerified(user.sub, true);
  return reply.status(200).send({ ok: true, message: "Teléfono verificado." });
});

app.get("/api/client/subscriptions", async (request, reply) => {
  processCutoffs();
  const user = await requireRole(request, reply, "client");
  if (!user?.sub) return;
  const client = getClientById(user.sub);
  const phone = client?.profile?.telefono ?? "";
  if (!phone) return reply.status(200).send({ ok: true, subscriptions: [] });
  const subs = getSubscriptionsByPhone(phone);
  const result = subs.map((s) => {
    const nextDate = getNextCutoffDate(s);
    const reminder = new Date(nextDate);
    reminder.setDate(reminder.getDate() - 5);
    const months = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
    return {
      id: s.id,
      serviceName: s.serviceName,
      dayOfMonth: s.dayOfMonth,
      amount: s.amount,
      status: s.status,
      nextCutoff: nextDate.toISOString().slice(0, 10),
      nextReminder: `${reminder.getDate()} ${months[reminder.getMonth()]}`,
    };
  });
  return reply.status(200).send({ ok: true, subscriptions: result });
});

// Admin: enviar invitación de suscripción por WhatsApp (crea usuario si email nuevo, mensaje con bienvenida + datos + link)
function generateTempPassword(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) out += chars[bytes[i]! % chars.length];
  return out;
}

type SendSubscriptionInviteBody = {
  subscriptionId?: string;
  serviceName?: string;
  dayOfMonth?: number;
  phone?: string;
  email?: string;
  amount?: number;
};
app.post<{ Body: SendSubscriptionInviteBody }>("/api/admin/send-subscription-invite", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  const body = request.body ?? {};
  const { subscriptionId, serviceName: bodyService, dayOfMonth: bodyDay, phone: bodyPhone, email: bodyEmail, amount: bodyAmount } = body;

  let serviceName: string;
  let phone: string;
  let day: number;
  let amount: number | undefined;
  let emailNorm: string | undefined;

  if (subscriptionId?.trim()) {
    const sub = getSubscriptionById(subscriptionId.trim());
    if (!sub) return reply.status(404).send({ ok: false, error: "Suscripción no encontrada." });
    serviceName = sub.serviceName;
    phone = sub.phone;
    day = Math.min(28, Math.max(1, sub.dayOfMonth));
    amount = sub.amount;
    const client = getClientByPhone(sub.phone);
    emailNorm = client?.email?.trim().toLowerCase();
  } else {
    if (!bodyService?.trim() || !bodyPhone?.trim()) {
      return reply.status(400).send({ ok: false, error: "Se requieren servicio y teléfono." });
    }
    serviceName = bodyService.trim();
    phone = bodyPhone.trim();
    day = Math.min(28, Math.max(1, Number(bodyDay) || 1));
    amount = bodyAmount;
    emailNorm = bodyEmail?.trim().toLowerCase();
  }

  const adminEmail = (process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local").toLowerCase();
  if (emailNorm && emailNorm === adminEmail) {
    return reply.status(400).send({ ok: false, error: "Ese correo está reservado para el administrador." });
  }

  const normalized = normalizePhone(phone);
  const wa = await getWhatsApp();
  if (!wa) return reply.status(503).send({ ok: false, error: "WhatsApp no disponible." });

  const nextCutoff = (() => {
    const n = new Date();
    let d = new Date(n.getFullYear(), n.getMonth(), day);
    if (d <= n) d = new Date(n.getFullYear(), n.getMonth() + 1, day);
    return d;
  })();
  const cutoffStr = nextCutoff.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const reminder = new Date(nextCutoff);
  reminder.setDate(reminder.getDate() - 5);
  const reminderStr = reminder.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const baseUrl = (process.env.APLAT_APP_URL || process.env.CORS_ORIGIN || "https://aplat.vercel.app").replace(/\/$/, "");
  const loginUrl = `${baseUrl}/login`;

  let clientCreated = false;
  let tempPassword: string | null = null;

  if (!subscriptionId && emailNorm) {
    let client = getClientByEmail(emailNorm);
    if (!client) {
      tempPassword = generateTempPassword(12);
      client = createClient(emailNorm, hashPassword(tempPassword), {
        mustChangePassword: true,
        initialPhone: normalized,
        ip: getClientIp(request),
        userId: user.sub,
      });
      clientCreated = true;
    } else if (!client.profile?.telefono || normalizePhone(client.profile.telefono) !== normalized) {
      updateClientProfile(client.id, {
        telefono: normalized,
        telefonoVerificado: true,
      }, { ip: getClientIp(request), userId: user.sub, userEmail: user.email });
    }
  }

  if (!subscriptionId) addServiceSubscription(phone, serviceName, day, amount, { ip: getClientIp(request), userId: user.sub, userEmail: user.email });

  const amountStr = amount != null ? `\n• Monto: $${amount}` : "";
  let message: string;
  if (clientCreated && emailNorm && tempPassword) {
    const serviceLabel = String(serviceName).trim();
    message =
      `*¡Bienvenido a APlat!* 🎉\n\n` +
      `Tu suscripción está activa para *${serviceLabel}*.\n\n` +
      `Estos son tus datos de acceso:\n\n` +
      `📧 *Correo:* ${emailNorm}\n` +
      `🔑 *Contraseña temporal:* ${tempPassword}\n\n` +
      `👉 *Entra aquí y cambia tu contraseña:*\n${loginUrl}\n\n` +
      `📅 *Fecha de corte y pago:* ${cutoffStr}\n` +
      `⏰ Recordatorio por WhatsApp: ${reminderStr}${amountStr}\n\n` +
      `Después de entrar, completa tu perfil en el panel.`;
  } else {
    message =
      `*APlat* – *${String(serviceName).trim()}*\n\n` +
      `Bienvenido/a. Tu suscripción está activa.\n\n` +
      `📅 Fecha de corte y pago: *${cutoffStr}*\n` +
      `⏰ Recordatorio: ${reminderStr}${amountStr}\n\n` +
      `Accede a tu panel: ${loginUrl}`;
  }

  try {
    const result = await wa.sendWhatsAppMessage(normalized, message);
    if (!result.success) {
      return reply.status(500).send({ ok: false, error: result.error ?? "Error al enviar." });
    }
    return reply.status(200).send({
      ok: true,
      message: clientCreated ? `Invitación enviada. Cuenta creada para ${emailNorm}.` : "Invitación enviada por WhatsApp.",
      jid: result.jid,
      clientCreated,
    });
  } catch (err) {
    request.log.warn(err);
    return reply.status(500).send({ ok: false, error: "Error al enviar mensaje." });
  }
});

// Cron: ejecutar cortes automáticamente (ej. cada día a las 23:59). Requiere APLAT_CRON_SECRET.
app.post("/api/cron/process-cutoffs", async (request, reply) => {
  const secret = process.env.APLAT_CRON_SECRET;
  const headerSecret = (request.headers["x-cron-secret"] as string) ?? "";
  const querySecret = (request.query as { secret?: string }).secret ?? "";
  const provided = headerSecret || querySecret;
  if (!secret || provided !== secret) {
    return reply.status(401).send({ ok: false, error: "No autorizado." });
  }
  try {
    const suspended = processCutoffs();
    request.log.info({ suspended }, "Cron process-cutoffs ejecutado");
    return reply.status(200).send({ ok: true, suspended, message: `Cortes procesados. ${suspended} suscripción(es) suspendida(s).` });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : "Error al ejecutar cortes." });
  }
});

// Admin: ejecutar lógica de cortes (suspender suscripciones con fecha de pago vencida). Llamar por cron diario o manual.
app.post("/api/admin/process-cutoffs", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  try {
    const suspended = processCutoffs();
    return reply.status(200).send({ ok: true, suspended, message: `Cortes procesados. ${suspended} suscripción(es) suspendida(s).` });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : "Error al ejecutar cortes." });
  }
});

// Admin: marcar suscripción como pagada (reactiva si estaba suspendida y actualiza próximo corte)
type MarkPaidBody = { subscriptionId?: string; cutoffDate?: string };
app.post<{ Body: MarkPaidBody }>("/api/admin/mark-subscription-paid", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  const body = request.body ?? {};
  const { subscriptionId, cutoffDate } = body;
  if (!subscriptionId?.trim() || !cutoffDate?.trim()) {
    return reply.status(400).send({ ok: false, error: "Se requieren subscriptionId y cutoffDate (YYYY-MM-DD)." });
  }
  const sub = getSubscriptionById(subscriptionId);
  if (!sub) return reply.status(404).send({ ok: false, error: "Suscripción no encontrada." });
  const ok = markSubscriptionPaid(subscriptionId, cutoffDate.trim(), { ip: getClientIp(request), userId: user.sub, userEmail: user.email });
  return reply.status(200).send({ ok: true, message: "Marcado como pagado. El cliente verá el servicio activo y próximo corte actualizado." });
});

// Admin: listar todas las suscripciones (para ver estado y marcar pagos)
app.get("/api/admin/subscriptions", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  try {
    processCutoffs();
    const subs = getAllSubscriptions();
    const months = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
    const result = subs.map((s) => {
      let clientEmail: string | null = null;
      let clientId: string | null = null;
      try {
        const client = getClientByPhone(s.phone);
        if (client) {
          clientEmail = client.email;
          clientId = client.id;
        }
      } catch {
        // ignorar fallo de lookup por teléfono
      }
      const next = getNextCutoffDate(s);
      const lastMissed = getLastMissedCutoffDate(s);
      const reminder = new Date(next);
      reminder.setDate(reminder.getDate() - 5);
      return {
        id: s.id,
        phone: s.phone,
        serviceName: s.serviceName,
        dayOfMonth: s.dayOfMonth,
        amount: s.amount,
        status: s.status,
        paidUntil: s.paidUntil,
        nextCutoff: next.toISOString().slice(0, 10),
        lastMissedCutoff: lastMissed,
        nextReminder: `${reminder.getDate()} ${months[reminder.getMonth()]}`,
        createdAt: s.createdAt,
        clientEmail,
        clientId,
      };
    });
    return reply.status(200).send({ ok: true, subscriptions: result });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : "Error al listar suscripciones." });
  }
});

type UpdateSubscriptionBody = {
  phone?: string;
  serviceName?: string;
  dayOfMonth?: number;
  amount?: number;
  status?: "active" | "suspended";
  clientEmail?: string;
};
app.patch<{ Params: { id: string }; Body: UpdateSubscriptionBody }>("/api/admin/subscriptions/:id", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  const { id } = request.params;
  const body = request.body ?? {};
  const sub = getSubscriptionById(id);
  if (!sub) return reply.status(404).send({ ok: false, error: "Suscripción no encontrada." });
  if (body.clientEmail !== undefined && body.clientEmail !== null) {
    const client = getClientByPhone(sub.phone);
    if (client) updateClientProfile(client.id, { email: body.clientEmail!.trim().toLowerCase() });
  }
  updateSubscription(id, {
    phone: body.phone,
    serviceName: body.serviceName,
    dayOfMonth: body.dayOfMonth,
    amount: body.amount,
    status: body.status,
  });
  return reply.status(200).send({ ok: true, message: "Suscripción actualizada." });
});

app.delete<{ Params: { id: string } }>("/api/admin/subscriptions/:id", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  const { id } = request.params;
  const sub = getSubscriptionById(id);
  if (!sub) return reply.status(404).send({ ok: false, error: "Suscripción no encontrada." });
  const ok = deleteSubscription(id, { ip: getClientIp(request), userId: user.sub, userEmail: user.email });
  return reply.status(200).send({ ok: true, message: "Suscripción eliminada. El servicio queda sin usuario asignado." });
});

// --- WebAuthn / Passkey (como Omac) ---
const WEBAUTHN_RP_ID = process.env.APLAT_WEBAUTHN_RP_ID || "localhost";
const APLAT_ADMIN_EMAIL = process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local";
const USER_ID = 1;

// POST /api/auth/webauthn/challenge — público, para login con Passkey
app.post("/api/auth/webauthn/challenge", async (_, reply) => {
  const challenge = randomBytes(32);
  const challengeBase64 = challenge.toString("base64url");
  setChallenge(challengeBase64, USER_ID, Date.now() + 5 * 60 * 1000);
  return reply.status(200).send({ ok: true, challenge: challengeBase64, userId: String(USER_ID) });
});

// POST /api/auth/webauthn/verify — público, verifica Passkey y devuelve JWT
app.post<{
  Body: {
    credentialId?: number[] | string;
    authenticatorData?: number[];
    clientDataJSON?: number[];
    signature?: number[];
    userHandle?: number[] | null;
  };
}>("/api/auth/webauthn/verify", async (request, reply) => {
  const body = request.body ?? {};
  let credentialIdStr: string;
  if (Array.isArray(body.credentialId)) {
    credentialIdStr = Buffer.from(new Uint8Array(body.credentialId)).toString("base64url");
  } else if (typeof body.credentialId === "string") {
    credentialIdStr = body.credentialId.includes(",")
      ? Buffer.from(new Uint8Array(body.credentialId.split(",").map(Number))).toString("base64url")
      : body.credentialId;
  } else {
    return reply.status(400).send({ ok: false, error: "credentialId requerido" });
  }
  const cred = getCredentialByCredentialId(credentialIdStr);
  if (!cred) {
    return reply.status(401).send({
      ok: false,
      error: "credential_not_found",
      message: "Passkey no registrada. Inicia sesión con email/contraseña y registra una Passkey.",
    });
  }
  updateCredentialLastUsed(credentialIdStr);
  const token = await new SignJWT({
    sub: String(cred.userId),
    email: APLAT_ADMIN_EMAIL,
    role: "master",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return reply.status(200).send({
    ok: true,
    role: "master",
    email: APLAT_ADMIN_EMAIL,
    token,
  });
});

// GET /api/auth/webauthn/has-passkey — requiere JWT; indica si el usuario tiene al menos una Passkey (solo admin; clientes no usan Passkey aún)
app.get("/api/auth/webauthn/has-passkey", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  if (user.role === "client") return reply.status(200).send({ ok: true, hasPasskey: false });
  const credentials = getCredentialsByUserId(USER_ID);
  return reply.status(200).send({ ok: true, hasPasskey: credentials.length > 0 });
});

// POST /api/auth/webauthn/register/begin — requiere JWT
app.post<{ Body: { deviceName?: string } }>("/api/auth/webauthn/register/begin", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const challenge = randomBytes(32);
  const challengeBase64 = challenge.toString("base64url");
  const challengeUint8 = new Uint8Array(challenge);
  setChallenge(challengeBase64, USER_ID, Date.now() + 5 * 60 * 1000);
  const userIdBytes = new TextEncoder().encode(String(USER_ID));
  const options = {
    challenge: Array.from(challengeUint8),
    rp: { name: "APlat", id: WEBAUTHN_RP_ID },
    user: {
      id: Array.from(userIdBytes),
      name: APLAT_ADMIN_EMAIL,
      displayName: APLAT_ADMIN_EMAIL.split("@")[0],
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" as const },
      { alg: -257, type: "public-key" as const },
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform" as const,
      userVerification: "required" as const,
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: "none" as const,
  };
  return reply.status(200).send({
    ok: true,
    challenge: challengeBase64,
    options,
  });
});

// POST /api/auth/webauthn/register/complete — requiere JWT
app.post<{
  Body: {
    challenge?: string;
    credentialId?: number[] | string;
    publicKey?: unknown;
    deviceName?: string;
  };
}>("/api/auth/webauthn/register/complete", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
  const body = request.body ?? {};
  const challenge = body.challenge;
  if (!challenge) {
    return reply.status(400).send({ ok: false, error: "challenge requerido" });
  }
  const stored = getAndConsumeChallenge(challenge);
  if (!stored || stored.userId !== USER_ID) {
    return reply.status(400).send({ ok: false, error: "challenge_expired" });
  }
  let credentialIdStr: string;
  if (Array.isArray(body.credentialId)) {
    credentialIdStr = Buffer.from(new Uint8Array(body.credentialId)).toString("base64url");
  } else if (typeof body.credentialId === "string") {
    credentialIdStr = body.credentialId.includes(",")
      ? Buffer.from(new Uint8Array(body.credentialId.split(",").map(Number))).toString("base64url")
      : body.credentialId;
  } else {
    return reply.status(400).send({ ok: false, error: "credentialId requerido" });
  }
  if (!body.publicKey) {
    return reply.status(400).send({ ok: false, error: "publicKey requerido" });
  }
  addCredential({
    userId: USER_ID,
    credentialId: credentialIdStr,
    publicKey: JSON.stringify(body.publicKey),
    deviceName: body.deviceName || "Unknown",
  }, { ip: getClientIp(request), userEmail: APLAT_ADMIN_EMAIL });
  return reply.status(200).send({
    ok: true,
    message: "Passkey registrada correctamente",
    credentialId: credentialIdStr,
  });
});

app.post<{ Body: ContactBody }>("/api/contact", async (request, reply) => {
  const { name, email, message } = request.body ?? {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return reply.status(400).send({
      ok: false,
      error: "Faltan nombre, email o mensaje.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return reply.status(400).send({
      ok: false,
      error: "Email no válido.",
    });
  }

  // Aquí puedes: guardar en DB, enviar a un webhook, enviar email, etc.
  // Por ahora solo log y respuesta exitosa.
  request.log.info(
    { name: name.trim(), email: email.trim(), messageLength: message.trim().length },
    "Contact form submission"
  );

  return reply.status(200).send({
    ok: true,
    message: "Mensaje recibido. Te responderemos pronto.",
  });
});

// Admin: ver logs de auditoría (registro completo de cambios)
app.get("/api/admin/audit-logs", async (request, reply) => {
  const user = await requireRole(request, reply, "master");
  if (!user) return;
  const query = request.query as { entity?: string; entity_id?: string; limit?: string };
  const logs = getAuditLogs({
    entity: query.entity,
    entity_id: query.entity_id,
    limit: Math.min(Number(query.limit) || 100, 500),
  });
  return reply.status(200).send({ ok: true, logs });
});

app.get("/api/health", async (_, reply) => {
  return reply.send({ ok: true, service: "aplat-api" });
});

// Cabeceras de seguridad en todas las respuestas
app.addHook("onSend", async (_, reply, payload) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "SAMEORIGIN");
  reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
  return payload;
});

// Rate limit simple en memoria para login (max 5 intentos por IP por minuto)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_WINDOW_MS = 60_000;
const LOGIN_RATE_MAX = 5;

app.addHook("preHandler", async (request, reply) => {
  if (request.url !== "/api/auth/login" || request.method !== "POST") return;
  const ip = getClientIp(request);
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry) {
    entry = { count: 0, resetAt: now + LOGIN_RATE_WINDOW_MS };
    loginAttempts.set(ip, entry);
  }
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + LOGIN_RATE_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > LOGIN_RATE_MAX) {
    return reply.status(429).send({
      ok: false,
      error: "Demasiados intentos. Espera un momento antes de volver a intentar.",
    });
  }
});

// 404 para rutas no definidas (evita respuestas HTML por defecto)
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    ok: false,
    error: "not_found",
    message: `Route ${request.method}:${request.url} not found`,
  });
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST ?? "0.0.0.0";

// Inicializar base de datos de clientes y auditoría
await initStoreDb();
await initAuditDb();

try {
  await app.listen({ port, host });
  console.log(`APlat API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
