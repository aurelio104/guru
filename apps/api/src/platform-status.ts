/**
 * GURU — Estado de la plataforma (conteos y sugerencias).
 * Sirve para dashboards "inteligentes" que muestran qué falta o qué requiere atención.
 */
import { getSites } from "./presence-store.js";
import { getAllVulnerabilities } from "./security-store.js";
import { getGdprChecklist } from "./gdpr-store.js";
import { getAllIncidents } from "./incidents-store.js";
import { getAllReports } from "./reports-store.js";
import { getAllProducts, getAllOrders } from "./commerce-store.js";
import { getAllAssets } from "./assets-store.js";

export type PlatformStatus = {
  ok: boolean;
  at: string;
  counts: {
    sites: number;
    products: number;
    orders: number;
    assets: number;
    reports: number;
    vulnerabilitiesOpen: number;
    incidentsOpen: number;
    gdprPending: number;
  };
  suggestions: string[];
};

export async function getPlatformStatus(): Promise<PlatformStatus> {
  const at = new Date().toISOString();
  const suggestions: string[] = [];

  let sites = 0;
  let products = 0;
  let orders = 0;
  let assets = 0;
  let reports = 0;
  let vulnerabilitiesOpen = 0;
  let incidentsOpen = 0;
  let gdprPending = 0;

  try {
    const siteList = await getSites();
    sites = siteList.length;
    if (sites === 0) suggestions.push("Crear al menos una sede en Presence para check-ins y portal WiFi.");
  } catch {
    suggestions.push("No se pudo leer el estado de Presence.");
  }

  try {
    const vulns = getAllVulnerabilities();
    vulnerabilitiesOpen = vulns.filter((v) => v.status === "open").length;
    if (vulnerabilitiesOpen > 0) suggestions.push(`${vulnerabilitiesOpen} vulnerabilidad(es) abierta(s) en Security.`);
  } catch {
    suggestions.push("No se pudo leer el estado de Security.");
  }

  try {
    const incidents = getAllIncidents();
    incidentsOpen = incidents.filter((i) => i.status === "open" || i.status === "investigating").length;
    if (incidentsOpen > 0) suggestions.push(`${incidentsOpen} incidente(s) abierto(s) en Incidentes.`);
  } catch {
    suggestions.push("No se pudo leer el estado de Incidentes.");
  }

  try {
    const gdprItems = getGdprChecklist();
    gdprPending = gdprItems.filter((i) => i.status === "pending" || i.status === "in_progress").length;
    if (gdprPending > 0) suggestions.push(`${gdprPending} ítem(s) pendientes en GDPR/LOPD.`);
  } catch {
    suggestions.push("No se pudo leer el estado de GDPR.");
  }

  try {
    const reportList = getAllReports();
    reports = reportList.length;
  } catch {
    /* ignore */
  }

  try {
    const productList = getAllProducts();
    products = productList.length;
    orders = getAllOrders().length;
    if (products === 0 && orders === 0) suggestions.push("Añadir productos en Commerce para poder recibir pedidos.");
  } catch {
    suggestions.push("No se pudo leer el estado de Commerce.");
  }

  try {
    assets = getAllAssets().length;
  } catch {
    /* ignore */
  }

  return {
    ok: true,
    at,
    counts: {
      sites,
      products,
      orders,
      assets,
      reports,
      vulnerabilitiesOpen,
      incidentsOpen,
      gdprPending,
    },
    suggestions,
  };
}
