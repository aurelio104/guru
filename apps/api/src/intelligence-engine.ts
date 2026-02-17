/**
 * GURU Presence — Módulo de Análisis, Comprensión, Inteligencia, Contexto y Cálculos.
 * Motor que interpreta patrones, genera insights y calcula métricas humanamente significativas.
 */
import type { CheckIn, Zone } from "./presence-store.js";
import { getCheckIns, getActiveCheckIns } from "./presence-store.js";

export type InsightType =
  | "occupancy_peak"
  | "anomaly_unusual_activity"
  | "pattern_typical_day"
  | "trend_increasing"
  | "trend_decreasing"
  | "zone_comparison"
  | "channel_preference"
  | "dwell_time_insight"
  | "recommendation";

export type Insight = {
  type: InsightType;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "critical";
  data: Record<string, unknown>;
  confidence: number;
  generated_at: string;
};

export type OccupancyMetrics = {
  current: number;
  peak_today: number;
  peak_hour_today: string;
  average_dwell_minutes: number;
  by_zone: Record<string, { current: number; total_today: number }>;
  by_channel: Record<string, number>;
};

export type AnalyticsContext = {
  site_id: string;
  period_start: string;
  period_end: string;
  total_check_ins: number;
  unique_users: number;
  occupancy_metrics: OccupancyMetrics;
  insights: Insight[];
  recommendations: string[];
};

/** Punto en polígono: algoritmo ray-casting (even-odd). Polygon en [lng, lat] (GeoJSON). */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<[number, number]>
): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi === yj) continue;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Distancia Haversine en metros */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Parsea GeoJSON polygon a array de [lng, lat] */
export function parsePolygonFromGeoJson(geojson: string): Array<[number, number]> | null {
  try {
    const parsed = JSON.parse(geojson) as { type?: string; coordinates?: unknown };
    const coords = parsed?.coordinates;
    if (parsed?.type === "Polygon" && Array.isArray(coords) && Array.isArray(coords[0])) {
      const ring = coords[0] as Array<[number, number]>;
      return ring.map((c) => [c[0], c[1]] as [number, number]);
    }
    if (parsed?.type === "Point" && Array.isArray(parsed.coordinates)) {
      const [lng, lat] = parsed.coordinates as [number, number];
      const r = 0.0001;
      return [
        [lng - r, lat - r],
        [lng + r, lat - r],
        [lng + r, lat + r],
        [lng - r, lat + r],
        [lng - r, lat - r],
      ];
    }
    return null;
  } catch {
    return null;
  }
}

/** Valida si coordenadas están dentro de zona con umbral de precisión */
export function validateLocationInZone(
  lat: number,
  lng: number,
  zone: Zone
): { valid: boolean; distance_meters?: number; reason?: string } {
  const polygon = parsePolygonFromGeoJson(zone.polygon_geojson);
  if (!polygon) {
    return { valid: false, reason: "Zona mal configurada: polígono inválido" };
  }
  const inside = isPointInPolygon(lat, lng, polygon);
  if (inside) return { valid: true };

  let sumLng = 0;
  let sumLat = 0;
  for (const p of polygon) {
    sumLng += p[0];
    sumLat += p[1];
  }
  const centroidLng = sumLng / polygon.length;
  const centroidLat = sumLat / polygon.length;
  const distance = haversineDistanceMeters(lat, lng, centroidLat, centroidLng);
  if (distance <= zone.accuracy_threshold_meters) {
    return { valid: true, distance_meters: Math.round(distance) };
  }
  return {
    valid: false,
    distance_meters: Math.round(distance),
    reason: `Fuera de zona. Distancia: ${Math.round(distance)}m (máx: ${zone.accuracy_threshold_meters}m)`,
  };
}

/** Calcula minutos de permanencia entre check-in y check-out */
export function calculateDwellMinutes(checkIn: CheckIn): number | null {
  const out = checkIn.checked_out_at;
  if (!out) return null;
  const inMs = new Date(checkIn.checked_in_at).getTime();
  const outMs = new Date(out).getTime();
  return Math.round((outMs - inMs) / 60_000);
}

/** Obtiene métricas de ocupación para un sitio */
export async function getOccupancyMetrics(siteId: string, zones: Zone[]): Promise<OccupancyMetrics> {
  const active = await getActiveCheckIns(siteId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date().toISOString();
  const todayCheckIns = await getCheckIns({
    siteId,
    from: todayStart.toISOString(),
    to: todayEnd,
    limit: 5000,
  });

  const byZone: Record<string, { current: number; total_today: number }> = {};
  for (const z of zones) {
    byZone[z.id] = { current: 0, total_today: 0 };
  }
  byZone["_unknown"] = { current: 0, total_today: 0 };

  const byChannel: Record<string, number> = {};
  let peakToday = 0;
  const hourCounts: Record<number, number> = {};
  let totalDwellMinutes = 0;
  let dwellCount = 0;

  for (const c of active) {
    const zid = c.zone_id ?? "_unknown";
    if (byZone[zid]) byZone[zid].current += 1;
    else byZone[zid] = { current: 1, total_today: 0 };
    byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
  }

  for (const c of todayCheckIns) {
    const zid = c.zone_id ?? "_unknown";
    if (!byZone[zid]) byZone[zid] = { current: 0, total_today: 0 };
    byZone[zid].total_today += 1;
    const h = new Date(c.checked_in_at).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    const dwell = calculateDwellMinutes(c);
    if (dwell !== null) {
      totalDwellMinutes += dwell;
      dwellCount += 1;
    }
  }

  let peakHour = 0;
  for (const [h, count] of Object.entries(hourCounts)) {
    const n = Number(count);
    if (n > peakToday) {
      peakToday = n;
      peakHour = Number(h);
    }
  }

  return {
    current: active.length,
    peak_today: peakToday,
    peak_hour_today: `${String(peakHour).padStart(2, "0")}:00`,
    average_dwell_minutes: dwellCount > 0 ? Math.round(totalDwellMinutes / dwellCount) : 0,
    by_zone: byZone,
    by_channel: byChannel,
  };
}

/** Genera insights inteligentes a partir de los datos */
export async function generateInsights(
  siteId: string,
  zones: Zone[],
  periodDays = 7
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - periodDays);
  const checkIns = await getCheckIns({
    siteId,
    from: from.toISOString(),
    to: now.toISOString(),
    limit: 2000,
  });

  const metrics = await getOccupancyMetrics(siteId, zones);

  if (metrics.current > 0 && metrics.peak_today > 0 && metrics.current >= metrics.peak_today * 0.9) {
    insights.push({
      type: "occupancy_peak",
      title: "Pico de ocupación actual",
      description: `Hay ${metrics.current} persona(s) ahora. Es un momento de alta ocupación.`,
      severity: "info",
      data: { current: metrics.current, peak: metrics.peak_today },
      confidence: 0.95,
      generated_at: new Date().toISOString(),
    });
  }

  const channelEntries = Object.entries(metrics.by_channel);
  if (channelEntries.length > 1) {
    const [topChannel] = channelEntries.sort((a, b) => b[1] - a[1]);
    insights.push({
      type: "channel_preference",
      title: "Canal de check-in preferido",
      description: `La mayoría usa "${topChannel[0]}" para registrarse.`,
      severity: "info",
      data: { channel: topChannel[0], count: topChannel[1] },
      confidence: 0.85,
      generated_at: new Date().toISOString(),
    });
  }

  if (metrics.average_dwell_minutes > 0) {
    insights.push({
      type: "dwell_time_insight",
      title: "Tiempo promedio de permanencia",
      description: `Hoy el promedio es ${metrics.average_dwell_minutes} minutos por visita.`,
      severity: "info",
      data: { average_minutes: metrics.average_dwell_minutes },
      confidence: 0.9,
      generated_at: new Date().toISOString(),
    });
  }

  if (checkIns.length > 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCheckInsRes = await getCheckIns({
      siteId,
      from: todayStart.toISOString(),
      to: new Date().toISOString(),
      limit: 5000,
    });
    const todayCount = todayCheckInsRes.length;
    const avgPerDay = checkIns.length / periodDays;
    if (todayCount > avgPerDay * 1.5) {
      insights.push({
        type: "anomaly_unusual_activity",
        title: "Actividad por encima del promedio",
        description: `Hoy hay más check-ins de lo habitual (${todayCount} vs ~${Math.round(avgPerDay)}/día).`,
        severity: "success",
        data: { today: todayCount, average: Math.round(avgPerDay) },
        confidence: 0.8,
        generated_at: new Date().toISOString(),
      });
    }
  }

  return insights;
}

export type ChartData = {
  by_hour: Array<{ hour: number; label: string; count: number }>;
  by_day: Array<{ date: string; label: string; count: number }>;
  by_channel: Array<{ channel: string; count: number }>;
};

/** Datos agregados para gráficos de ocupación */
export async function getChartData(siteId: string, periodDays = 7): Promise<ChartData> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - periodDays);
  const checkIns = await getCheckIns({
    siteId,
    from: from.toISOString(),
    to: now.toISOString(),
    limit: 5000,
  });

  const byHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) byHour[h] = 0;
  const byDay: Record<string, number> = {};
  const byChannel: Record<string, number> = {};

  for (const c of checkIns) {
    const d = new Date(c.checked_in_at);
    byHour[d.getHours()] = (byHour[d.getHours()] ?? 0) + 1;
    const dateKey = d.toISOString().slice(0, 10);
    byDay[dateKey] = (byDay[dateKey] ?? 0) + 1;
    byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
  }

  const by_hour = Object.entries(byHour).map(([h, count]) => ({
    hour: Number(h),
    label: `${String(h).padStart(2, "0")}:00`,
    count,
  }));

  const dates = Object.keys(byDay).sort();
  const by_day = dates.map((date) => ({
    date,
    label: new Date(date).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }),
    count: byDay[date],
  }));

  const by_channel = Object.entries(byChannel).map(([channel, count]) => ({ channel, count }));

  return { by_hour, by_day, by_channel };
}

/** Contexto analítico completo para dashboards */
export async function getAnalyticsContext(
  siteId: string,
  zones: Zone[],
  periodDays = 7
): Promise<AnalyticsContext> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - periodDays);
  const checkIns = await getCheckIns({
    siteId,
    from: from.toISOString(),
    to: now.toISOString(),
    limit: 2000,
  });

  const uniqueUserIds = new Set(checkIns.map((c) => c.user_id).filter(Boolean));
  const metrics = await getOccupancyMetrics(siteId, zones);
  const insights = await generateInsights(siteId, zones, periodDays);

  const recommendations: string[] = [];
  if (metrics.by_channel.geolocation && !metrics.by_channel.ble) {
    recommendations.push("Considera habilitar beacons BLE para check-in automático sin abrir la app.");
  }
  if (Object.keys(metrics.by_zone).length > 1 && metrics.average_dwell_minutes > 60) {
    recommendations.push("Algunas zonas tienen permanencias largas. Revisa si hay cuellos de botella.");
  }

  return {
    site_id: siteId,
    period_start: from.toISOString(),
    period_end: now.toISOString(),
    total_check_ins: checkIns.length,
    unique_users: uniqueUserIds.size,
    occupancy_metrics: metrics,
    insights,
    recommendations,
  };
}

/** Co-presencia: visitantes que se solaparon en tiempo en la misma zona (anónimo) */
export type CoPresenceStats = {
  zone_id: string;
  zone_name?: string;
  date: string;
  total_check_ins: number;
  unique_visitors: number;
  max_simultaneous: number; // aprox. pico de personas al mismo tiempo
};

export async function getCoPresenceStats(
  siteId: string,
  zones: Zone[],
  dateStr: string
): Promise<CoPresenceStats[]> {
  const from = new Date(dateStr);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  const checkIns = await getCheckIns({
    siteId,
    from: from.toISOString(),
    to: to.toISOString(),
    limit: 2000,
  });
  const zoneMap = new Map(zones.map((z) => [z.id, z]));
  const byZone = new Map<string, typeof checkIns>();
  for (const c of checkIns) {
    const zid = c.zone_id ?? "_unknown";
    if (!byZone.has(zid)) byZone.set(zid, []);
    byZone.get(zid)!.push(c);
  }
  const result: CoPresenceStats[] = [];
  for (const [zoneId, list] of byZone) {
    const uniqueIds = new Set(list.map((c) => c.user_id || c.id));
    let maxSim = 0;
    const events: { t: number; delta: number }[] = [];
    for (const c of list) {
      const inMs = new Date(c.checked_in_at).getTime();
      const outMs = c.checked_out_at ? new Date(c.checked_out_at).getTime() : Date.now();
      events.push({ t: inMs, delta: 1 });
      events.push({ t: outMs, delta: -1 });
    }
    events.sort((a, b) => a.t - b.t);
    let current = 0;
    for (const e of events) {
      current += e.delta;
      if (current > maxSim) maxSim = current;
    }
    result.push({
      zone_id: zoneId,
      zone_name: zoneMap.get(zoneId)?.name,
      date: dateStr,
      total_check_ins: list.length,
      unique_visitors: uniqueIds.size,
      max_simultaneous: maxSim,
    });
  }
  return result;
}
