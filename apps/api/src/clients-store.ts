/**
 * Almacén de clientes, perfiles, códigos de verificación y suscripciones.
 * Persistencia con sql.js (SQLite en WebAssembly, sin binarios nativos; funciona en Koyeb y cualquier entorno).
 * Auditoría: todos los cambios (crear, actualizar, eliminar) se registran en audit-store.
 */
import fs from "fs";
import path from "path";
import initSqlJs, { type Database } from "sql.js";
import { logAudit } from "./audit-store.js";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "aplat.db");
const DB_TMP_PATH = `${DB_PATH}.tmp`;

let dbInstance: Database | null = null;
let persistInterval: ReturnType<typeof setInterval> | null = null;

/** Debe llamarse una vez al arrancar la API (await initStoreDb()). */
export async function initStoreDb(): Promise<void> {
  if (dbInstance) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  console.log("[clients-store] Ruta de la base de datos:", DB_PATH);
  const SQL = await initSqlJs();
  let data: Uint8Array | undefined;
  if (fs.existsSync(DB_PATH)) {
    data = new Uint8Array(fs.readFileSync(DB_PATH));
    console.log("[clients-store] Base de datos existente cargada, tamaño:", data.length, "bytes");
  } else {
    console.log("[clients-store] Base de datos nueva (archivo no existía). En producción usa un volumen persistente (APLAT_DATA_PATH).");
  }
  dbInstance = new SQL.Database(data);
  initSchema(dbInstance);
  migrateFromJsonIfNeeded(dbInstance);
  persistDb();
  const clients = getDb().exec("SELECT COUNT(*) AS n FROM clients");
  const subs = getDb().exec("SELECT COUNT(*) AS n FROM service_subscriptions");
  const nClients = clients[0]?.values?.[0]?.[0] ?? 0;
  const nSubs = subs[0]?.values?.[0]?.[0] ?? 0;
  console.log("[clients-store] Inicializado. Clientes:", nClients, "| Suscripciones:", nSubs);
  if (!persistInterval) {
    persistInterval = setInterval(() => {
      try {
        if (dbInstance) persistDb();
      } catch (e) {
        console.warn("[clients-store] Error en guardado periódico:", e);
      }
    }, 20_000);
  }
  const onExit = () => {
    try {
      if (dbInstance) persistDb();
    } catch (e) {
      console.warn("[clients-store] Error al guardar al salir:", e);
    }
    if (persistInterval) clearInterval(persistInterval);
  };
  process.once("beforeExit", onExit);
  process.once("SIGINT", () => { onExit(); process.exit(0); });
  process.once("SIGTERM", () => { onExit(); process.exit(0); });
}

function getDb(): Database {
  if (!dbInstance) throw new Error("[clients-store] DB no inicializada. Debe llamar a initStoreDb() al arrancar.");
  return dbInstance;
}

function persistDb(): void {
  if (!dbInstance) return;
  const dir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = dbInstance.export();
    fs.writeFileSync(DB_TMP_PATH, Buffer.from(buf), { flag: "w" });
    fs.renameSync(DB_TMP_PATH, DB_PATH);
  } catch (err) {
    console.warn("[clients-store] No se pudo guardar DB en", DB_PATH, err);
  }
}

type SqlValue = string | number | null;

function dbRun(sql: string, params: SqlValue[] = []): void {
  getDb().run(sql, params);
  persistDb();
}

function dbGet<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const hasRow = stmt.step();
  const row = hasRow ? (stmt.getAsObject() as T) : undefined;
  stmt.free();
  return row;
}

function dbAll<T extends Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

function initSchema(db: Database): void {
  db.exec(`
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
  persistDb();
}

/** Si la DB está vacía y existen los JSON antiguos, importa una sola vez. */
function migrateFromJsonIfNeeded(db: Database): void {
  const row = dbGet<{ n: number }>("SELECT COUNT(*) AS n FROM clients");
  if (!row || row.n > 0) return;
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
    for (const c of clientsJson) {
      db.run(
        "INSERT INTO clients (id, email, password_hash, role, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
        [c.id, c.email, c.passwordHash, c.role ?? "client", c.createdAt, c.mustChangePassword ? 1 : 0]
      );
      if (c.profile) {
        db.run(
          "INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            c.id,
            c.profile.nombres ?? "",
            c.profile.apellidos ?? "",
            c.profile.identidad ?? "",
            c.profile.telefono ?? "",
            c.profile.telefonoVerificado ? 1 : 0,
            c.profile.direccion ?? "",
            c.profile.email ?? c.email,
            c.profile.tipoServicio ?? "",
            c.profile.updatedAt,
          ]
        );
      }
    }
    if (fs.existsSync(phoneCodesFile)) {
      const codes = JSON.parse(fs.readFileSync(phoneCodesFile, "utf-8")) as PhoneCode[];
      for (const p of codes) {
        if (p.expiresAt > Date.now()) {
          db.run("INSERT INTO phone_codes (phone, code, expires_at, client_id) VALUES (?, ?, ?, ?)", [
            p.phone,
            p.code,
            p.expiresAt,
            p.clientId,
          ]);
        }
      }
    }
    if (fs.existsSync(subsFile)) {
      const subs = JSON.parse(fs.readFileSync(subsFile, "utf-8")) as Array<
        ServiceSubscription & { status?: string; paidUntil?: string | null }
      >;
      for (const s of subs) {
        db.run(
          "INSERT INTO service_subscriptions (id, phone, service_name, day_of_month, amount, created_at, status, paid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            s.id,
            s.phone,
            s.serviceName,
            s.dayOfMonth,
            s.amount ?? null,
            s.createdAt,
            s.status ?? "active",
            s.paidUntil ?? null,
          ]
        );
      }
    }
    console.log("[clients-store] Migración desde JSON completada.");
  } catch (err) {
    console.warn("[clients-store] Migración desde JSON fallida:", err);
  }
  persistDb();
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
  const row = dbGet<ClientRow>(
    `SELECT c.*, p.nombres, p.apellidos, p.identidad, p.telefono, p.telefono_verificado, p.direccion, p.email AS profile_email, p.tipo_servicio, p.updated_at
     FROM clients c LEFT JOIN profiles p ON p.client_id = c.id WHERE c.id = ?`,
    [id]
  );
  return row ? rowToClient(row) : undefined;
}

export function getClientByEmail(email: string): Client | undefined {
  const row = dbGet<ClientRow>(
    `SELECT c.*, p.nombres, p.apellidos, p.identidad, p.telefono, p.telefono_verificado, p.direccion, p.email AS profile_email, p.tipo_servicio, p.updated_at
     FROM clients c LEFT JOIN profiles p ON p.client_id = c.id WHERE LOWER(c.email) = LOWER(?)`,
    [email.trim()]
  );
  return row ? rowToClient(row) : undefined;
}

export function createClient(
  email: string,
  passwordHash: string,
  opts?: { mustChangePassword?: boolean; initialPhone?: string; ip?: string; userId?: string }
): Client {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  dbRun("INSERT INTO clients (id, email, password_hash, role, created_at, must_change_password) VALUES (?, ?, ?, 'client', ?, ?)", [
    id,
    email.trim().toLowerCase(),
    passwordHash,
    now,
    opts?.mustChangePassword ? 1 : 0,
  ]);
  if (opts?.initialPhone) {
    const ph = normalizePhone(opts.initialPhone);
    dbRun(
      "INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at) VALUES (?, '', '', '', ?, 1, '', ?, '', ?)",
      [id, ph, email.trim().toLowerCase(), now]
    );
  }
  logAudit({
    action: "CREATE",
    entity: "client",
    entity_id: id,
    user_id: opts?.userId ?? null,
    user_email: email.trim().toLowerCase(),
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ email: email.trim().toLowerCase(), mustChangePassword: opts?.mustChangePassword }),
  });
  return getClientById(id)!;
}

export function setMustChangePassword(clientId: string, value: boolean): void {
  dbRun("UPDATE clients SET must_change_password = ? WHERE id = ?", [value ? 1 : 0, clientId]);
}

export function updateClientPassword(clientId: string, passwordHash: string, opts?: { ip?: string; userId?: string }): void {
  dbRun("UPDATE clients SET password_hash = ?, must_change_password = 0 WHERE id = ?", [passwordHash, clientId]);
  const c = getClientById(clientId);
  logAudit({
    action: "UPDATE",
    entity: "client",
    entity_id: clientId,
    user_id: opts?.userId ?? clientId,
    user_email: c?.email ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ field: "password" }),
  });
}

export function updateClientProfile(clientId: string, profile: Partial<ClientProfile>, opts?: { ip?: string; userId?: string; userEmail?: string }): Client | undefined {
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

  dbRun(
    `INSERT INTO profiles (client_id, nombres, apellidos, identidad, telefono, telefono_verificado, direccion, email, tipo_servicio, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(client_id) DO UPDATE SET
       nombres=excluded.nombres, apellidos=excluded.apellidos, identidad=excluded.identidad,
       telefono=excluded.telefono, telefono_verificado=excluded.telefono_verificado,
       direccion=excluded.direccion, email=excluded.email, tipo_servicio=excluded.tipo_servicio, updated_at=excluded.updated_at`,
    [clientId, nombres, apellidos, identidad, telefono, telefonoVerificado ? 1 : 0, direccion, email, tipoServicio, updatedAt]
  );
  logAudit({
    action: "UPDATE",
    entity: "profile",
    entity_id: clientId,
    user_id: opts?.userId ?? clientId,
    user_email: c.email,
    ip: opts?.ip ?? "system",
    details: JSON.stringify(profile),
  });
  return getClientById(clientId);
}

export function setPhoneVerified(clientId: string, verified: boolean): void {
  const c = getClientById(clientId);
  if (!c?.profile) return;
  const updatedAt = new Date().toISOString();
  dbRun("UPDATE profiles SET telefono_verificado = ?, updated_at = ? WHERE client_id = ?", [
    verified ? 1 : 0,
    updatedAt,
    clientId,
  ]);
}

// --- Códigos de verificación (teléfono) ---
const CODE_EXPIRY_MS = 10 * 60 * 1000;

function purgeExpiredPhoneCodes(): void {
  dbRun("DELETE FROM phone_codes WHERE expires_at <= ?", [Date.now()]);
}

export function setPhoneCode(phone: string, code: string, clientId: string): void {
  purgeExpiredPhoneCodes();
  const ph = normalizePhone(phone);
  dbRun("DELETE FROM phone_codes WHERE client_id = ? AND phone = ?", [clientId, ph]);
  dbRun("INSERT INTO phone_codes (phone, code, expires_at, client_id) VALUES (?, ?, ?, ?)", [
    ph,
    code,
    Date.now() + CODE_EXPIRY_MS,
    clientId,
  ]);
}

export function consumePhoneCode(phone: string, code: string, clientId: string): boolean {
  purgeExpiredPhoneCodes();
  const ph = normalizePhone(phone);
  const row = dbGet<Record<string, unknown>>(
    "SELECT 1 FROM phone_codes WHERE client_id = ? AND phone = ? AND code = ? AND expires_at > ?",
    [clientId, ph, code, Date.now()]
  );
  if (!row) return false;
  dbRun("DELETE FROM phone_codes WHERE client_id = ? AND phone = ? AND code = ?", [clientId, ph, code]);
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
  amount?: number,
  opts?: { ip?: string; userId?: string; userEmail?: string }
): ServiceSubscription {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  dbRun(
    "INSERT INTO service_subscriptions (id, phone, service_name, day_of_month, amount, created_at, status, paid_until) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL)",
    [id, normalizePhone(phone), serviceName, dayOfMonth, amount ?? null, now]
  );
  logAudit({
    action: "CREATE",
    entity: "subscription",
    entity_id: id,
    user_id: opts?.userId ?? null,
    user_email: opts?.userEmail ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ phone: normalizePhone(phone), serviceName, dayOfMonth, amount }),
  });
  return getSubscriptionById(id)!;
}

export function getSubscriptionsByPhone(phone: string): ServiceSubscription[] {
  const rows = dbAll<SubRow>("SELECT * FROM service_subscriptions WHERE phone = ? ORDER BY created_at", [
    normalizePhone(phone),
  ]);
  return rows.map(rowToSubscription);
}

export function getAllSubscriptions(): ServiceSubscription[] {
  const rows = dbAll<SubRow>("SELECT * FROM service_subscriptions ORDER BY created_at");
  return rows.map(rowToSubscription);
}

export function getSubscriptionById(id: string): ServiceSubscription | undefined {
  const row = dbGet<SubRow>("SELECT * FROM service_subscriptions WHERE id = ?", [id]);
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
      dbRun("UPDATE service_subscriptions SET status = 'suspended' WHERE id = ?", [sub.id]);
      suspended++;
    }
  }
  return suspended;
}

/** Marcar suscripción como pagada hasta esa fecha de corte (YYYY-MM-DD); reactiva si estaba suspendida. */
export function markSubscriptionPaid(subscriptionId: string, cutoffDate: string, opts?: { ip?: string; userId?: string; userEmail?: string }): boolean {
  const sub = getSubscriptionById(subscriptionId);
  if (!sub) return false;
  dbRun("UPDATE service_subscriptions SET paid_until = ?, status = 'active' WHERE id = ?", [
    cutoffDate,
    subscriptionId,
  ]);
  logAudit({
    action: "UPDATE",
    entity: "subscription",
    entity_id: subscriptionId,
    user_id: opts?.userId ?? null,
    user_email: opts?.userEmail ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ action: "mark_paid", cutoffDate }),
  });
  return true;
}

/** Actualizar suscripción (solo campos enviados). */
export function updateSubscription(
  id: string,
  patch: { phone?: string; serviceName?: string; dayOfMonth?: number; amount?: number; status?: SubscriptionStatus },
  opts?: { ip?: string; userId?: string; userEmail?: string }
): boolean {
  const sub = getSubscriptionById(id);
  if (!sub) return false;
  const phone = patch.phone !== undefined ? normalizePhone(patch.phone) : sub.phone;
  const serviceName = patch.serviceName ?? sub.serviceName;
  const dayOfMonth = patch.dayOfMonth ?? sub.dayOfMonth;
  const amount = patch.amount !== undefined ? patch.amount : sub.amount;
  const status = patch.status ?? sub.status;
  dbRun(
    "UPDATE service_subscriptions SET phone = ?, service_name = ?, day_of_month = ?, amount = ?, status = ? WHERE id = ?",
    [phone, serviceName, Math.min(28, Math.max(1, dayOfMonth)), amount ?? null, status, id]
  );
  logAudit({
    action: "UPDATE",
    entity: "subscription",
    entity_id: id,
    user_id: opts?.userId ?? null,
    user_email: opts?.userEmail ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify(patch),
  });
  return true;
}

/** Eliminar suscripción (queda el servicio; el usuario queda sin esta suscripción). */
export function deleteSubscription(id: string, opts?: { ip?: string; userId?: string; userEmail?: string }): boolean {
  const sub = getSubscriptionById(id);
  if (!sub) return false;
  getDb().run("DELETE FROM service_subscriptions WHERE id = ?", [id]);
  const n = getDb().getRowsModified();
  persistDb();
  logAudit({
    action: "DELETE",
    entity: "subscription",
    entity_id: id,
    user_id: opts?.userId ?? null,
    user_email: opts?.userEmail ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ phone: sub.phone, serviceName: sub.serviceName }),
  });
  return n > 0;
}

/** Cliente cuyo perfil tiene este teléfono (para mostrar correo en admin). */
export function getClientByPhone(phone: string): Client | undefined {
  const ph = normalizePhone(phone);
  const rows = dbAll<{ id: string }>("SELECT c.id FROM clients c JOIN profiles p ON p.client_id = c.id WHERE p.telefono = ? LIMIT 1", [
    ph,
  ]);
  if (rows.length === 0) return undefined;
  return getClientById(rows[0]!.id);
}
