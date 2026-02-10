#!/usr/bin/env node
/**
 * Obtiene proyectos de Vercel y sus dominios de producción vía API,
 * y actualiza VERCEL_URLS en apps/web/components/sections/Portfolio.tsx.
 *
 * Uso:
 *   VERCEL_TOKEN=xxx node scripts/sync-vercel-domains.mjs
 *   # o tras: vercel login
 *   # el token se guarda en ~/.vercel/config.json (o usar env)
 *
 * Requiere: variable de entorno VERCEL_TOKEN (token desde https://vercel.com/account/tokens)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let token = process.env.VERCEL_TOKEN;
if (!token) {
  const configPath = path.join(process.env.HOME || "", ".vercel", "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      token = config.token ?? config.accessToken;
    } catch (_) {}
  }
}
if (!token) {
  console.error("Falta VERCEL_TOKEN. Opciones:");
  console.error("  1. Ejecuta 'vercel login' y luego: node scripts/sync-vercel-domains.mjs");
  console.error("  2. Crea un token en https://vercel.com/account/tokens y ejecuta:");
  console.error("     VERCEL_TOKEN=tu_token node scripts/sync-vercel-domains.mjs");
  process.exit(1);
}

const PORTFOLIO_PATH = path.join(ROOT, "apps/web/components/sections/Portfolio.tsx");

async function fetchProjects() {
  const res = await fetch("https://api.vercel.com/v9/projects?limit=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Vercel API ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.projects ?? data;
}

function getProductionDomain(project) {
  const alias = project.alias || [];
  const production = alias.find((a) => a.target === "PRODUCTION" || a.environment === "production") || alias[0];
  const domain = production?.domain;
  if (domain) return domain.startsWith("http") ? domain : `https://${domain}`;
  if (project.latestDeployments?.length) {
    const d = project.latestDeployments.find((x) => x.target === "production") || project.latestDeployments[0];
    const host = d?.alias?.[0] || d?.deploymentHostname;
    if (host) return host.startsWith("http") ? host : `https://${host}`;
  }
  return null;
}

function slugFromName(name) {
  if (!name) return null;
  return name;
}

async function verifyUrl(url, timeout = 8000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Obteniendo proyectos de Vercel...");
  const projects = await fetchProjects();
  const entries = [];
  for (const p of projects) {
    const url = getProductionDomain(p);
    const name = p.name;
    if (url && name) entries.push({ name, url });
  }

  console.log(`Encontrados ${entries.length} proyectos con dominio. Verificando que respondan...`);
  const verified = [];
  for (const e of entries) {
    const ok = await verifyUrl(e.url);
    if (ok) {
      verified.push(e);
      console.log(`  ✓ ${e.name} -> ${e.url}`);
    } else {
      console.log(`  ✗ (no responde) ${e.name} -> ${e.url}`);
    }
  }

  const vercelUrls = {};
  for (const { name, url } of verified) {
    vercelUrls[name] = url;
  }
  console.log(`\n${verified.length}/${entries.length} dominios verificados. Solo estos se escribirán en Portfolio.`);

  let content = fs.readFileSync(PORTFOLIO_PATH, "utf8");
  const startMarker = "/** Dominios Vercel por slug. Si no hay URL, el enlace va a GitHub. */\nconst VERCEL_URLS: Record<string, string> = {";
  const endMarker = "};";
  const start = content.indexOf(startMarker);
  const endBlock = content.indexOf(endMarker, start);
  if (start === -1 || endBlock === -1) {
    console.error("No se encontró el bloque VERCEL_URLS en Portfolio.tsx");
    process.exit(1);
  }
  const blockStart = start + startMarker.length;
  const lines = Object.entries(vercelUrls)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  const newBlock = "\n" + lines.join("\n") + "\n";
  content = content.slice(0, blockStart) + newBlock + content.slice(endBlock);
  fs.writeFileSync(PORTFOLIO_PATH, content);
  console.log("\nPortfolio.tsx actualizado con los dominios de Vercel.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
