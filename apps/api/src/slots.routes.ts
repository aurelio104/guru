/**
 * APlat Slots — API recursos y reservas.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import {
  getAllResources,
  getResourceById,
  createResource,
  getBookingsByResource,
  createBooking,
  cancelBooking,
  getRecentBookings,
  initSlotsStore,
} from "./slots-store.js";

type AuthPayload = { sub?: string; email?: string; role?: string };

async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.APLAT_JWT_SECRET || "dev-aplat-secret-SOLO-DESARROLLO-CAMBIAR";
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

export async function registerSlotsRoutes(app: FastifyInstance): Promise<void> {
  initSlotsStore();

  app.get("/api/slots/resources", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllResources();
    return reply.status(200).send({ ok: true, resources: list });
  });

  app.get("/api/slots/resources/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const r = getResourceById(id);
    if (!r) return reply.status(404).send({ ok: false, error: "Recurso no encontrado." });
    return reply.status(200).send({ ok: true, resource: r });
  });

  app.post("/api/slots/resources", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body as {
      name: string;
      description?: string;
      slotDurationMinutes: number;
      capacity?: number;
    };
    if (!body.name || body.slotDurationMinutes == null) {
      return reply.status(400).send({ ok: false, error: "Faltan name o slotDurationMinutes." });
    }
    const r = createResource({
      name: body.name,
      description: body.description,
      slotDurationMinutes: body.slotDurationMinutes,
      capacity: body.capacity,
    });
    return reply.status(201).send({ ok: true, resource: r });
  });

  app.get("/api/slots/resources/:id/bookings", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const q = request.query as { from?: string; to?: string };
    const list = getBookingsByResource(id, q.from, q.to);
    return reply.status(200).send({ ok: true, bookings: list });
  });

  app.post("/api/slots/bookings", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as {
      resourceId: string;
      startAt: string;
      endAt: string;
      title?: string;
    };
    if (!body.resourceId || !body.startAt || !body.endAt) {
      return reply.status(400).send({ ok: false, error: "Faltan resourceId, startAt o endAt." });
    }
    const result = createBooking({
      resourceId: body.resourceId,
      startAt: body.startAt,
      endAt: body.endAt,
      userId: user.sub,
      userEmail: user.email,
      title: body.title,
    });
    if ("error" in result) {
      return reply.status(400).send({ ok: false, error: result.error });
    }
    return reply.status(201).send({ ok: true, booking: result });
  });

  app.post("/api/slots/bookings/:id/cancel", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const ok = cancelBooking(id);
    if (!ok) return reply.status(404).send({ ok: false, error: "Reserva no encontrada." });
    return reply.status(200).send({ ok: true });
  });

  app.get("/api/slots/bookings/recent", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { limit?: string };
    const limit = q.limit ? parseInt(q.limit, 10) : 50;
    const list = getRecentBookings(limit);
    return reply.status(200).send({ ok: true, bookings: list });
  });
}
