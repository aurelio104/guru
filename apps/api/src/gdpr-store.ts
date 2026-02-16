/**
 * APlat GDPR/LOPD — Checklist de cumplimiento.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const GDPR_FILE = path.join(DATA_DIR, "gdpr-checklist.json");

export type GdprItemStatus = "pending" | "in_progress" | "done" | "na";

export type GdprChecklistItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: GdprItemStatus;
  notes?: string;
  updatedAt: string;
};

let items: GdprChecklistItem[] = [];

const DEFAULT_ITEMS: Omit<GdprChecklistItem, "id" | "updatedAt">[] = [
  { category: "legal", title: "Registro de actividades de tratamiento", description: "Documentar tratamientos de datos personales", status: "pending" },
  { category: "legal", title: "Base legal y finalidad", description: "Definir base legal y finalidad por tratamiento", status: "pending" },
  { category: "rights", title: "Derecho de acceso", description: "Procedimiento para ejercer derecho de acceso", status: "pending" },
  { category: "rights", title: "Derecho de rectificación", description: "Procedimiento de rectificación de datos", status: "pending" },
  { category: "rights", title: "Derecho de supresión", description: "Procedimiento de derecho al olvido", status: "pending" },
  { category: "rights", title: "Derecho de portabilidad", description: "Exportación de datos en formato estructurado", status: "pending" },
  { category: "security", title: "Cifrado de datos sensibles", description: "Cifrado en reposo y en tránsito", status: "pending" },
  { category: "security", title: "Control de acceso", description: "Política de permisos y MFA", status: "pending" },
  { category: "security", title: "Auditorías periódicas", description: "Revisiones de cumplimiento y seguridad", status: "pending" },
  { category: "breach", title: "Procedimiento de brecha", description: "Notificación a autoridad en 72h si procede", status: "pending" },
];

function load(): GdprChecklistItem[] {
  try {
    if (fs.existsSync(GDPR_FILE)) {
      const raw = fs.readFileSync(GDPR_FILE, "utf-8");
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
    fs.writeFileSync(GDPR_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[gdpr-store] No se pudo guardar:", err);
  }
}

export function initGdprStore(): void {
  items = load();
  if (items.length === 0) {
    const now = new Date().toISOString();
    items = DEFAULT_ITEMS.map((d, i) => ({
      ...d,
      id: `gdpr-${i + 1}`,
      updatedAt: now,
    }));
    save();
  }
  console.log("[gdpr-store] Cargado:", items.length, "ítems");
}

export function getGdprChecklist(): GdprChecklistItem[] {
  if (items.length === 0 && fs.existsSync(GDPR_FILE)) items = load();
  return [...items].sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
}

export function updateGdprItem(
  id: string,
  updates: Partial<Pick<GdprChecklistItem, "status" | "notes">>
): GdprChecklistItem | undefined {
  if (items.length === 0) items = load();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx], ...updates, updatedAt: now };
  save();
  return items[idx];
}
