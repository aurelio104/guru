/**
 * GURU Slots — Recursos y reserva de slots.
 * Persistencia en JSON (GURU_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.GURU_DATA_PATH || path.join(process.cwd(), "data");
const RESOURCES_FILE = path.join(DATA_DIR, "slots-resources.json");
const SLOTS_FILE = path.join(DATA_DIR, "slots-bookings.json");

export type SlotResource = {
  id: string;
  name: string;
  description: string;
  slotDurationMinutes: number;
  capacity?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SlotBooking = {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  userId?: string;
  userEmail?: string;
  title?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

let resources: SlotResource[] = [];
let bookings: SlotBooking[] = [];

function loadResources(): SlotResource[] {
  try {
    if (fs.existsSync(RESOURCES_FILE)) {
      const raw = fs.readFileSync(RESOURCES_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function loadBookings(): SlotBooking[] {
  try {
    if (fs.existsSync(SLOTS_FILE)) {
      const raw = fs.readFileSync(SLOTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveResources(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2), "utf-8");
  } catch (err) {
    console.warn("[slots-store] No se pudo guardar resources:", err);
  }
}

function saveBookings(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (err) {
    console.warn("[slots-store] No se pudo guardar bookings:", err);
  }
}

export function initSlotsStore(): void {
  resources = loadResources();
  bookings = loadBookings();
  console.log("[slots-store] Cargado:", resources.length, "recursos,", bookings.length, "reservas");
}

export function getAllResources(): SlotResource[] {
  if (resources.length === 0 && fs.existsSync(RESOURCES_FILE)) resources = loadResources();
  return [...resources].sort((a, b) => a.name.localeCompare(b.name));
}

export function getResourceById(id: string): SlotResource | undefined {
  if (resources.length === 0) resources = loadResources();
  return resources.find((r) => r.id === id);
}

export function createResource(opts: {
  name: string;
  description?: string;
  slotDurationMinutes: number;
  capacity?: number;
}): SlotResource {
  if (resources.length === 0) resources = loadResources();
  const now = new Date().toISOString();
  const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const r: SlotResource = {
    id,
    name: opts.name,
    description: opts.description ?? "",
    slotDurationMinutes: opts.slotDurationMinutes,
    capacity: opts.capacity,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  resources.push(r);
  saveResources();
  return r;
}

export function getBookingsByResource(resourceId: string, from?: string, to?: string): SlotBooking[] {
  if (bookings.length === 0 && fs.existsSync(SLOTS_FILE)) bookings = loadBookings();
  let list = bookings.filter((b) => b.resourceId === resourceId && b.status !== "cancelled");
  if (from) list = list.filter((b) => b.startAt >= from);
  if (to) list = list.filter((b) => b.endAt <= to);
  return list.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function createBooking(opts: {
  resourceId: string;
  startAt: string;
  endAt: string;
  userId?: string;
  userEmail?: string;
  title?: string;
}): SlotBooking | { error: string } {
  if (bookings.length === 0) bookings = loadBookings();
  const resource = getResourceById(opts.resourceId);
  if (!resource) return { error: "Recurso no encontrado." };
  const conflicting = bookings.filter(
    (b) =>
      b.resourceId === opts.resourceId &&
      b.status !== "cancelled" &&
      ((opts.startAt >= b.startAt && opts.startAt < b.endAt) ||
        (opts.endAt > b.startAt && opts.endAt <= b.endAt) ||
        (opts.startAt <= b.startAt && opts.endAt >= b.endAt))
  );
  if (conflicting.length > 0) return { error: "Solapamiento con otra reserva." };
  const now = new Date().toISOString();
  const id = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const b: SlotBooking = {
    id,
    resourceId: opts.resourceId,
    startAt: opts.startAt,
    endAt: opts.endAt,
    userId: opts.userId,
    userEmail: opts.userEmail,
    title: opts.title,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  };
  bookings.push(b);
  saveBookings();
  return b;
}

export function cancelBooking(id: string): boolean {
  if (bookings.length === 0) bookings = loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  bookings[idx].status = "cancelled";
  bookings[idx].updatedAt = new Date().toISOString();
  saveBookings();
  return true;
}

export function getRecentBookings(limit = 50): SlotBooking[] {
  if (bookings.length === 0 && fs.existsSync(SLOTS_FILE)) bookings = loadBookings();
  return [...bookings]
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .slice(0, limit);
}
