/**
 * GURU Web Push — API suscripciones y envío.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import webpush from "web-push";
import {
  initPushStore,
  addSubscription,
  getAllSubscriptions,
  removeSubscription,
} from "./push-store.js";

type AuthPayload = { sub?: string; email?: string; role?: string };

const VAPID_PUBLIC = process.env.GURU_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.GURU_VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:aplat@example.com",
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.GURU_JWT_SECRET || "dev-guru-secret-SOLO-DESARROLLO-CAMBIAR";
  return new TextEncoder().encode(secret);
}

async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<AuthPayload | null> {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    await reply.status(401).send({ ok: false, error: "No autorizado." });
    return null;
  }
  try {
    const secret = await getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch {
    await reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
    return null;
  }
}

async function requireMaster(request: FastifyRequest, reply: FastifyReply): Promise<AuthPayload | null> {
  const user = await requireAuth(request, reply);
  if (!user) return null;
  if (user.role !== "master") {
    await reply.status(403).send({ ok: false, error: "Se requiere rol master." });
    return null;
  }
  return user;
}

export async function registerPushRoutes(app: FastifyInstance): Promise<void> {
  initPushStore();

  app.get("/api/push/vapid-public", async (_, reply) => {
    if (!VAPID_PUBLIC) {
      return reply.status(503).send({ ok: false, error: "Web Push no configurado (VAPID keys)." });
    }
    return reply.status(200).send({ ok: true, publicKey: VAPID_PUBLIC });
  });

  app.post("/api/push/subscribe", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as {
      endpoint: string;
      keys: { auth: string; p256dh: string };
      userAgent?: string;
    };
    if (!body.endpoint || !body.keys?.auth || !body.keys?.p256dh) {
      return reply.status(400).send({ ok: false, error: "Faltan endpoint o keys.auth/p256dh." });
    }
    const record = addSubscription(
      { endpoint: body.endpoint, keys: body.keys, userAgent: body.userAgent },
      { id: user.sub, email: user.email }
    );
    return reply.status(200).send({ ok: true, id: record.id });
  });

  app.post("/api/push/unsubscribe", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { endpoint: string };
    if (!body.endpoint) return reply.status(400).send({ ok: false, error: "Falta endpoint." });
    const removed = removeSubscription(body.endpoint);
    return reply.status(200).send({ ok: removed });
  });

  app.post("/api/push/send", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return reply.status(503).send({ ok: false, error: "Web Push no configurado (VAPID keys)." });
    }
    const body = request.body as { title?: string; body?: string; tag?: string };
    const title = body.title ?? "GURU";
    const payload = JSON.stringify({
      title,
      body: body.body ?? "",
      tag: body.tag ?? "default",
    });
    const subs = getAllSubscriptions();
    const results: { sent: number; failed: number } = { sent: 0, failed: 0 };
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 86400 }
        );
        results.sent++;
      } catch {
        results.failed++;
      }
    }
    return reply.status(200).send({ ok: true, ...results });
  });
}
