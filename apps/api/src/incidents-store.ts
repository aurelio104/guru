/**
 * APlat Incidents — Registro de incidentes y playbooks.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const INCIDENTS_FILE = path.join(DATA_DIR, "incidents.json");
const PLAYBOOKS_FILE = path.join(DATA_DIR, "incident-playbooks.json");

export type IncidentStatus = "open" | "investigating" | "contained" | "resolved" | "closed";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type Incident = {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  playbookId?: string;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string;
};

export type Playbook = {
  id: string;
  name: string;
  description: string;
  steps: string[];
  createdAt: string;
  updatedAt: string;
};

let incidents: Incident[] = [];
let playbooks: Playbook[] = [];

function loadIncidents(): Incident[] {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      const raw = fs.readFileSync(INCIDENTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function loadPlaybooks(): Playbook[] {
  try {
    if (fs.existsSync(PLAYBOOKS_FILE)) {
      const raw = fs.readFileSync(PLAYBOOKS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveIncidents(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2), "utf-8");
  } catch (err) {
    console.warn("[incidents-store] No se pudo guardar incidentes:", err);
  }
}

function savePlaybooks(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PLAYBOOKS_FILE, JSON.stringify(playbooks, null, 2), "utf-8");
  } catch (err) {
    console.warn("[incidents-store] No se pudo guardar playbooks:", err);
  }
}

export function initIncidentsStore(): void {
  incidents = loadIncidents();
  playbooks = loadPlaybooks();
  if (playbooks.length === 0) {
    const now = new Date().toISOString();
    playbooks = [
      {
        id: "pb-1",
        name: "Brecha de datos",
        description: "Procedimiento ante posible filtración de datos personales",
        steps: ["Contener acceso", "Evaluar alcance", "Notificar DPA en 72h si aplica", "Documentar y cerrar"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "pb-2",
        name: "Malware / ransomware",
        description: "Respuesta ante detección de malware o ransomware",
        steps: ["Aislar sistemas afectados", "Identificar vector", "Eliminar y recuperar", "Post-mortem"],
        createdAt: now,
        updatedAt: now,
      },
    ];
    savePlaybooks();
  }
  console.log("[incidents-store] Cargado:", incidents.length, "incidentes,", playbooks.length, "playbooks");
}

export function getAllIncidents(): Incident[] {
  if (incidents.length === 0 && fs.existsSync(INCIDENTS_FILE)) incidents = loadIncidents();
  return [...incidents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getIncidentById(id: string): Incident | undefined {
  if (incidents.length === 0) incidents = loadIncidents();
  return incidents.find((i) => i.id === id);
}

export function createIncident(opts: {
  title: string;
  description: string;
  severity: IncidentSeverity;
  playbookId?: string;
}): Incident {
  if (incidents.length === 0) incidents = loadIncidents();
  const now = new Date().toISOString();
  const id = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const inc: Incident = {
    id,
    title: opts.title,
    description: opts.description,
    severity: opts.severity,
    status: "open",
    playbookId: opts.playbookId,
    reportedAt: now,
    updatedAt: now,
  };
  incidents.push(inc);
  saveIncidents();
  return inc;
}

export function updateIncident(
  id: string,
  updates: Partial<Pick<Incident, "status" | "notes" | "resolvedAt">>
): Incident | undefined {
  if (incidents.length === 0) incidents = loadIncidents();
  const idx = incidents.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  incidents[idx] = { ...incidents[idx], ...updates, updatedAt: now };
  saveIncidents();
  return incidents[idx];
}

export function getAllPlaybooks(): Playbook[] {
  if (playbooks.length === 0 && fs.existsSync(PLAYBOOKS_FILE)) playbooks = loadPlaybooks();
  return [...playbooks];
}

export function getPlaybookById(id: string): Playbook | undefined {
  if (playbooks.length === 0) playbooks = loadPlaybooks();
  return playbooks.find((p) => p.id === id);
}
