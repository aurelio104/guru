#!/usr/bin/env node
/**
 * Obtiene proyectos y dominios de producción desde la CLI de Vercel
 * (usa la sesión actual: vercel login) y actualiza
 * apps/web/data/portfolio-production-urls.json.
 *
 * Uso:
 *   node scripts/sync-vercel-domains.mjs
 *   # o: pnpm run sync:vercel
 *
 * Requiere: vercel CLI instalado y sesión iniciada (vercel login).
 * Cuando en Vercel cambies un dominio (p. ej. custom), vuelve a ejecutar
 * y APlat mostrará el nuevo enlace.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "apps/web/data/portfolio-production-urls.json");

/** Mapeo nombre proyecto Vercel → slug en Portfolio (getProductionUrl usa el slug). */
const VERCEL_TO_SLUG = {
  aplat: "APlat",
  web: "Omac",
  "j-cavalier": "JCavalier",
  "control-acceso-albatros": "control-acceso-albatros",
  frontend: "MundoIAanime",
  "maracay-deportiva": "maracay-deportiva",
  "rt-reportes": "rt-reportes",
  "plataforma-albatros": "plataforma-albatros",
  "albatros-presentacion": "albatros-presentacion",
  "bam-vino": "BAMVino",
  "gvx-demo": "gvx-demo",
  memoria: "memoria",
  "cuadernos-oficial": "CuadernosOficial",
  "ray-premios": "RayPremios",
  admin: "Admin",
};

function runVercelProjectLsJson() {
  try {
    const out = execSync("vercel project ls --format=json", {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    return JSON.parse(out);
  } catch (e) {
    console.error("Error al ejecutar 'vercel project ls --format=json'. ¿Has hecho 'vercel login'?");
    throw e;
  }
}

function main() {
  console.log("Ejecutando 'vercel project ls --format=json' (usa tu sesión CLI)...");
  const data = runVercelProjectLsJson();
  const projects = data.projects || [];

  let existing = {};
  if (fs.existsSync(DATA_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    } catch (_) {}
  }

  const result = { ...existing };
  for (const p of projects) {
    const url = (p.latestProductionUrl || "").trim();
    if (!url || url === "--") continue;
    const slug = VERCEL_TO_SLUG[p.name?.toLowerCase()] ?? p.name;
    result[slug] = url.replace(/\/$/, "");
    console.log(`  ${p.name} → ${slug}: ${url}`);
  }

  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(result, null, 2), "utf8");
  console.log(`\n${DATA_PATH} actualizado con ${Object.keys(result).length} dominios.`);
}

main();
