/**
 * Almacén de credenciales y challenges WebAuthn (como Omac).
 * Persistencia en JSON para un solo usuario admin (userId = 1).
 * Auditoría: registro de creación y uso de credenciales.
 */
import fs from "fs";
import path from "path";
import { logAudit } from "./audit-store.js";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const STORE_FILE = process.env.APLAT_WEBAUTHN_STORE_PATH || path.join(DATA_DIR, "webauthn-store.json");

export type StoredCredential = {
  userId: number;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
  createdAt: number;
  lastUsedAt?: number;
};

export type StoredChallenge = {
  userId: number;
  expiresAt: number;
};

type Store = {
  credentials: StoredCredential[];
  challenges: Record<string, StoredChallenge>;
};

function loadStore(): Store {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const data = JSON.parse(raw) as Store;
      return {
        credentials: data.credentials ?? [],
        challenges: data.challenges ?? {},
      };
    }
  } catch {
    // ignore
  }
  return { credentials: [], challenges: {} };
}

function saveStore(store: Store): void {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 0), "utf-8");
  } catch (err) {
    console.warn("[webauthn-store] No se pudo persistir:", err);
  }
}

let memory: Store = loadStore();

export function getCredentialByCredentialId(credentialId: string): StoredCredential | undefined {
  return memory.credentials.find((c) => c.credentialId === credentialId);
}

export function getCredentialsByUserId(userId: number): StoredCredential[] {
  return memory.credentials.filter((c) => c.userId === userId);
}

export function addCredential(cred: Omit<StoredCredential, "createdAt" | "counter">, opts?: { ip?: string; userEmail?: string }): void {
  memory.credentials = memory.credentials.filter((c) => c.credentialId !== cred.credentialId);
  memory.credentials.push({
    ...cred,
    counter: 0,
    createdAt: Date.now(),
  });
  saveStore(memory);
  logAudit({
    action: "CREATE",
    entity: "credential",
    entity_id: cred.credentialId,
    user_id: String(cred.userId),
    user_email: opts?.userEmail ?? null,
    ip: opts?.ip ?? "system",
    details: JSON.stringify({ deviceName: cred.deviceName }),
  });
}

export function setChallenge(challengeKey: string, userId: number, expiresAt: number): void {
  memory.challenges[challengeKey] = { userId, expiresAt };
  saveStore(memory);
}

export function getAndConsumeChallenge(challengeKey: string): StoredChallenge | undefined {
  const c = memory.challenges[challengeKey];
  if (!c) return undefined;
  if (Date.now() > c.expiresAt) {
    delete memory.challenges[challengeKey];
    saveStore(memory);
    return undefined;
  }
  delete memory.challenges[challengeKey];
  saveStore(memory);
  return c;
}

export function updateCredentialLastUsed(credentialId: string, opts?: { ip?: string; userEmail?: string }): void {
  const cred = memory.credentials.find((c) => c.credentialId === credentialId);
  if (cred) {
    cred.lastUsedAt = Date.now();
    cred.counter += 1;
    saveStore(memory);
    logAudit({
      action: "UPDATE",
      entity: "credential",
      entity_id: credentialId,
      user_id: String(cred.userId),
      user_email: opts?.userEmail ?? null,
      ip: opts?.ip ?? "system",
      details: JSON.stringify({ action: "used", counter: cred.counter }),
    });
  }
}
