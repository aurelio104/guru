/**
 * Catálogo de servicios del ecosistema APlat (para paquetes y membresías B2B).
 * Persistencia en JSON; mismo directorio APLAT_DATA_PATH.
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const CATALOG_FILE = path.join(DATA_DIR, "service-catalog.json");

export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceOneTime: number;
  priceMonthly: number;
  active: boolean;
  order: number;
};

let catalog: CatalogService[] = [];

const DEFAULT_SERVICES: CatalogService[] = [
  { id: "1", name: "Presence", slug: "presence", description: "Check-in BLE/NFC, zonas, portal, ocupación, alertas WhatsApp, export", priceOneTime: 0, priceMonthly: 99, active: true, order: 1 },
  { id: "2", name: "Ciberseguridad", slug: "ciberseguridad", description: "APlat Security, GDPR/LOPD, incidentes, verificación firma, Jcloud", priceOneTime: 150, priceMonthly: 79, active: true, order: 2 },
  { id: "3", name: "Reportes", slug: "reportes", description: "Subida Excel, análisis, gráficos, dashboard reportes", priceOneTime: 0, priceMonthly: 49, active: true, order: 3 },
  { id: "4", name: "Commerce", slug: "commerce", description: "Catálogo, pedidos, bot WhatsApp opcional", priceOneTime: 100, priceMonthly: 89, active: true, order: 4 },
  { id: "5", name: "Slots", slug: "slots", description: "Reserva de recursos y slots, disponibilidad", priceOneTime: 0, priceMonthly: 39, active: true, order: 5 },
  { id: "6", name: "Geofencing", slug: "geofencing", description: "Validación lat/lng en radio (órdenes de trabajo)", priceOneTime: 50, priceMonthly: 29, active: true, order: 6 },
  { id: "7", name: "Web Push / PWA", slug: "web-push-pwa", description: "Notificaciones push, offline, Background Sync", priceOneTime: 0, priceMonthly: 19, active: true, order: 7 },
  { id: "8", name: "Otros", slug: "otros", description: "OCR cédulas, verify firma, integraciones", priceOneTime: 0, priceMonthly: 0, active: true, order: 8 },
];

function loadCatalog(): CatalogService[] {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as CatalogService[];
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_SERVICES];
}

function saveCatalog(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf-8");
  } catch (err) {
    console.warn("[catalog-store] No se pudo guardar catálogo:", err);
  }
}

export function initCatalogStore(): void {
  catalog = loadCatalog();
  if (catalog.length === 0) catalog = [...DEFAULT_SERVICES];
  saveCatalog();
  console.log("[catalog-store] Catálogo cargado:", catalog.length, "servicios");
}

export function getCatalogServices(): CatalogService[] {
  if (catalog.length === 0) catalog = loadCatalog();
  return catalog.filter((s) => s.active).sort((a, b) => a.order - b.order);
}

export function getCatalogServiceById(id: string): CatalogService | undefined {
  if (catalog.length === 0) catalog = loadCatalog();
  return catalog.find((s) => s.id === id);
}

export type QuoteResult = {
  ok: true;
  items: Array<{ id: string; name: string; priceOneTime: number; priceMonthly: number }>;
  totalOneTime: number;
  totalMonthly: number;
};

export function getQuote(ids: string[]): QuoteResult {
  if (catalog.length === 0) catalog = loadCatalog();
  const items: QuoteResult["items"] = [];
  let totalOneTime = 0;
  let totalMonthly = 0;
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    const svc = catalog.find((s) => s.id === id && s.active);
    if (svc) {
      seen.add(id);
      items.push({
        id: svc.id,
        name: svc.name,
        priceOneTime: svc.priceOneTime,
        priceMonthly: svc.priceMonthly,
      });
      totalOneTime += svc.priceOneTime;
      totalMonthly += svc.priceMonthly;
    }
  }
  return { ok: true, items, totalOneTime, totalMonthly };
}

export function updateCatalogService(id: string, patch: Partial<CatalogService>): CatalogService | null {
  if (catalog.length === 0) catalog = loadCatalog();
  const idx = catalog.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  catalog[idx] = { ...catalog[idx], ...patch };
  saveCatalog();
  return catalog[idx];
}
