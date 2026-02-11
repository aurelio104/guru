/**
 * Almacén de credenciales y challenges WebAuthn (como Omac).
 * Persistencia en JSON para un solo usuario admin (userId = 1).
 */
import fs from "fs";
import path from "path";

const STORE_FILE = process.env.APLAT_WEBAUTHN_STORE_PATH || path.join(process.cwd(), ".webauthn-store.json");

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

export function addCredential(cred: Omit<StoredCredential, "createdAt" | "counter">): void {
  memory.credentials = memory.credentials.filter((c) => c.credentialId !== cred.credentialId);
  memory.credentials.push({
    ...cred,
    counter: 0,
    createdAt: Date.now(),
  });
  saveStore(memory);
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

export function updateCredentialLastUsed(credentialId: string): void {
  const cred = memory.credentials.find((c) => c.credentialId === credentialId);
  if (cred) {
    cred.lastUsedAt = Date.now();
    cred.counter += 1;
    saveStore(memory);
  }
}
