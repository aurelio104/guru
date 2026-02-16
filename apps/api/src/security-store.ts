/**
 * APlat Security — Vulnerabilidades y escaneos.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const VULNS_FILE = path.join(DATA_DIR, "security-vulnerabilities.json");
const SCANS_FILE = path.join(DATA_DIR, "security-scans.json");

export type VulnerabilitySeverity = "low" | "medium" | "high" | "critical";
export type VulnerabilityStatus = "open" | "mitigated" | "closed";

export type Vulnerability = {
  id: string;
  title: string;
  severity: VulnerabilitySeverity;
  description: string;
  cve?: string;
  status: VulnerabilityStatus;
  asset?: string;
  remediation?: string;
  createdAt: string;
  updatedAt: string;
};

export type ScanStatus = "pending" | "running" | "completed" | "failed";

export type SecurityScan = {
  id: string;
  type: "manual" | "scheduled";
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  findingsCount?: number;
  error?: string;
  createdAt: string;
};

let vulnerabilities: Vulnerability[] = [];
let scans: SecurityScan[] = [];

function loadVulnerabilities(): Vulnerability[] {
  try {
    if (fs.existsSync(VULNS_FILE)) {
      const raw = fs.readFileSync(VULNS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function loadScans(): SecurityScan[] {
  try {
    if (fs.existsSync(SCANS_FILE)) {
      const raw = fs.readFileSync(SCANS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveVulnerabilities(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(VULNS_FILE, JSON.stringify(vulnerabilities, null, 2), "utf-8");
  } catch (err) {
    console.warn("[security-store] No se pudo guardar vulnerabilidades:", err);
  }
}

function saveScans(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SCANS_FILE, JSON.stringify(scans, null, 2), "utf-8");
  } catch (err) {
    console.warn("[security-store] No se pudo guardar scans:", err);
  }
}

export function initSecurityStore(): void {
  vulnerabilities = loadVulnerabilities();
  scans = loadScans();
  console.log("[security-store] Cargado:", vulnerabilities.length, "vulnerabilidades,", scans.length, "scans");
}

export function getAllVulnerabilities(): Vulnerability[] {
  if (vulnerabilities.length === 0 && fs.existsSync(VULNS_FILE)) vulnerabilities = loadVulnerabilities();
  return [...vulnerabilities].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getVulnerabilityById(id: string): Vulnerability | undefined {
  if (vulnerabilities.length === 0) vulnerabilities = loadVulnerabilities();
  return vulnerabilities.find((v) => v.id === id);
}

export function createVulnerability(
  opts: {
    title: string;
    severity: VulnerabilitySeverity;
    description: string;
    cve?: string;
    status?: VulnerabilityStatus;
    asset?: string;
    remediation?: string;
  }
): Vulnerability {
  if (vulnerabilities.length === 0) vulnerabilities = loadVulnerabilities();
  const now = new Date().toISOString();
  const id = `vuln-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const v: Vulnerability = {
    id,
    title: opts.title,
    severity: opts.severity,
    description: opts.description,
    cve: opts.cve,
    status: opts.status ?? "open",
    asset: opts.asset,
    remediation: opts.remediation,
    createdAt: now,
    updatedAt: now,
  };
  vulnerabilities.push(v);
  saveVulnerabilities();
  return v;
}

export function updateVulnerability(
  id: string,
  updates: Partial<Pick<Vulnerability, "title" | "severity" | "description" | "cve" | "status" | "asset" | "remediation">>
): Vulnerability | undefined {
  if (vulnerabilities.length === 0) vulnerabilities = loadVulnerabilities();
  const idx = vulnerabilities.findIndex((v) => v.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  vulnerabilities[idx] = { ...vulnerabilities[idx], ...updates, updatedAt: now };
  saveVulnerabilities();
  return vulnerabilities[idx];
}

export function deleteVulnerability(id: string): boolean {
  if (vulnerabilities.length === 0) vulnerabilities = loadVulnerabilities();
  const idx = vulnerabilities.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  vulnerabilities.splice(idx, 1);
  saveVulnerabilities();
  return true;
}

export function getAllScans(): SecurityScan[] {
  if (scans.length === 0 && fs.existsSync(SCANS_FILE)) scans = loadScans();
  return [...scans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getScanById(id: string): SecurityScan | undefined {
  if (scans.length === 0) scans = loadScans();
  return scans.find((s) => s.id === id);
}

export function createScan(type: "manual" | "scheduled"): SecurityScan {
  if (scans.length === 0) scans = loadScans();
  const now = new Date().toISOString();
  const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const scan: SecurityScan = {
    id,
    type,
    status: "pending",
    startedAt: now,
    createdAt: now,
  };
  scans.push(scan);
  saveScans();
  return scan;
}

export function updateScan(
  id: string,
  updates: Partial<Pick<SecurityScan, "status" | "completedAt" | "findingsCount" | "error">>
): SecurityScan | undefined {
  if (scans.length === 0) scans = loadScans();
  const idx = scans.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  scans[idx] = { ...scans[idx], ...updates };
  saveScans();
  return scans[idx];
}
