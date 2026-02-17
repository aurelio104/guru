/**
 * GURU Reports — API reportes.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import * as XLSX from "xlsx";
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  initReportsStore,
} from "./reports-store.js";

type AuthPayload = { sub?: string; email?: string; role?: string };

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

export async function registerReportsRoutes(app: FastifyInstance): Promise<void> {
  initReportsStore();

  app.get("/api/reports", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllReports();
    return reply.status(200).send({ ok: true, reports: list });
  });

  app.get("/api/reports/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const r = getReportById(id);
    if (!r) return reply.status(404).send({ ok: false, error: "Reporte no encontrado." });
    return reply.status(200).send({ ok: true, report: r });
  });

  app.post("/api/reports", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { title: string; description?: string; type?: "manual" | "scheduled" | "export" };
    if (!body.title) return reply.status(400).send({ ok: false, error: "Falta title." });
    const r = createReport({
      title: body.title,
      description: body.description,
      type: body.type,
      createdBy: user.email,
    });
    return reply.status(201).send({ ok: true, report: r });
  });

  app.patch("/api/reports/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{ title: string; description: string; status: "draft" | "generating" | "ready" | "failed" }>;
    const r = updateReport(id, body);
    if (!r) return reply.status(404).send({ ok: false, error: "Reporte no encontrado." });
    return reply.status(200).send({ ok: true, report: r });
  });

  app.delete("/api/reports/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const ok = deleteReport(id);
    if (!ok) return reply.status(404).send({ ok: false, error: "Reporte no encontrado." });
    return reply.status(200).send({ ok: true });
  });

  app.post("/api/reports/upload-excel", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const data = await request.file();
    if (!data) return reply.status(400).send({ ok: false, error: "Falta el archivo." });
    const buffer = await data.toBuffer();
    try {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) return reply.status(400).send({ ok: false, error: "Excel sin hojas." });
      const sheet = wb.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      const columns = (rows[0] ?? []).map((c, i) => (typeof c === "string" && c.trim() ? c.trim() : `Columna ${i + 1}`));
      const maxRows = 500;
      const dataRows = rows.slice(1, maxRows + 1).map((row) => {
        const obj: Record<string, string | number> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i] != null ? row[i] : "";
        });
        return obj;
      });
      const report = createReport({
        title: data.filename ?? "Importación Excel",
        description: `${columns.length} columnas, ${rows.length - 1} filas`,
        type: "manual",
        createdBy: user.email,
      });
      updateReport(report.id, { status: "ready" });
      return reply.status(200).send({
        ok: true,
        reportId: report.id,
        columns,
        rows: dataRows,
        totalRows: rows.length - 1,
      });
    } catch (err) {
      return reply.status(400).send({
        ok: false,
        error: err instanceof Error ? err.message : "Error al procesar el Excel.",
      });
    }
  });
}
