import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  methods: ["GET", "POST", "OPTIONS"],
});

type ContactBody = {
  name?: string;
  email?: string;
  message?: string;
};

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
