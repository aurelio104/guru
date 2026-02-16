/**
 * APlat Security — API de vulnerabilidades y escaneos.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import {
  getAllVulnerabilities,
  getVulnerabilityById,
  createVulnerability,
  updateVulnerability,
  deleteVulnerability,
  getAllScans,
  getScanById,
  createScan,
  updateScan,
  initSecurityStore,
} from "./security-store.js";
import type { VulnerabilitySeverity, VulnerabilityStatus } from "./security-store.js";

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

export async function registerSecurityRoutes(app: FastifyInstance): Promise<void> {
  initSecurityStore();

  app.get("/api/security/vulnerabilities", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const vulns = getAllVulnerabilities();
    return reply.status(200).send({ ok: true, vulnerabilities: vulns });
  });

  app.get("/api/security/vulnerabilities/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const v = getVulnerabilityById(id);
    if (!v) return reply.status(404).send({ ok: false, error: "Vulnerabilidad no encontrada." });
    return reply.status(200).send({ ok: true, vulnerability: v });
  });

  app.post("/api/security/vulnerabilities", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body as {
      title: string;
      severity: VulnerabilitySeverity;
      description: string;
      cve?: string;
      status?: VulnerabilityStatus;
      asset?: string;
    };
    if (!body.title || !body.severity || !body.description) {
      return reply.status(400).send({ ok: false, error: "Faltan title, severity o description." });
    }
    const v = createVulnerability({
      title: body.title,
      severity: body.severity,
      description: body.description,
      cve: body.cve,
      status: body.status,
      asset: body.asset,
    });
    return reply.status(201).send({ ok: true, vulnerability: v });
  });

  app.patch("/api/security/vulnerabilities/:id", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      title: string;
      severity: VulnerabilitySeverity;
      description: string;
      cve: string;
      status: VulnerabilityStatus;
      asset: string;
    }>;
    const v = updateVulnerability(id, body);
    if (!v) return reply.status(404).send({ ok: false, error: "Vulnerabilidad no encontrada." });
    return reply.status(200).send({ ok: true, vulnerability: v });
  });

  app.delete("/api/security/vulnerabilities/:id", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const deleted = deleteVulnerability(id);
    if (!deleted) return reply.status(404).send({ ok: false, error: "Vulnerabilidad no encontrada." });
    return reply.status(200).send({ ok: true });
  });

  app.get("/api/security/scans", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllScans();
    return reply.status(200).send({ ok: true, scans: list });
  });

  app.get("/api/security/scans/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const s = getScanById(id);
    if (!s) return reply.status(404).send({ ok: false, error: "Escaneo no encontrado." });
    return reply.status(200).send({ ok: true, scan: s });
  });

  app.post("/api/security/scan", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = (request.body as { type?: "manual" | "scheduled" }) ?? {};
    const type = body.type ?? "manual";
    const scan = createScan(type);
    // Simular ejecución asíncrona: en un producto real aquí se lanzaría un job.
    setTimeout(() => {
      updateScan(scan.id, {
        status: "running",
      });
      setTimeout(() => {
        const openCount = getAllVulnerabilities().filter((v) => v.status === "open").length;
        updateScan(scan.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          findingsCount: openCount,
        });
      }, 1500);
    }, 0);
    return reply.status(201).send({ ok: true, scan });
  });
}
