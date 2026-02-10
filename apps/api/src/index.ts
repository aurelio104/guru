import Fastify from "fastify";
import cors from "@fastify/cors";
import { SignJWT } from "jose";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.APLAT_JWT_SECRET || "dev-aplat-secret-cambiar-en-produccion"
);

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
  if (!email?.trim() || !password?.trim()) {
    return reply.status(400).send({ ok: false, error: "Faltan email o contraseña." });
  }
  const adminEmail = process.env.APLAT_ADMIN_EMAIL || "admin@aplat.local";
  const adminPassword = process.env.APLAT_ADMIN_PASSWORD || "APlat2025!";
  if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    return reply.status(401).send({ ok: false, error: "Credenciales inválidas." });
  }
  const token = await new SignJWT({ sub: "1", email: adminEmail, role: "master" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return reply.status(200).send({
    ok: true,
    role: "master",
    token,
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

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`APlat API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
