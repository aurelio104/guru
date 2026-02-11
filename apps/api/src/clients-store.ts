/**
 * Almacén de clientes, perfiles, códigos de verificación de teléfono y suscripciones por servicio.
 * Persistencia en JSON (misma filosofía que webauthn-store).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const PHONE_CODES_FILE = path.join(DATA_DIR, "phone-codes.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "service-subscriptions.json");

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
  profile?: ClientProfile;
};

export type PhoneCode = {
  phone: string;
  code: string;
  expiresAt: number;
  clientId: string;
};

export type ServiceSubscription = {
  id: string;
  phone: string;
  serviceName: string;
  dayOfMonth: number;
  amount?: number;
  createdAt: string;
};

function ensureDir(dir: string): void {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    ensureDir(path.dirname(file));
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveJson(file: string, data: unknown): void {
  try {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, JSON.stringify(data, null, 0), "utf-8");
  } catch (err) {
    console.warn("[clients-store] No se pudo guardar:", file, err);
  }
}

let clients: Client[] = loadJson(CLIENTS_FILE, []);
let phoneCodes: PhoneCode[] = loadJson(PHONE_CODES_FILE, []);
let serviceSubscriptions: ServiceSubscription[] = loadJson(SUBSCRIPTIONS_FILE, []);

function persistClients(): void {
  saveJson(CLIENTS_FILE, clients);
}
function persistPhoneCodes(): void {
  saveJson(PHONE_CODES_FILE, phoneCodes);
}
function persistSubscriptions(): void {
  saveJson(SUBSCRIPTIONS_FILE, serviceSubscriptions);
}

/** Normaliza teléfono para comparación (solo dígitos). */
export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}

export function getClientById(id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

export function getClientByEmail(email: string): Client | undefined {
  return clients.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
}

export function createClient(email: string, passwordHash: string): Client {
  const id = crypto.randomUUID();
  const client: Client = {
    id,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: "client",
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  persistClients();
  return client;
}

export function updateClientProfile(
  clientId: string,
  profile: Partial<ClientProfile>
): Client | undefined {
  const c = clients.find((x) => x.id === clientId);
  if (!c) return undefined;
  const updatedAt = new Date().toISOString();
  c.profile = {
    nombres: profile.nombres ?? c.profile?.nombres ?? "",
    apellidos: profile.apellidos ?? c.profile?.apellidos ?? "",
    identidad: profile.identidad ?? c.profile?.identidad ?? "",
    telefono: profile.telefono ?? c.profile?.telefono ?? "",
    telefonoVerificado: profile.telefonoVerificado ?? c.profile?.telefonoVerificado ?? false,
    direccion: profile.direccion ?? c.profile?.direccion ?? "",
    email: profile.email ?? c.profile?.email ?? c.email,
    tipoServicio: profile.tipoServicio ?? c.profile?.tipoServicio ?? "",
    updatedAt,
  };
  persistClients();
  return c;
}

export function setPhoneVerified(clientId: string, verified: boolean): void {
  const c = clients.find((x) => x.id === clientId);
  if (c?.profile) {
    c.profile.telefonoVerificado = verified;
    c.profile.updatedAt = new Date().toISOString();
    persistClients();
  }
}

// --- Códigos de verificación (teléfono) ---
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 min

function purgeExpiredPhoneCodes(): void {
  const now = Date.now();
  phoneCodes = phoneCodes.filter((p) => p.expiresAt > now);
  persistPhoneCodes();
}

export function setPhoneCode(phone: string, code: string, clientId: string): void {
  purgeExpiredPhoneCodes();
  phoneCodes = phoneCodes.filter((p) => p.clientId !== clientId || normalizePhone(p.phone) !== normalizePhone(phone));
  phoneCodes.push({
    phone: normalizePhone(phone),
    code,
    expiresAt: Date.now() + CODE_EXPIRY_MS,
    clientId,
  });
  persistPhoneCodes();
}

export function consumePhoneCode(phone: string, code: string, clientId: string): boolean {
  purgeExpiredPhoneCodes();
  const normalized = normalizePhone(phone);
  const idx = phoneCodes.findIndex(
    (p) => p.clientId === clientId && p.phone === normalized && p.code === code && p.expiresAt > Date.now()
  );
  if (idx === -1) return false;
  phoneCodes.splice(idx, 1);
  persistPhoneCodes();
  return true;
}

// --- Suscripciones por servicio (invitaciones enviadas por admin) ---
export function addServiceSubscription(
  phone: string,
  serviceName: string,
  dayOfMonth: number,
  amount?: number
): ServiceSubscription {
  const sub: ServiceSubscription = {
    id: crypto.randomUUID(),
    phone: normalizePhone(phone),
    serviceName,
    dayOfMonth,
    amount,
    createdAt: new Date().toISOString(),
  };
  serviceSubscriptions.push(sub);
  persistSubscriptions();
  return sub;
}

export function getSubscriptionsByPhone(phone: string): ServiceSubscription[] {
  const normalized = normalizePhone(phone);
  return serviceSubscriptions.filter((s) => s.phone === normalized);
}

export function getAllSubscriptions(): ServiceSubscription[] {
  return [...serviceSubscriptions];
}
