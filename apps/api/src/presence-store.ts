/**
 * APlat Presence — Almacén de presencia, zonas, check-ins, beacons y NFC.
 * PostgreSQL (pg) cuando APLAT_POSTGRES_URL está definido; si no, SQLite (sql.js).
 * Auditoría integrada.
 */
import fs from "fs";
import path from "path";
import { logAudit } from "./audit-store.js";

const USE_POSTGRES = !!process.env.APLAT_POSTGRES_URL;
const POSTGRES_URL = process.env.APLAT_POSTGRES_URL || "";

export type CheckInChannel = "geolocation" | "wifi_portal" | "qr" | "ble" | "nfc";

export type Site = {
  id: string;
  name: string;
  config_json: string;
  enabled_channels: string;
  created_at: string;
  updated_at: string;
};

export type Zone = {
  id: string;
  site_id: string;
  name: string;
  polygon_geojson: string;
  accuracy_threshold_meters: number;
  created_at: string;
  updated_at: string;
};

export type CheckIn = {
  id: string;
  site_id: string;
  zone_id: string | null;
  user_id: string | null;
  channel: CheckInChannel;
  metadata_json: string;
  checked_in_at: string;
  checked_out_at: string | null;
  created_at: string;
};

export type Beacon = {
  id: string;
  site_id: string;
  zone_id: string;
  uuid: string;
  major: number;
  minor: number;
  eddystone_uid?: string | null;
  name: string;
  created_at: string;
  updated_at: string;
};

export type NfcTag = {
  id: string;
  site_id: string;
  zone_id: string;
  tag_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// =============================================================================
// POSTGRES
// =============================================================================

let pgPool: import("pg").Pool | null = null;

async function getPgPool(): Promise<import("pg").Pool> {
  if (!pgPool) throw new Error("[presence-store] PostgreSQL no inicializado.");
  return pgPool;
}

async function pgRun(sql: string, params: (string | number | null)[] = []): Promise<void> {
  const pool = await getPgPool();
  const client = await pool.connect();
  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function pgGet<T extends Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): Promise<T | undefined> {
  const pool = await getPgPool();
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    const row = res.rows[0];
    return row as T | undefined;
  } finally {
    client.release();
  }
}

async function pgAll<T extends Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): Promise<T[]> {
  const pool = await getPgPool();
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return (res.rows as T[]) || [];
  } finally {
    client.release();
  }
}

function toPgParams(conditions: string[], values: (string | number | null)[]): { sql: string; params: (string | number | null)[] } {
  let i = 1;
  const sql = conditions.map((c) => c.replace(/\?/g, () => `$${i++}`)).join(" AND ");
  return { sql, params: values };
}

async function initPgSchema(): Promise<void> {
  await pgRun(`
    CREATE TABLE IF NOT EXISTS presence_sites (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      enabled_channels TEXT NOT NULL DEFAULT 'geolocation,qr,wifi_portal',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_zones (
      id UUID PRIMARY KEY,
      site_id UUID NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      polygon_geojson TEXT NOT NULL,
      accuracy_threshold_meters INTEGER NOT NULL DEFAULT 50,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_check_ins (
      id UUID PRIMARY KEY,
      site_id UUID NOT NULL,
      zone_id UUID REFERENCES presence_zones(id) ON DELETE SET NULL,
      user_id TEXT,
      channel TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      checked_in_at TIMESTAMPTZ NOT NULL,
      checked_out_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_beacons (
      id UUID PRIMARY KEY,
      site_id UUID NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      zone_id UUID NOT NULL REFERENCES presence_zones(id) ON DELETE CASCADE,
      uuid TEXT NOT NULL,
      major INTEGER NOT NULL DEFAULT 0,
      minor INTEGER NOT NULL DEFAULT 0,
      eddystone_uid TEXT,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_nfc_tags (
      id UUID PRIMARY KEY,
      site_id UUID NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      zone_id UUID NOT NULL REFERENCES presence_zones(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_check_ins_site ON presence_check_ins(site_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_zone ON presence_check_ins(zone_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_user ON presence_check_ins(user_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_channel ON presence_check_ins(channel);
    CREATE INDEX IF NOT EXISTS idx_check_ins_checked_in_at ON presence_check_ins(checked_in_at);
  `);
  try {
    await pgRun("ALTER TABLE presence_beacons ADD COLUMN IF NOT EXISTS eddystone_uid TEXT");
    await pgRun("CREATE INDEX IF NOT EXISTS idx_beacons_eddystone ON presence_beacons(eddystone_uid)");
  } catch {
    /* column/index may exist */
  }
}

// =============================================================================
// SQLITE (fallback)
// =============================================================================

import initSqlJs, { type Database } from "sql.js";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "aplat-presence.db");
const DB_TMP_PATH = `${DB_PATH}.tmp`;

let dbInstance: Database | null = null;
let persistInterval: ReturnType<typeof setInterval> | null = null;

function getDb(): Database {
  if (!dbInstance) throw new Error("[presence-store] DB no inicializada.");
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
    console.warn("[presence-store] No se pudo guardar DB en", DB_PATH, err);
  }
}

function dbRun(sql: string, params: (string | number | null)[] = []): void {
  getDb().run(sql, params);
  persistDb();
}

function dbGet<T extends Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const hasRow = stmt.step();
  const row = hasRow ? (stmt.getAsObject() as T) : undefined;
  stmt.free();
  return row;
}

function dbAll<T extends Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T[] {
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
    CREATE TABLE IF NOT EXISTS presence_sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      enabled_channels TEXT NOT NULL DEFAULT 'geolocation,qr,wifi_portal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_zones (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      polygon_geojson TEXT NOT NULL,
      accuracy_threshold_meters INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_check_ins (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      zone_id TEXT REFERENCES presence_zones(id) ON DELETE SET NULL,
      user_id TEXT,
      channel TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      checked_in_at TEXT NOT NULL,
      checked_out_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_beacons (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      zone_id TEXT NOT NULL REFERENCES presence_zones(id) ON DELETE CASCADE,
      uuid TEXT NOT NULL,
      major INTEGER NOT NULL DEFAULT 0,
      minor INTEGER NOT NULL DEFAULT 0,
      eddystone_uid TEXT,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_nfc_tags (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES presence_sites(id) ON DELETE CASCADE,
      zone_id TEXT NOT NULL REFERENCES presence_zones(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_check_ins_site ON presence_check_ins(site_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_zone ON presence_check_ins(zone_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_user ON presence_check_ins(user_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_channel ON presence_check_ins(channel);
    CREATE INDEX IF NOT EXISTS idx_check_ins_checked_in_at ON presence_check_ins(checked_in_at);
  `);
  persistDb();
  try {
    getDb().run("ALTER TABLE presence_beacons ADD COLUMN eddystone_uid TEXT");
  } catch {
    /* column may exist */
  }
  try {
    getDb().run("CREATE INDEX IF NOT EXISTS idx_beacons_eddystone ON presence_beacons(eddystone_uid)");
    persistDb();
  } catch {
    /* index may exist */
  }
}

// =============================================================================
// INIT
// =============================================================================

export async function initPresenceDb(): Promise<void> {
  if (USE_POSTGRES) {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({ connectionString: POSTGRES_URL });
    await initPgSchema();
    const r = await pgGet<{ n: string }>("SELECT COUNT(*)::text as n FROM presence_sites");
    let siteCount = parseInt(r?.n ?? "0", 10);
    if (siteCount === 0) {
      await createSite("Sede Principal", {}, "geolocation,qr,wifi_portal,ble,nfc");
      siteCount = 1;
      console.log("[presence-store] Sitio por defecto 'Sede Principal' creado (PostgreSQL).");
    }
    console.log("[presence-store] PostgreSQL inicializado. Sites:", siteCount);
    return;
  }

  if (dbInstance) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  console.log("[presence-store] SQLite ruta DB:", DB_PATH);
  const SQL = await initSqlJs();
  let data: Uint8Array | undefined;
  if (fs.existsSync(DB_PATH)) {
    data = new Uint8Array(fs.readFileSync(DB_PATH));
  }
  dbInstance = new SQL.Database(data);
  initSchema(dbInstance);
  if (!persistInterval) {
    persistInterval = setInterval(() => {
      try {
        if (dbInstance) persistDb();
      } catch (e) {
        console.warn("[presence-store] Error guardado periódico:", e);
      }
    }, 20_000);
  }
  process.once("beforeExit", () => { try { if (dbInstance) persistDb(); } catch {} });
  process.once("SIGINT", () => { try { if (dbInstance) persistDb(); } catch {}; process.exit(0); });
  const countResult = dbAll<{ n: number }>("SELECT COUNT(*) as n FROM presence_sites");
  let siteCount = countResult[0]?.n ?? 0;
  if (siteCount === 0) {
    createSiteSync("Sede Principal", {}, "geolocation,qr,wifi_portal,ble,nfc");
    siteCount = 1;
    console.log("[presence-store] Sitio por defecto 'Sede Principal' creado (SQLite).");
  }
  console.log("[presence-store] SQLite inicializado. Sites:", siteCount);
}

// SQLite sync createSite (used during init before async is ready)
function createSiteSync(name: string, config: Record<string, unknown> = {}, enabledChannels = "geolocation,qr,wifi_portal"): Site {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  dbRun(
    "INSERT INTO presence_sites (id, name, config_json, enabled_channels, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, JSON.stringify(config), enabledChannels, now, now]
  );
  return dbGet<Site>("SELECT * FROM presence_sites WHERE id = ?", [id])!;
}

// =============================================================================
// API PÚBLICA (async cuando PostgreSQL, sync wrap cuando SQLite)
// =============================================================================

export async function createSite(name: string, config: Record<string, unknown> = {}, enabledChannels = "geolocation,qr,wifi_portal"): Promise<Site> {
  if (USE_POSTGRES) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await pgRun(
      "INSERT INTO presence_sites (id, name, config_json, enabled_channels, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name, JSON.stringify(config), enabledChannels, now, now]
    );
    return (await pgGet<Site>("SELECT * FROM presence_sites WHERE id = $1", [id]))!;
  }
  return Promise.resolve(createSiteSync(name, config, enabledChannels));
}

export async function getSites(): Promise<Site[]> {
  if (USE_POSTGRES) return pgAll<Site>("SELECT * FROM presence_sites ORDER BY created_at DESC");
  return Promise.resolve(dbAll<Site>("SELECT * FROM presence_sites ORDER BY created_at DESC"));
}

export async function getSiteById(id: string): Promise<Site | undefined> {
  if (USE_POSTGRES) return pgGet<Site>("SELECT * FROM presence_sites WHERE id = $1", [id]);
  return Promise.resolve(dbGet<Site>("SELECT * FROM presence_sites WHERE id = ?", [id]));
}

export async function createZone(siteId: string, name: string, polygonGeojson: string, accuracyThresholdMeters = 50): Promise<Zone> {
  if (USE_POSTGRES) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await pgRun(
      "INSERT INTO presence_zones (id, site_id, name, polygon_geojson, accuracy_threshold_meters, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, siteId, name, polygonGeojson, accuracyThresholdMeters, now, now]
    );
    return (await pgGet<Zone>("SELECT * FROM presence_zones WHERE id = $1", [id]))!;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  dbRun(
    "INSERT INTO presence_zones (id, site_id, name, polygon_geojson, accuracy_threshold_meters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, siteId, name, polygonGeojson, accuracyThresholdMeters, now, now]
  );
  return Promise.resolve(dbGet<Zone>("SELECT * FROM presence_zones WHERE id = ?", [id])!);
}

export async function getZonesBySite(siteId: string): Promise<Zone[]> {
  if (USE_POSTGRES) return pgAll<Zone>("SELECT * FROM presence_zones WHERE site_id = $1 ORDER BY name", [siteId]);
  return Promise.resolve(dbAll<Zone>("SELECT * FROM presence_zones WHERE site_id = ? ORDER BY name", [siteId]));
}

export async function getZoneById(id: string): Promise<Zone | undefined> {
  if (USE_POSTGRES) return pgGet<Zone>("SELECT * FROM presence_zones WHERE id = $1", [id]);
  return Promise.resolve(dbGet<Zone>("SELECT * FROM presence_zones WHERE id = ?", [id]));
}

export async function updateZone(
  id: string,
  updates: { name?: string; polygon_geojson?: string; accuracy_threshold_meters?: number }
): Promise<Zone | undefined> {
  const zone = USE_POSTGRES ? await getZoneById(id) : await Promise.resolve(dbGet<Zone>("SELECT * FROM presence_zones WHERE id = ?", [id]));
  if (!zone) return undefined;
  const name = updates.name ?? zone.name;
  const polygon = updates.polygon_geojson ?? zone.polygon_geojson;
  const accuracy = updates.accuracy_threshold_meters ?? zone.accuracy_threshold_meters;
  const now = new Date().toISOString();
  if (USE_POSTGRES) {
    await pgRun(
      "UPDATE presence_zones SET name = $1, polygon_geojson = $2, accuracy_threshold_meters = $3, updated_at = $4 WHERE id = $5",
      [name, polygon, accuracy, now, id]
    );
    return pgGet<Zone>("SELECT * FROM presence_zones WHERE id = $1", [id]);
  }
  dbRun(
    "UPDATE presence_zones SET name = ?, polygon_geojson = ?, accuracy_threshold_meters = ?, updated_at = ? WHERE id = ?",
    [name, polygon, accuracy, now, id]
  );
  return Promise.resolve(dbGet<Zone>("SELECT * FROM presence_zones WHERE id = ?", [id]));
}

export async function deleteZone(id: string): Promise<boolean> {
  const zone = USE_POSTGRES ? await getZoneById(id) : await Promise.resolve(dbGet<Zone>("SELECT * FROM presence_zones WHERE id = ?", [id]));
  if (!zone) return false;
  if (USE_POSTGRES) {
    await pgRun("DELETE FROM presence_zones WHERE id = $1", [id]);
    return true;
  }
  dbRun("DELETE FROM presence_zones WHERE id = ?", [id]);
  return true;
}

export async function recordCheckIn(params: {
  siteId: string;
  zoneId?: string | null;
  userId?: string | null;
  channel: CheckInChannel;
  metadata?: Record<string, unknown>;
  ip?: string;
  userIdAudit?: string | null;
}): Promise<CheckIn> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { siteId, zoneId, userId, channel, metadata = {}, ip = "unknown", userIdAudit } = params;
  if (USE_POSTGRES) {
    await pgRun(
      "INSERT INTO presence_check_ins (id, site_id, zone_id, user_id, channel, metadata_json, checked_in_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, siteId, zoneId ?? null, userId ?? null, channel, JSON.stringify(metadata), now, now]
    );
    logAudit({
      action: "CREATE",
      entity: "presence_check_in",
      entity_id: id,
      user_id: userIdAudit ?? null,
      user_email: null,
      ip,
      details: JSON.stringify({ siteId, zoneId, userId, channel }),
    });
    return (await pgGet<CheckIn>("SELECT * FROM presence_check_ins WHERE id = $1", [id]))!;
  }
  dbRun(
    "INSERT INTO presence_check_ins (id, site_id, zone_id, user_id, channel, metadata_json, checked_in_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, siteId, zoneId ?? null, userId ?? null, channel, JSON.stringify(metadata), now, now]
  );
  logAudit({
    action: "CREATE",
    entity: "presence_check_in",
    entity_id: id,
    user_id: userIdAudit ?? null,
    user_email: null,
    ip,
    details: JSON.stringify({ siteId, zoneId, userId, channel }),
  });
  return Promise.resolve(dbGet<CheckIn>("SELECT * FROM presence_check_ins WHERE id = ?", [id])!);
}

export async function recordCheckOut(checkInId: string, ip = "unknown", userIdAudit?: string | null): Promise<boolean> {
  if (USE_POSTGRES) {
    const existing = await pgGet<CheckIn>("SELECT * FROM presence_check_ins WHERE id = $1 AND checked_out_at IS NULL", [checkInId]);
    if (!existing) return false;
    const now = new Date().toISOString();
    await pgRun("UPDATE presence_check_ins SET checked_out_at = $1 WHERE id = $2", [now, checkInId]);
    logAudit({
      action: "UPDATE",
      entity: "presence_check_in",
      entity_id: checkInId,
      user_id: userIdAudit ?? null,
      user_email: null,
      ip,
      details: JSON.stringify({ action: "check_out" }),
    });
    return true;
  }
  const existing = dbGet<CheckIn>("SELECT * FROM presence_check_ins WHERE id = ? AND checked_out_at IS NULL", [checkInId]);
  if (!existing) return false;
  const now = new Date().toISOString();
  dbRun("UPDATE presence_check_ins SET checked_out_at = ? WHERE id = ?", [now, checkInId]);
  persistDb();
  logAudit({
    action: "UPDATE",
    entity: "presence_check_in",
    entity_id: checkInId,
    user_id: userIdAudit ?? null,
    user_email: null,
    ip,
    details: JSON.stringify({ action: "check_out" }),
  });
  return true;
}

export async function getCheckIns(params: {
  siteId?: string;
  zoneId?: string;
  userId?: string;
  channel?: CheckInChannel;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<CheckIn[]> {
  const { siteId, zoneId, userId, channel, from, to, limit = 100, offset = 0 } = params;
  const conditions: string[] = [];
  const values: (string | number | null)[] = [];
  if (siteId) { conditions.push("site_id = ?"); values.push(siteId); }
  if (zoneId) { conditions.push("zone_id = ?"); values.push(zoneId); }
  if (userId) { conditions.push("user_id = ?"); values.push(userId); }
  if (channel) { conditions.push("channel = ?"); values.push(channel); }
  if (from) { conditions.push("checked_in_at >= ?"); values.push(from); }
  if (to) { conditions.push("checked_in_at <= ?"); values.push(to); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit, offset);

  if (USE_POSTGRES) {
    const pgConditions = conditions.map((c, i) => c.replace("?", `$${i + 1}`));
    const pgWhere = pgConditions.length ? "WHERE " + pgConditions.join(" AND ") : "";
    const limIdx = conditions.length + 1;
    const offIdx = conditions.length + 2;
    const pgValues = [...values.slice(0, -2), limit, offset];
    const sql = `SELECT * FROM presence_check_ins ${pgWhere} ORDER BY checked_in_at DESC LIMIT $${limIdx} OFFSET $${offIdx}`;
    return pgAll<CheckIn>(sql, pgValues);
  }
  return Promise.resolve(dbAll<CheckIn>(`SELECT * FROM presence_check_ins ${where} ORDER BY checked_in_at DESC LIMIT ? OFFSET ?`, values));
}

export async function getActiveCheckIns(siteId?: string): Promise<CheckIn[]> {
  if (USE_POSTGRES) {
    if (siteId) return pgAll<CheckIn>("SELECT * FROM presence_check_ins WHERE site_id = $1 AND checked_out_at IS NULL ORDER BY checked_in_at DESC", [siteId]);
    return pgAll<CheckIn>("SELECT * FROM presence_check_ins WHERE checked_out_at IS NULL ORDER BY checked_in_at DESC");
  }
  const cond = siteId ? "WHERE site_id = ? AND checked_out_at IS NULL" : "WHERE checked_out_at IS NULL";
  const params = siteId ? [siteId] : [];
  return Promise.resolve(dbAll<CheckIn>(`SELECT * FROM presence_check_ins ${cond} ORDER BY checked_in_at DESC`, params));
}

export async function addBeacon(
  siteId: string,
  zoneId: string,
  uuid: string,
  major: number,
  minor: number,
  name: string,
  eddystoneUid?: string | null
): Promise<Beacon> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const edUid = eddystoneUid?.trim() || null;
  if (USE_POSTGRES) {
    await pgRun(
      "INSERT INTO presence_beacons (id, site_id, zone_id, uuid, major, minor, eddystone_uid, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [id, siteId, zoneId, uuid, major, minor, edUid, name || "Beacon", now, now]
    );
    return (await pgGet<Beacon>("SELECT * FROM presence_beacons WHERE id = $1", [id]))!;
  }
  dbRun(
    "INSERT INTO presence_beacons (id, site_id, zone_id, uuid, major, minor, eddystone_uid, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, siteId, zoneId, uuid, major, minor, edUid, name || "Beacon", now, now]
  );
  return Promise.resolve(dbGet<Beacon>("SELECT * FROM presence_beacons WHERE id = ?", [id])!);
}

export async function getBeaconsBySite(siteId: string): Promise<Beacon[]> {
  if (USE_POSTGRES) return pgAll<Beacon>("SELECT * FROM presence_beacons WHERE site_id = $1 ORDER BY name", [siteId]);
  return Promise.resolve(dbAll<Beacon>("SELECT * FROM presence_beacons WHERE site_id = ? ORDER BY name", [siteId]));
}

export async function getBeaconById(uuid: string, major: number, minor: number): Promise<Beacon | undefined> {
  if (USE_POSTGRES) return pgGet<Beacon>("SELECT * FROM presence_beacons WHERE uuid = $1 AND major = $2 AND minor = $3", [uuid, major, minor]);
  return Promise.resolve(dbGet<Beacon>("SELECT * FROM presence_beacons WHERE uuid = ? AND major = ? AND minor = ?", [uuid, major, minor]));
}

export async function getBeaconByEddystoneUid(eddystoneUid: string): Promise<Beacon | undefined> {
  const uid = eddystoneUid.trim().toUpperCase();
  if (!uid) return undefined;
  if (USE_POSTGRES) return pgGet<Beacon>("SELECT * FROM presence_beacons WHERE eddystone_uid = $1", [uid]);
  return Promise.resolve(dbGet<Beacon>("SELECT * FROM presence_beacons WHERE eddystone_uid = ?", [uid]));
}

export async function addNfcTag(siteId: string, zoneId: string, tagId: string, name: string): Promise<NfcTag> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  if (USE_POSTGRES) {
    await pgRun(
      "INSERT INTO presence_nfc_tags (id, site_id, zone_id, tag_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, siteId, zoneId, tagId, name || "NFC Tag", now, now]
    );
    return (await pgGet<NfcTag>("SELECT * FROM presence_nfc_tags WHERE id = $1", [id]))!;
  }
  dbRun(
    "INSERT INTO presence_nfc_tags (id, site_id, zone_id, tag_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, siteId, zoneId, tagId, name || "NFC Tag", now, now]
  );
  return Promise.resolve(dbGet<NfcTag>("SELECT * FROM presence_nfc_tags WHERE id = ?", [id])!);
}

export async function getNfcTagByTagId(tagId: string): Promise<NfcTag | undefined> {
  if (USE_POSTGRES) return pgGet<NfcTag>("SELECT * FROM presence_nfc_tags WHERE tag_id = $1", [tagId]);
  return Promise.resolve(dbGet<NfcTag>("SELECT * FROM presence_nfc_tags WHERE tag_id = ?", [tagId]));
}

export async function getNfcTagsBySite(siteId: string): Promise<NfcTag[]> {
  if (USE_POSTGRES) return pgAll<NfcTag>("SELECT * FROM presence_nfc_tags WHERE site_id = $1 ORDER BY name", [siteId]);
  return Promise.resolve(dbAll<NfcTag>("SELECT * FROM presence_nfc_tags WHERE site_id = ? ORDER BY name", [siteId]));
}
