#!/usr/bin/env node
/**
 * Crea dist/sw-entry.d.ts en @serwist/next si no existe, para evitar
 * el error "No se puede encontrar el archivo de definición de tipo para '@serwist/next/typings'".
 */
const fs = require("fs");
const path = require("path");

const stub = `/**
 * Stub para @serwist/next/typings (parche cuando el paquete no incluye dist/sw-entry.d.ts).
 */
interface Window {
  serwist?: unknown;
}
`;

const dirs = [
  path.join(__dirname, "..", "node_modules", "@serwist", "next"),
  path.join(__dirname, "..", "..", "node_modules", "@serwist", "next"),
];

for (const pkgRoot of dirs) {
  const distDir = path.join(pkgRoot, "dist");
  const target = path.join(distDir, "sw-entry.d.ts");
  if (!fs.existsSync(pkgRoot)) continue;
  if (fs.existsSync(target)) continue;
  try {
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(target, stub, "utf8");
    console.log("OK: creado", target);
  } catch (e) {
    console.warn("No se pudo escribir", target, e.message);
  }
}
