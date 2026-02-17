/**
 * GURU Incidents — Registro de incidentes y playbooks.
 * Persistencia en JSON (GURU_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.GURU_DATA_PATH || path.join(process.cwd(), "data");
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

const DEFAULT_PLAYBOOKS: Omit<Playbook, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Brecha de datos", description: "Procedimiento ante posible filtración de datos personales", steps: ["Contener acceso", "Evaluar alcance", "Notificar DPA en 72h si aplica", "Documentar y cerrar"] },
  { name: "Malware / ransomware", description: "Respuesta ante detección de malware o ransomware", steps: ["Aislar sistemas afectados", "Identificar vector", "Eliminar y recuperar", "Post-mortem"] },
  { name: "Phishing / suplantación", description: "Respuesta ante campaña de phishing o suplantación de identidad", steps: ["Identificar y bloquear correos/URLs", "Avisar a afectados", "Cambiar credenciales comprometidas", "Registrar y reportar"] },
  { name: "DDoS / denegación de servicio", description: "Respuesta ante ataque de denegación de servicio", steps: ["Detectar y clasificar tráfico", "Activar mitigación (CDN/firewall)", "Comunicar a usuarios si hay indisponibilidad", "Post-incidente con proveedor"] },
  { name: "Acceso no autorizado / intrusión", description: "Respuesta ante acceso no autorizado a sistemas o datos", steps: ["Contener sesión y aislar sistemas", "Preservar evidencias (logs)", "Identificar alcance y datos afectados", "Notificar si aplica y cerrar brecha"] },
  { name: "Pérdida o robo de dispositivo", description: "Procedimiento ante pérdida o robo de equipo con datos corporativos", steps: ["Bloquear acceso remoto y revocar credenciales", "Evaluar datos en el dispositivo", "Notificar brecha si hay datos personales", "Documentar y reforzar políticas"] },
  { name: "Exposición accidental de datos", description: "Datos expuestos por error de configuración, envío erróneo o publicación indebida", steps: ["Retirar o restringir acceso de inmediato", "Evaluar alcance y afectados", "Notificar a autoridad e interesados si procede", "Corregir proceso y documentar"] },
];

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
    playbooks = DEFAULT_PLAYBOOKS.map((d, i) => ({
      ...d,
      id: `pb-${i + 1}`,
      createdAt: now,
      updatedAt: now,
    }));
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

/** Añade los playbooks por defecto que no existan (por nombre). */
export function seedMissingPlaybooks(): Playbook[] {
  if (playbooks.length === 0) playbooks = loadPlaybooks();
  const existingNames = new Set(playbooks.map((p) => p.name));
  const now = new Date().toISOString();
  const added: Playbook[] = [];
  DEFAULT_PLAYBOOKS.forEach((d, i) => {
    if (existingNames.has(d.name)) return;
    const id = `pb-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
    const p: Playbook = { ...d, id, createdAt: now, updatedAt: now };
    playbooks.push(p);
    added.push(p);
    existingNames.add(d.name);
  });
  if (added.length > 0) savePlaybooks();
  return added;
}
