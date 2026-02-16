/**
 * APlat Assets — API para tracking de activos con beacons BLE.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import {
  getAllAssets,
  getAssetById,
  getAssetsBySite,
  createAsset,
  deleteAsset,
  recordSighting,
  getSightingsByAsset,
  getRecentSightings,
  initAssetsStore,
} from "./assets-store.js";

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

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return request.ip ?? "unknown";
}

export async function registerAssetsRoutes(app: FastifyInstance): Promise<void> {
  initAssetsStore();

  app.get("/api/assets", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { site_id?: string };
    const assets = q.site_id ? getAssetsBySite(q.site_id) : getAllAssets();
    return reply.status(200).send({ ok: true, assets });
  });

  app.get("/api/assets/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const asset = getAssetById(id);
    if (!asset) return reply.status(404).send({ ok: false, error: "Activo no encontrado." });
    return reply.status(200).send({ ok: true, asset });
  });

  app.post("/api/assets", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body as { name?: string; description?: string; beaconId?: string; siteId?: string };
    if (!body.name?.trim() || !body.beaconId?.trim() || !body.siteId?.trim()) {
      return reply.status(400).send({ ok: false, error: "name, beaconId y siteId son requeridos." });
    }
    const asset = createAsset(
      {
        name: body.name.trim(),
        description: body.description?.trim() || "",
        beaconId: body.beaconId.trim(),
        siteId: body.siteId.trim(),
      },
      { ip: getClientIp(request), userId: user.sub ?? undefined, userEmail: user.email }
    );
    return reply.status(201).send({ ok: true, asset });
  });

  app.delete("/api/assets/:id", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const deleted = deleteAsset(id, {
      ip: getClientIp(request),
      userId: user.sub,
      userEmail: user.email,
    });
    if (!deleted) return reply.status(404).send({ ok: false, error: "Activo no encontrado." });
    return reply.status(200).send({ ok: true });
  });

  app.post("/api/assets/sighting", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { assetId?: string; metadata?: string };
    if (!body.assetId?.trim()) {
      return reply.status(400).send({ ok: false, error: "assetId es requerido." });
    }
    const sighting = recordSighting(body.assetId.trim(), body.metadata?.trim());
    if (!sighting) return reply.status(404).send({ ok: false, error: "Activo no encontrado." });
    return reply.status(201).send({ ok: true, sighting });
  });

  app.get("/api/assets/:id/sightings", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const q = request.query as { limit?: string };
    const limit = Math.min(Number(q.limit) || 100, 500);
    const sightings = getSightingsByAsset(id, limit);
    return reply.status(200).send({ ok: true, sightings });
  });

  app.get("/api/assets/sightings/recent", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { limit?: string };
    const limit = Math.min(Number(q.limit) || 50, 200);
    const sightings = getRecentSightings(limit);
    return reply.status(200).send({ ok: true, sightings });
  });
}
