/**
 * GURU Reports — Reportes y metadatos.
 * Persistencia en JSON (GURU_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.GURU_DATA_PATH || path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

export type Report = {
  id: string;
  title: string;
  description?: string;
  type: "manual" | "scheduled" | "export";
  status: "draft" | "generating" | "ready" | "failed";
  filePath?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

let reports: Report[] = [];

function load(): Report[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = fs.readFileSync(REPORTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function save(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    console.warn("[reports-store] No se pudo guardar:", err);
  }
}

export function initReportsStore(): void {
  reports = load();
  console.log("[reports-store] Cargado:", reports.length, "reportes");
}

export function getAllReports(): Report[] {
  if (reports.length === 0 && fs.existsSync(REPORTS_FILE)) reports = load();
  return [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getReportById(id: string): Report | undefined {
  if (reports.length === 0) reports = load();
  return reports.find((r) => r.id === id);
}

export function createReport(opts: {
  title: string;
  description?: string;
  type?: Report["type"];
  createdBy?: string;
}): Report {
  if (reports.length === 0) reports = load();
  const now = new Date().toISOString();
  const id = `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const r: Report = {
    id,
    title: opts.title,
    description: opts.description,
    type: opts.type ?? "manual",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    createdBy: opts.createdBy,
  };
  reports.push(r);
  save();
  return r;
}

export function updateReport(
  id: string,
  updates: Partial<Pick<Report, "title" | "description" | "status" | "filePath">>
): Report | undefined {
  if (reports.length === 0) reports = load();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  reports[idx] = { ...reports[idx], ...updates, updatedAt: now };
  save();
  return reports[idx];
}

export function deleteReport(id: string): boolean {
  if (reports.length === 0) reports = load();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  reports.splice(idx, 1);
  save();
  return true;
}
