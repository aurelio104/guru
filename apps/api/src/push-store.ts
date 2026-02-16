/**
 * APlat Web Push — Suscripciones guardadas.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const PUSH_FILE = path.join(DATA_DIR, "push-subscriptions.json");

export type PushSubscriptionRecord = {
  id: string;
  userId?: string;
  userEmail?: string;
  endpoint: string;
  keys: { auth: string; p256dh: string };
  userAgent?: string;
  createdAt: string;
};

let subscriptions: PushSubscriptionRecord[] = [];

function load(): PushSubscriptionRecord[] {
  try {
    if (fs.existsSync(PUSH_FILE)) {
      const raw = fs.readFileSync(PUSH_FILE, "utf-8");
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
    fs.writeFileSync(PUSH_FILE, JSON.stringify(subscriptions, null, 2), "utf-8");
  } catch (err) {
    console.warn("[push-store] No se pudo guardar:", err);
  }
}

export function initPushStore(): void {
  subscriptions = load();
  console.log("[push-store] Cargado:", subscriptions.length, "suscripciones");
}

export function addSubscription(
  sub: { endpoint: string; keys: { auth: string; p256dh: string }; userAgent?: string },
  user?: { id?: string; email?: string }
): PushSubscriptionRecord {
  if (subscriptions.length === 0) subscriptions = load();
  const existing = subscriptions.find((s) => s.endpoint === sub.endpoint);
  if (existing) {
    existing.userId = user?.id;
    existing.userEmail = user?.email;
    existing.keys = sub.keys;
    existing.userAgent = sub.userAgent;
    save();
    return existing;
  }
  const now = new Date().toISOString();
  const id = `push-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record: PushSubscriptionRecord = {
    id,
    userId: user?.id,
    userEmail: user?.email,
    endpoint: sub.endpoint,
    keys: sub.keys,
    userAgent: sub.userAgent,
    createdAt: now,
  };
  subscriptions.push(record);
  save();
  return record;
}

export function getAllSubscriptions(): PushSubscriptionRecord[] {
  if (subscriptions.length === 0 && fs.existsSync(PUSH_FILE)) subscriptions = load();
  return [...subscriptions];
}

export function getSubscriptionsByUser(userId: string): PushSubscriptionRecord[] {
  return getAllSubscriptions().filter((s) => s.userId === userId);
}

export function removeSubscription(endpoint: string): boolean {
  if (subscriptions.length === 0) subscriptions = load();
  const idx = subscriptions.findIndex((s) => s.endpoint === endpoint);
  if (idx === -1) return false;
  subscriptions.splice(idx, 1);
  save();
  return true;
}
