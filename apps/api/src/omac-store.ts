/**
 * Geofencing Omac — Órdenes de trabajo con punto de llegada.
 * Persistencia JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const OMAC_FILE = path.join(DATA_DIR, "omac-orders.json");

export type OmacOrderStatus = "pending" | "in_progress" | "arrived" | "completed" | "cancelled";

export type OmacOrder = {
  id: string;
  title: string;
  targetLat: number;
  targetLng: number;
  radiusM: number;
  status: OmacOrderStatus;
  createdAt: string;
  updatedAt: string;
  arrivedAt?: string;
};

let orders: OmacOrder[] = [];

function load(): OmacOrder[] {
  try {
    if (fs.existsSync(OMAC_FILE)) {
      const raw = fs.readFileSync(OMAC_FILE, "utf-8");
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
    fs.writeFileSync(OMAC_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.warn("[omac-store] No se pudo guardar:", err);
  }
}

export function initOmacStore(): void {
  orders = load();
  console.log("[omac-store] Cargado:", orders.length, "órdenes");
}

export function getAllOrders(): OmacOrder[] {
  if (orders.length === 0 && fs.existsSync(OMAC_FILE)) orders = load();
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrderById(id: string): OmacOrder | undefined {
  if (orders.length === 0) orders = load();
  return orders.find((o) => o.id === id);
}

export function createOrder(opts: {
  title: string;
  targetLat: number;
  targetLng: number;
  radiusM?: number;
}): OmacOrder {
  if (orders.length === 0) orders = load();
  const now = new Date().toISOString();
  const id = `omac-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const order: OmacOrder = {
    id,
    title: opts.title,
    targetLat: opts.targetLat,
    targetLng: opts.targetLng,
    radiusM: opts.radiusM ?? 100,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  orders.push(order);
  save();
  return order;
}

export function updateOrderStatus(id: string, status: OmacOrderStatus, arrivedAt?: string): OmacOrder | undefined {
  if (orders.length === 0) orders = load();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: now,
    ...(arrivedAt ? { arrivedAt } : {}),
  };
  save();
  return orders[idx];
}
