/**
 * APlat Incidents — API incidentes y playbooks.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  getAllPlaybooks,
  getPlaybookById,
  initIncidentsStore,
} from "./incidents-store.js";
import type { IncidentSeverity, IncidentStatus } from "./incidents-store.js";

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

export async function registerIncidentsRoutes(app: FastifyInstance): Promise<void> {
  initIncidentsStore();

  app.get("/api/incidents/playbooks", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllPlaybooks();
    return reply.status(200).send({ ok: true, playbooks: list });
  });

  app.get("/api/incidents/playbooks/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const p = getPlaybookById(id);
    if (!p) return reply.status(404).send({ ok: false, error: "Playbook no encontrado." });
    return reply.status(200).send({ ok: true, playbook: p });
  });

  app.get("/api/incidents", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllIncidents();
    return reply.status(200).send({ ok: true, incidents: list });
  });

  app.get("/api/incidents/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const inc = getIncidentById(id);
    if (!inc) return reply.status(404).send({ ok: false, error: "Incidente no encontrado." });
    return reply.status(200).send({ ok: true, incident: inc });
  });

  app.post("/api/incidents", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { title: string; description: string; severity: IncidentSeverity; playbookId?: string };
    if (!body.title || !body.description || !body.severity) {
      return reply.status(400).send({ ok: false, error: "Faltan title, description o severity." });
    }
    const inc = createIncident({
      title: body.title,
      description: body.description,
      severity: body.severity,
      playbookId: body.playbookId,
    });
    return reply.status(201).send({ ok: true, incident: inc });
  });

  app.patch("/api/incidents/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const body = request.body as { status?: IncidentStatus; notes?: string; resolvedAt?: string };
    const inc = updateIncident(id, body);
    if (!inc) return reply.status(404).send({ ok: false, error: "Incidente no encontrado." });
    return reply.status(200).send({ ok: true, incident: inc });
  });
}
