/**
 * Almacén de clientes, perfiles, códigos de verificación y suscripciones.
 * Persistencia en SQLite (un solo archivo, mínimo recurso; en Koyeb usar volumen en APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "aplat.db");

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error("[clients-store] No se pudo crear directorio de datos:", dir, err);
    throw err;
  }
  try {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
    migrateFromJsonIfNeeded(dbInstance);
    return dbInstance;
  } catch (err) {
    console.error("[clients-store] Error al abrir SQLite:", DB_PATH, err);
    throw err;
  }
}

function initSchema(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS profiles (
      client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
      nombres TEXT NOT NULL DEFAULT '',
      apellidos TEXT NOT NULL DEFAULT '',
      identidad TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      telefono_verificado INTEGER NOT NULL DEFAULT 0,
      direccion TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      tipo_servicio TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS phone_codes (
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      client_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_phone_codes_client_phone ON phone_codes(client_id, phone);
    CREATE TABLE IF NOT EXISTS service_subscriptions (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      service_name TEXT NOT NULL,
      day_of_month INTEGER NOT NULL,
      amount REAL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      paid_until TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_subs_phone ON service_subscriptions(phone);
  `);
}

/** Si la DB está vacía y existen los JSON antiguos, importa una sola vez. */
function migrateFromJsonIfNeeded(d: Database.Database): void {
  const clientsCount = (d.prepare("SELECT COUNT(*) AS n FROM clients").get() as { n: number }).n;
  if (clientsCount > 0) return;
  const clientsFile = path.join(DATA_DIR, "clients.json");
  const phoneCodesFile = path.join(DATA_DIR, "phone-codes.json");
  const subsFile = path.join(DATA_DIR, "service-subscriptions.json");
  if (!fs.existsSync(clientsFile)) return;
  try {
    const clientsJson = JSON.parse(fs.readFileSync(clientsFile, "utf-8")) as Array<{
      id: string;
      email: string;
      passwordHash: string;
      role: string;
      createdAt: string;
      mustChangePassword?: boolean;
      profile?: ClientProfile;
    }>;
    const insClient = d.prepare(
      "INSERT INTO clients (id, email, password_hash, role, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const insProfile = d.prepare(
      "INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const c of clientsJson) {
      insClient.run(c.id, c.email, c.passwordHash, c.role ?? "client", c.createdAt, c.mustChangePassword ? 1 : 0);
      if (c.profile) {
        insProfile.run(
          c.id,
          c.profile.nombres ?? "",
          c.profile.apellidos ?? "",
          c.profile.identidad ?? "",
          c.profile.telefono ?? "",
          c.profile.telefonoVerificado ? 1 : 0,
          c.profile.direccion ?? "",
          c.profile.email ?? c.email,
          c.profile.tipoServicio ?? "",
          c.profile.updatedAt
        );
      }
    }
    if (fs.existsSync(phoneCodesFile)) {
      const codes = JSON.parse(fs.readFileSync(phoneCodesFile, "utf-8")) as PhoneCode[];
      const insCode = d.prepare("INSERT INTO phone_codes (phone, code, expires_at, client_id) VALUES (?, ?, ?, ?)");
      for (const p of codes) {
        if (p.expiresAt > Date.now()) insCode.run(p.phone, p.code, p.expiresAt, p.clientId);
      }
    }
    if (fs.existsSync(subsFile)) {
      const subs = JSON.parse(fs.readFileSync(subsFile, "utf-8")) as Array<ServiceSubscription & { status?: string; paidUntil?: string | null }>;
      const insSub = d.prepare(
        "INSERT INTO service_subscriptions (id, phone, service_name, day_of_month, amount, created_at, status, paid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      for (const s of subs) {
        insSub.run(
          s.id,
          s.phone,
          s.serviceName,
          s.dayOfMonth,
          s.amount ?? null,
          s.createdAt,
          s.status ?? "active",
          s.paidUntil ?? null
        );
      }
    }
    console.log("[clients-store] Migración desde JSON completada.");
  } catch (err) {
    console.warn("[clients-store] Migración desde JSON fallida:", err);
  }
}

// --- Tipos (igual que antes) ---
export type ClientProfile = {
  nombres: string;
  apellidos: string;
  identidad: string;
  telefono: string;
  telefonoVerificado: boolean;
  direccion: string;
  email: string;
  tipoServicio: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  email: string;
  passwordHash: string;
  role: "client";
  createdAt: string;
  mustChangePassword?: boolean;
  profile?: ClientProfile;
};

export type PhoneCode = {
  phone: string;
  code: string;
  expiresAt: number;
  clientId: string;
};

export type SubscriptionStatus = "active" | "suspended";

export type ServiceSubscription = {
  id: string;
  phone: string;
  serviceName: string;
  dayOfMonth: number;
  amount?: number;
  createdAt: string;
  status: SubscriptionStatus;
  paidUntil: string | null;
};

/** Normaliza teléfono para comparación (solo dígitos). */
export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}

type ClientRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  must_change_password: number;
  nombres?: string;
  apellidos?: string;
  identidad?: string;
  telefono?: string;
  telefono_verificado?: number;
  direccion?: string;
  profile_email?: string;
  tipo_servicio?: string;
  updated_at?: string;
};

function rowToClient(r: ClientRow): Client {
  const c: Client = {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    role: "client",
    createdAt: r.created_at,
    mustChangePassword: Boolean(r.must_change_password),
  };
  if (r.updated_at != null) {
    c.profile = {
      nombres: r.nombres ?? "",
      apellidos: r.apellidos ?? "",
      identidad: r.identidad ?? "",
      telefono: r.telefono ?? "",
      telefonoVerificado: Boolean(r.telefono_verificado),
      direccion: r.direccion ?? "",
      email: r.profile_email ?? r.email,
      tipoServicio: r.tipo_servicio ?? "",
      updatedAt: r.updated_at,
    };
  }
  return c;
}

export function getClientById(id: string): Client | undefined {
  const row = getDb()
    .prepare(
      `SELECT c.*, p.nombres, p.apellidos, p.identidad, p.telefono, p.telefono_verificado, p.direccion, p.email AS profile_email, p.tipo_servicio, p.updated_at
       FROM clients c LEFT JOIN profiles p ON p.client_id = c.id WHERE c.id = ?`
    )
    .get(id) as ClientRow | undefined;
  return row ? rowToClient(row) : undefined;
}

export function getClientByEmail(email: string): Client | undefined {
  const row = getDb()
    .prepare(
      `SELECT c.*, p.nombres, p.apellidos, p.identidad, p.telefono, p.telefono_verificado, p.direccion, p.email AS profile_email, p.tipo_servicio, p.updated_at
       FROM clients c LEFT JOIN profiles p ON p.client_id = c.id WHERE LOWER(c.email) = LOWER(?)`
    )
    .get(email.trim()) as ClientRow | undefined;
  return row ? rowToClient(row) : undefined;
}

export function createClient(
  email: string,
  passwordHash: string,
  opts?: { mustChangePassword?: boolean; initialPhone?: string }
): Client {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO clients (id, email, password_hash, role, created_at, must_change_password) VALUES (?, ?, ?, 'client', ?, ?)"
    )
    .run(id, email.trim().toLowerCase(), passwordHash, now, opts?.mustChangePassword ? 1 : 0);
  if (opts?.initialPhone) {
    const ph = normalizePhone(opts.initialPhone);
    getDb()
      .prepare(
        "INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at) VALUES (?, '', '', '', ?, 1, '', ?, '', ?)"
      )
      .run(id, ph, email.trim().toLowerCase(), now);
  }
  return getClientById(id)!;
}

export function setMustChangePassword(clientId: string, value: boolean): void {
  getDb().prepare("UPDATE clients SET must_change_password = ? WHERE id = ?").run(value ? 1 : 0, clientId);
}

export function updateClientPassword(clientId: string, passwordHash: string): void {
  getDb().prepare("UPDATE clients SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(passwordHash, clientId);
}

export function updateClientProfile(clientId: string, profile: Partial<ClientProfile>): Client | undefined {
  const c = getClientById(clientId);
  if (!c) return undefined;
  const updatedAt = new Date().toISOString();
  const p = c.profile ?? {
    nombres: "",
    apellidos: "",
    identidad: "",
    telefono: "",
    telefonoVerificado: false,
    direccion: "",
    email: c.email,
    tipoServicio: "",
    updatedAt,
  };
  const nombres = profile.nombres ?? p.nombres;
  const apellidos = profile.apellidos ?? p.apellidos;
  const identidad = profile.identidad ?? p.identidad;
  const telefono = profile.telefono ?? p.telefono;
  const telefonoVerificado = profile.telefonoVerificado ?? p.telefonoVerificado;
  const direccion = profile.direccion ?? p.direccion;
  const email = profile.email ?? p.email;
  const tipoServicio = profile.tipoServicio ?? p.tipoServicio;

  getDb()
    .prepare(
      `INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(client_id) DO UPDATE SET
         nombres=excluded.nombres, apellidos=excluded.apellidos, identidad=excluded.identidad,
         telefono=excluded.telefono, telefono_verificado=excluded.telefono_verificado,
         direccion=excluded.direccion, email=excluded.email, tipo_servicio=excluded.tipo_servicio, updated_at=excluded.updated_at`
    )
    .run(clientId, nombres, apellidos, identidad, telefono, telefonoVerificado ? 1 : 0, direccion, email, tipoServicio, updatedAt);
  return getClientById(clientId);
}

export function setPhoneVerified(clientId: string, verified: boolean): void {
  const c = getClientById(clientId);
  if (!c?.profile) return;
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare("UPDATE profiles SET telefono_verificado = ?, updated_at = ? WHERE client_id = ?")
    .run(verified ? 1 : 0, updatedAt, clientId);
}

// --- Códigos de verificación (teléfono) ---
const CODE_EXPIRY_MS = 10 * 60 * 1000;

function purgeExpiredPhoneCodes(): void {
  getDb().prepare("DELETE FROM phone_codes WHERE expires_at <= ?").run(Date.now());
}

export function setPhoneCode(phone: string, code: string, clientId: string): void {
  purgeExpiredPhoneCodes();
  const ph = normalizePhone(phone);
  getDb().prepare("DELETE FROM phone_codes WHERE client_id = ? AND phone = ?").run(clientId, ph);
  getDb()
    .prepare("INSERT INTO phone_codes (phone, code, expires_at, client_id) VALUES (?, ?, ?, ?)")
    .run(ph, code, Date.now() + CODE_EXPIRY_MS, clientId);
}

export function consumePhoneCode(phone: string, code: string, clientId: string): boolean {
  purgeExpiredPhoneCodes();
  const ph = normalizePhone(phone);
  const row = getDb()
    .prepare("SELECT 1 FROM phone_codes WHERE client_id = ? AND phone = ? AND code = ? AND expires_at > ?")
    .get(clientId, ph, code, Date.now());
  if (!row) return false;
  getDb().prepare("DELETE FROM phone_codes WHERE client_id = ? AND phone = ? AND code = ?").run(clientId, ph, code);
  return true;
}

// --- Suscripciones ---
type SubRow = {
  id: string;
  phone: string;
  service_name: string;
  day_of_month: number;
  amount: number | null;
  created_at: string;
  status: string;
  paid_until: string | null;
};

function rowToSubscription(r: SubRow): ServiceSubscription {
  return {
    id: r.id,
    phone: r.phone,
    serviceName: r.service_name,
    dayOfMonth: r.day_of_month,
    amount: r.amount ?? undefined,
    createdAt: r.created_at,
    status: (r.status === "suspended" ? "suspended" : "active") as SubscriptionStatus,
    paidUntil: r.paid_until ?? null,
  };
}

export function addServiceSubscription(
  phone: string,
  serviceName: string,
  dayOfMonth: number,
  amount?: number
): ServiceSubscription {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO service_subscriptions (id, phone, service_name, day_of_month, amount, created_at, status, paid_until) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL)"
    )
    .run(id, normalizePhone(phone), serviceName, dayOfMonth, amount ?? null, now);
  return getSubscriptionById(id)!;
}

export function getSubscriptionsByPhone(phone: string): ServiceSubscription[] {
  const rows = getDb()
    .prepare("SELECT * FROM service_subscriptions WHERE phone = ? ORDER BY created_at")
    .all(normalizePhone(phone)) as SubRow[];
  return rows.map(rowToSubscription);
}

export function getAllSubscriptions(): ServiceSubscription[] {
  const rows = getDb().prepare("SELECT * FROM service_subscriptions ORDER BY created_at").all() as SubRow[];
  return rows.map(rowToSubscription);
}

export function getSubscriptionById(id: string): ServiceSubscription | undefined {
  const row = getDb().prepare("SELECT * FROM service_subscriptions WHERE id = ?").get(id) as SubRow | undefined;
  return row ? rowToSubscription(row) : undefined;
}

/** Fecha del próximo corte para una suscripción (según dayOfMonth y paidUntil). */
export function getNextCutoffDate(sub: ServiceSubscription): Date {
  const day = Math.min(28, Math.max(1, sub.dayOfMonth));
  const now = new Date();
  let next: Date;
  if (sub.paidUntil) {
    const [y, m] = sub.paidUntil.split("-").map(Number);
    next = new Date(y, m, day);
    if (next <= now) next = new Date(y, m + 1, day);
  } else {
    next = new Date(now.getFullYear(), now.getMonth(), day);
    if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return next;
}

/** Si está suspendido, devuelve la fecha de corte que venció (la que no se pagó). Si está activo, null. */
export function getLastMissedCutoffDate(sub: ServiceSubscription): string | null {
  if (sub.status !== "suspended") return null;
  const day = Math.min(28, Math.max(1, sub.dayOfMonth));
  const now = new Date();
  let d: Date;
  if (now.getDate() >= day) {
    d = new Date(now.getFullYear(), now.getMonth(), day);
  } else {
    d = new Date(now.getFullYear(), now.getMonth() - 1, day);
  }
  return d.toISOString().slice(0, 10);
}

/** Si la fecha de corte ya pasó y no está pagado, suspender. Devuelve cuántas se suspendieron. */
export function processCutoffs(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const all = getAllSubscriptions();
  let suspended = 0;
  for (const sub of all) {
    if (sub.status !== "active") continue;
    const next = getNextCutoffDate(sub);
    next.setHours(0, 0, 0, 0);
    if (next < today) {
      getDb().prepare("UPDATE service_subscriptions SET status = 'suspended' WHERE id = ?").run(sub.id);
      suspended++;
    }
  }
  return suspended;
}

/** Marcar suscripción como pagada hasta esa fecha de corte (YYYY-MM-DD); reactiva si estaba suspendida. */
export function markSubscriptionPaid(subscriptionId: string, cutoffDate: string): boolean {
  const sub = getSubscriptionById(subscriptionId);
  if (!sub) return false;
  getDb()
    .prepare("UPDATE service_subscriptions SET paid_until = ?, status = 'active' WHERE id = ?")
    .run(cutoffDate, subscriptionId);
  return true;
}

/** Actualizar suscripción (solo campos enviados). */
export function updateSubscription(
  id: string,
  patch: { phone?: string; serviceName?: string; dayOfMonth?: number; amount?: number; status?: SubscriptionStatus }
): boolean {
  const sub = getSubscriptionById(id);
  if (!sub) return false;
  const phone = patch.phone !== undefined ? normalizePhone(patch.phone) : sub.phone;
  const serviceName = patch.serviceName ?? sub.serviceName;
  const dayOfMonth = patch.dayOfMonth ?? sub.dayOfMonth;
  const amount = patch.amount !== undefined ? patch.amount : sub.amount;
  const status = patch.status ?? sub.status;
  getDb()
    .prepare(
      "UPDATE service_subscriptions SET phone = ?, service_name = ?, day_of_month = ?, amount = ?, status = ? WHERE id = ?"
    )
    .run(phone, serviceName, Math.min(28, Math.max(1, dayOfMonth)), amount ?? null, status, id);
  return true;
}

/** Eliminar suscripción (queda el servicio; el usuario queda sin esta suscripción). */
export function deleteSubscription(id: string): boolean {
  const r = getDb().prepare("DELETE FROM service_subscriptions WHERE id = ?").run(id);
  return r.changes > 0;
}

/** Cliente cuyo perfil tiene este teléfono (para mostrar correo en admin). */
export function getClientByPhone(phone: string): Client | undefined {
  const ph = normalizePhone(phone);
  const rows = getDb()
    .prepare(
      "SELECT c.id FROM clients c JOIN profiles p ON p.client_id = c.id WHERE p.telefono = ? LIMIT 1"
    )
    .all(ph) as { id: string }[];
  if (rows.length === 0) return undefined;
  return getClientById(rows[0]!.id);
}
