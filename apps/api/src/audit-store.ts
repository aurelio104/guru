/**
 * Logs de auditoría: registra TODOS los cambios en la base de datos (crear, actualizar, eliminar).
 * Persiste en SQLite junto con los datos principales.
 */
import fs from "fs";
import path from "path";
import initSqlJs, { type Database } from "sql.js";

const DATA_DIR = process.env.GURU_DATA_PATH || path.join(process.cwd(), "data");
const AUDIT_DB_PATH = path.join(DATA_DIR, "guru-audit.db");
const AUDIT_DB_TMP_PATH = `${AUDIT_DB_PATH}.tmp`;

let auditDbInstance: Database | null = null;
let auditPersistInterval: ReturnType<typeof setInterval> | null = null;

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGIN_FAIL" | "VERIFY" | "PROCESS";

export type AuditLog = {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: string; // "client", "profile", "subscription", "credential", etc.
  entity_id: string;
  user_id: string | null; // quién hizo el cambio (null si es sistema)
  user_email: string | null;
  ip: string;
  details: string; // JSON con datos adicionales
};

export async function initAuditDb(): Promise<void> {
  if (auditDbInstance) return;
  const dir = path.dirname(AUDIT_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  console.log("[audit] Ruta de la base de auditoría:", AUDIT_DB_PATH);
  const SQL = await initSqlJs();
  let data: Uint8Array | undefined;
  if (fs.existsSync(AUDIT_DB_PATH)) {
    data = new Uint8Array(fs.readFileSync(AUDIT_DB_PATH));
    console.log("[audit] Base de auditoría existente cargada, tamaño:", data.length, "bytes");
  } else {
    console.log("[audit] Base de auditoría nueva.");
  }
  auditDbInstance = new SQL.Database(data);
  initAuditSchema(auditDbInstance);
  persistAuditDb();
  const count = getAuditDb().exec("SELECT COUNT(*) AS n FROM audit_logs");
  const nLogs = count[0]?.values?.[0]?.[0] ?? 0;
  console.log("[audit] Inicializado. Logs de auditoría:", nLogs);
  if (!auditPersistInterval) {
    auditPersistInterval = setInterval(() => {
      try {
        if (auditDbInstance) persistAuditDb();
      } catch (e) {
        console.warn("[audit] Error en guardado periódico:", e);
      }
    }, 20_000);
  }
  const onExit = () => {
    try {
      if (auditDbInstance) persistAuditDb();
    } catch (e) {
      console.warn("[audit] Error al guardar al salir:", e);
    }
    if (auditPersistInterval) clearInterval(auditPersistInterval);
  };
  process.once("beforeExit", onExit);
  process.once("SIGINT", () => { onExit(); process.exit(0); });
  process.once("SIGTERM", () => { onExit(); process.exit(0); });
}

function getAuditDb(): Database {
  if (!auditDbInstance) throw new Error("[audit] DB de auditoría no inicializada.");
  return auditDbInstance;
}

function persistAuditDb(): void {
  if (!auditDbInstance) return;
  const dir = path.dirname(AUDIT_DB_PATH);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = auditDbInstance.export();
    fs.writeFileSync(AUDIT_DB_TMP_PATH, Buffer.from(buf), { flag: "w" });
    fs.renameSync(AUDIT_DB_TMP_PATH, AUDIT_DB_PATH);
  } catch (err) {
    console.warn("[audit] No se pudo guardar DB de auditoría en", AUDIT_DB_PATH, err);
  }
}

function initAuditSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT,
      ip TEXT NOT NULL,
      details TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
  `);
  persistAuditDb();
}

export function logAudit(log: Omit<AuditLog, "id" | "timestamp">): void {
  try {
    const db = getAuditDb();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    db.run(
      "INSERT INTO audit_logs (id, timestamp, action, entity, entity_id, user_id, user_email, ip, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, timestamp, log.action, log.entity, log.entity_id, log.user_id ?? null, log.user_email ?? null, log.ip, log.details]
    );
    persistAuditDb();
  } catch (err) {
    console.error("[audit] Error al registrar log:", err);
  }
}

export function getAuditLogs(filters?: {
  entity?: string;
  entity_id?: string;
  user_id?: string;
  action?: AuditAction;
  limit?: number;
}): AuditLog[] {
  try {
    const db = getAuditDb();
    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params: (string | number)[] = [];
    if (filters?.entity) {
      sql += " AND entity = ?";
      params.push(filters.entity);
    }
    if (filters?.entity_id) {
      sql += " AND entity_id = ?";
      params.push(filters.entity_id);
    }
    if (filters?.user_id) {
      sql += " AND user_id = ?";
      params.push(filters.user_id);
    }
    if (filters?.action) {
      sql += " AND action = ?";
      params.push(filters.action);
    }
    sql += " ORDER BY timestamp DESC";
    if (filters?.limit) {
      sql += " LIMIT ?";
      params.push(filters.limit);
    }
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      logs.push({
        id: String(row.id),
        timestamp: String(row.timestamp),
        action: String(row.action) as AuditAction,
        entity: String(row.entity),
        entity_id: String(row.entity_id),
        user_id: row.user_id ? String(row.user_id) : null,
        user_email: row.user_email ? String(row.user_email) : null,
        ip: String(row.ip),
        details: String(row.details),
      });
    }
    stmt.free();
    return logs;
  } catch (err) {
    console.error("[audit] Error al obtener logs:", err);
    return [];
  }
}
