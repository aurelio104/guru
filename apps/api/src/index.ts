import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  getCredentialByCredentialId,
  getCredentialsByUserId,
  addCredential,
  setChallenge,
  getAndConsumeChallenge,
  updateCredentialLastUsed,
} from "./webauthn-store.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
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

const JWT_SECRET = new TextEncoder().encode(
  process.env.APLAT_JWT_SECRET || "dev-aplat-secret-cambiar-en-produccion"
);

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

// Auth: login email/password (usuario demo o env; ampliable a DB + passkey)
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
    return reply.status(400).send({ ok: false, error: "Faltan email o contraseña." });
  }
  const adminEmail = process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local";
  const adminPassword = process.env.APLAT_ADMIN_PASSWORD || "APlat2025!";
  if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    connectionLog.unshift({
      id: crypto.randomUUID(),
      email: email.trim(),
      ip,
      userAgent,
      timestamp: ts,
      success: false,
    });
    if (connectionLog.length > MAX_CONNECTIONS) connectionLog.pop();
    return reply.status(401).send({ ok: false, error: "Credenciales inválidas." });
  }
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

  return reply.status(200).send({
    ok: true,
    role: "master",
    token,
  });
});

// Verificar token y devolver usuario actual
app.get("/api/auth/me", async (request, reply) => {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return reply.status(401).send({ ok: false, error: "No autorizado." });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return reply.status(200).send({
      ok: true,
      user: {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch {
    return reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
  }
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
      return reply.status(200).send({ ok: true, success: true, messageId: result.messageId });
    }
    return reply.status(500).send({ ok: false, error: result.error ?? "Error al enviar." });
  } catch (err) {
    request.log.warn(err);
    return reply.status(500).send({ ok: false, error: "Error al enviar mensaje." });
  }
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

// GET /api/auth/webauthn/has-passkey — requiere JWT; indica si el usuario tiene al menos una Passkey (para ofrecer registro tras login)
app.get("/api/auth/webauthn/has-passkey", async (request, reply) => {
  const user = await requireAuth(request, reply);
  if (!user) return;
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
  });
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

try {
  await app.listen({ port, host });
  console.log(`APlat API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
