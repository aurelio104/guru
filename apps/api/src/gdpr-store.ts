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
  // Brecha (art. 33, 34, LOPD)
  { category: "breach", title: "Procedimiento de brecha", description: "Notificación a autoridad en 72h si procede", status: "pending" },
  { category: "breach", title: "Registro de brechas e incidencias", description: "Libro de incidencias de seguridad (art. 33.5)", status: "pending" },
  { category: "breach", title: "Comunicación al interesado", description: "Informar a los afectados cuando la brecha suponga alto riesgo", status: "pending" },
  // Legal / Transparencia
  { category: "legal", title: "Registro de actividades de tratamiento", description: "Documentar tratamientos de datos personales (art. 30)", status: "pending" },
  { category: "legal", title: "Base legal y finalidad", description: "Definir base legal y finalidad por tratamiento", status: "pending" },
  { category: "legal", title: "Información al interesado", description: "Art. 13/14: qué datos, para qué, base legal, plazo, derechos, reclamación AEPD", status: "pending" },
  { category: "legal", title: "Consentimiento y registro", description: "Registro de consentimientos y procedimiento de retirada cuando sea base legal", status: "pending" },
  { category: "legal", title: "Contratos con encargados (art. 28)", description: "DPA con procesadores que traten datos por cuenta del responsable", status: "pending" },
  { category: "legal", title: "Evaluación de impacto (EIPD)", description: "Art. 35: cuando el tratamiento suponga alto riesgo para derechos", status: "pending" },
  { category: "legal", title: "Delegado de Protección de Datos (DPO)", description: "Designación y contacto cuando sea obligatorio (art. 37)", status: "pending" },
  // Derechos (cap. III RGPD)
  { category: "rights", title: "Derecho de acceso", description: "Procedimiento para ejercer derecho de acceso (art. 15)", status: "pending" },
  { category: "rights", title: "Derecho de rectificación", description: "Procedimiento de rectificación de datos (art. 16)", status: "pending" },
  { category: "rights", title: "Derecho de supresión", description: "Procedimiento de derecho al olvido (art. 17)", status: "pending" },
  { category: "rights", title: "Derecho de portabilidad", description: "Exportación de datos en formato estructurado (art. 20)", status: "pending" },
  { category: "rights", title: "Derecho de oposición", description: "Art. 21: oponerse al tratamiento en determinados casos", status: "pending" },
  { category: "rights", title: "Derecho de limitación", description: "Art. 18: limitar el tratamiento cuando lo solicite el interesado", status: "pending" },
  { category: "rights", title: "Canal de ejercicio de derechos", description: "Medios para que los interesados ejerzan sus derechos (plazo 1 mes)", status: "pending" },
  // Seguridad (art. 32, LOPD)
  { category: "security", title: "Cifrado de datos sensibles", description: "Cifrado en reposo y en tránsito", status: "pending" },
  { category: "security", title: "Control de acceso", description: "Política de permisos y MFA", status: "pending" },
  { category: "security", title: "Auditorías periódicas", description: "Revisiones de cumplimiento y seguridad", status: "pending" },
  { category: "security", title: "Pseudonimización y minimización", description: "Minimizar datos y pseudonimizar cuando reduzca riesgos", status: "pending" },
  { category: "security", title: "Deber de secreto", description: "Confidencialidad (LOPD): solo acceso autorizado a datos personales", status: "pending" },
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

/** Añade los ítems por defecto que aún no existan (por título). Devuelve los añadidos. */
export function seedMissingDefaults(): GdprChecklistItem[] {
  if (items.length === 0) items = load();
  const existingTitles = new Set(items.map((i) => i.title));
  const now = new Date().toISOString();
  const added: GdprChecklistItem[] = [];
  for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
    const d = DEFAULT_ITEMS[i];
    if (existingTitles.has(d.title)) continue;
    const id = `gdpr-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
    const item: GdprChecklistItem = { ...d, id, updatedAt: now };
    items.push(item);
    added.push(item);
    existingTitles.add(d.title);
  }
  if (added.length > 0) save();
  return added;
}
