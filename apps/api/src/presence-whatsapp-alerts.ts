/**
 * APlat Presence — Alertas por WhatsApp
 * Envía notificaciones cuando hay pico de ocupación o anomalías.
 * Usa Baileys (sendWhatsAppMessage). Rate limit: 1 alerta por tipo por sitio por hora.
 */
import { getSites, getSiteById, getZonesBySite } from "./presence-store.js";
import { getAnalyticsContext } from "./intelligence-engine.js";

const ALERT_PHONES = (process.env.APLAT_PRESENCE_ALERT_PHONE || "")
  .split(",")
  .map((p) => p.trim().replace(/[^0-9]/g, ""))
  .filter((p) => p.length >= 8);

const ALERT_TYPES = ["occupancy_peak", "anomaly_unusual_activity"] as const;
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hora

const lastSent = new Map<string, number>(); // key: `${siteId}:${insightType}`

function getRateLimitKey(siteId: string, insightType: string): string {
  return `${siteId}:${insightType}`;
}

function canSend(siteId: string, insightType: string): boolean {
  const key = getRateLimitKey(siteId, insightType);
  const last = lastSent.get(key) ?? 0;
  return Date.now() - last >= RATE_LIMIT_MS;
}

function markSent(siteId: string, insightType: string): void {
  lastSent.set(getRateLimitKey(siteId, insightType), Date.now());
}

export async function checkAndSendPresenceAlerts(siteId?: string): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  if (ALERT_PHONES.length === 0) {
    return { sent: 0, skipped: 0, errors: ["APLAT_PRESENCE_ALERT_PHONE no configurado."] };
  }

  let whatsappModule: Awaited<typeof import("./whatsapp.js")> | null = null;
  try {
    whatsappModule = await import("./whatsapp.js");
  } catch {
    errors.push("Módulo WhatsApp no disponible.");
    return { sent, skipped, errors };
  }

  const connected = await whatsappModule.isWhatsAppConnected();
  if (!connected) {
    errors.push("WhatsApp no conectado.");
    return { sent, skipped, errors };
  }

  const siteIds = siteId ? [siteId] : (await getSites()).map((s) => s.id);
  if (siteIds.length === 0) {
    return { sent, skipped, errors };
  }

  for (const sid of siteIds) {
    const site = await getSiteById(sid);
    if (!site) continue;
    const zones = await getZonesBySite(sid);
    const context = await getAnalyticsContext(sid, zones, 7);

    for (const insight of context.insights || []) {
      if (!ALERT_TYPES.includes(insight.type as (typeof ALERT_TYPES)[number])) continue;
      if (!canSend(sid, insight.type)) {
        skipped++;
        continue;
      }

      const msg = `*APlat Presence* 📍\n\n*${site.name}*\n\n` +
        `🔔 *${insight.title}*\n${insight.description}`;

      let ok = false;
      for (const phone of ALERT_PHONES) {
        const result = await whatsappModule.sendWhatsAppMessage(phone, msg);
        if (result.success) {
          ok = true;
          sent++;
        } else {
          errors.push(`Tel ${phone}: ${result.error ?? "Error"}`);
        }
      }
      if (ok) markSent(sid, insight.type);
    }
  }

  return { sent, skipped, errors };
}
