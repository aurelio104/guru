/**
 * APlat Assets — Tracking de activos con beacons BLE.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";
import { logAudit } from "./audit-store.js";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const ASSETS_FILE = path.join(DATA_DIR, "assets.json");
const SIGHTINGS_FILE = path.join(DATA_DIR, "asset-sightings.json");

export type Asset = {
  id: string;
  name: string;
  description: string;
  beaconId: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetSighting = {
  id: string;
  assetId: string;
  seenAt: string;
  metadata?: string;
  createdAt: string;
};

let assets: Asset[] = [];
let sightings: AssetSighting[] = [];

function loadAssets(): Asset[] {
  try {
    if (fs.existsSync(ASSETS_FILE)) {
      const raw = fs.readFileSync(ASSETS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function loadSightings(): AssetSighting[] {
  try {
    if (fs.existsSync(SIGHTINGS_FILE)) {
      const raw = fs.readFileSync(SIGHTINGS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveAssets(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2), "utf-8");
  } catch (err) {
    console.warn("[assets-store] No se pudo guardar assets:", err);
  }
}

function saveSightings(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SIGHTINGS_FILE, JSON.stringify(sightings, null, 2), "utf-8");
  } catch (err) {
    console.warn("[assets-store] No se pudo guardar sightings:", err);
  }
}

export function initAssetsStore(): void {
  assets = loadAssets();
  sightings = loadSightings();
  console.log("[assets-store] Cargado:", assets.length, "assets,", sightings.length, "sightings");
}

export function getAllAssets(): Asset[] {
  if (assets.length === 0 && fs.existsSync(ASSETS_FILE)) assets = loadAssets();
  return [...assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAssetById(id: string): Asset | undefined {
  if (assets.length === 0) assets = loadAssets();
  return assets.find((a) => a.id === id);
}

export function getAssetsBySite(siteId: string): Asset[] {
  return getAllAssets().filter((a) => a.siteId === siteId);
}

export function createAsset(
  opts: { name: string; description?: string; beaconId: string; siteId: string },
  audit?: { ip?: string; userId?: string; userEmail?: string }
): Asset {
  const id = `ast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const asset: Asset = {
    id,
    name: opts.name,
    description: opts.description || "",
    beaconId: opts.beaconId,
    siteId: opts.siteId,
    createdAt: now,
    updatedAt: now,
  };
  assets.push(asset);
  saveAssets();
  logAudit({
    action: "CREATE",
    entity: "asset",
    entity_id: id,
    user_id: audit?.userId ?? null,
    user_email: audit?.userEmail ?? null,
    ip: audit?.ip ?? "unknown",
    details: JSON.stringify({ name: opts.name, beaconId: opts.beaconId, siteId: opts.siteId }),
  });
  return asset;
}

export function deleteAsset(id: string, audit?: { ip?: string; userId?: string; userEmail?: string }): boolean {
  const idx = assets.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  assets.splice(idx, 1);
  sightings = sightings.filter((s) => s.assetId !== id);
  saveAssets();
  saveSightings();
  logAudit({
    action: "DELETE",
    entity: "asset",
    entity_id: id,
    user_id: audit?.userId ?? null,
    user_email: audit?.userEmail ?? null,
    ip: audit?.ip ?? "unknown",
    details: "{}",
  });
  return true;
}

export function recordSighting(assetId: string, metadata?: string): AssetSighting | null {
  if (!getAssetById(assetId)) return null;
  const id = `sgt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const sighting: AssetSighting = { id, assetId, seenAt: now, metadata, createdAt: now };
  sightings.unshift(sighting);
  if (sightings.length > 5000) sightings = sightings.slice(0, 5000);
  saveSightings();
  return sighting;
}

export function getSightingsByAsset(assetId: string, limit: number = 100): AssetSighting[] {
  if (sightings.length === 0) sightings = loadSightings();
  return sightings.filter((s) => s.assetId === assetId).slice(0, limit);
}

export function getRecentSightings(limit: number = 50): AssetSighting[] {
  if (sightings.length === 0) sightings = loadSightings();
  return [...sightings].slice(0, limit);
}
