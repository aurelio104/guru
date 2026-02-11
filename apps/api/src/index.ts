import Fastify from "fastify";
import cors from "@fastify/cors";
import { SignJWT, jwtVerify } from "jose";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
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

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`APlat API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
