/**
 * APlat GDPR/LOPD — API checklist cumplimiento.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import { getGdprChecklist, updateGdprItem, initGdprStore } from "./gdpr-store.js";
import type { GdprItemStatus } from "./gdpr-store.js";

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

export async function registerGdprRoutes(app: FastifyInstance): Promise<void> {
  initGdprStore();

  app.get("/api/gdpr/checklist", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getGdprChecklist();
    return reply.status(200).send({ ok: true, items: list });
  });

  app.patch("/api/gdpr/checklist/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const body = request.body as { status?: GdprItemStatus; notes?: string };
    const item = updateGdprItem(id, { status: body.status, notes: body.notes });
    if (!item) return reply.status(404).send({ ok: false, error: "Ítem no encontrado." });
    return reply.status(200).send({ ok: true, item });
  });
}
