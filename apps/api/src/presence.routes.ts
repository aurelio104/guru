/**
 * APlat Presence — Rutas API para check-in, zonas, beacons, NFC e inteligencia.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import type { CheckInChannel } from "./presence-store.js";
import {
  getSites,
  getSiteById,
  createSite,
  getZonesBySite,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  recordCheckIn,
  recordCheckOut,
  getCheckIns,
  getActiveCheckIns,
  getBeaconById,
  getBeaconByEddystoneUid,
  getBeaconsBySite,
  addBeacon,
  getNfcTagByTagId,
  addNfcTag,
  getNfcTagsBySite,
} from "./presence-store.js";
import {
  validateLocationInZone,
  getAnalyticsContext,
  getOccupancyMetrics,
  getChartData,
  getCoPresenceStats,
  parsePolygonFromGeoJson,
} from "./intelligence-engine.js";

type AuthPayload = { sub?: string; email?: string; role?: string };

async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.APLAT_JWT_SECRET || "dev-aplat-secret-SOLO-DESARROLLO-CAMBIAR";
  return new TextEncoder().encode(secret);
}

async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthPayload | null> {
  const auth = request.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    await reply.status(401).send({ ok: false, error: "No autorizado." });
    return null;
  }
  try {
    const secret = await getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch {
    await reply.status(401).send({ ok: false, error: "Token inválido o expirado." });
    return null;
  }
}

async function requireMaster(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthPayload | null> {
  const user = await requireAuth(request, reply);
  if (!user) return null;
  if (user.role !== "master") {
    await reply.status(403).send({ ok: false, error: "Se requiere rol master." });
    return null;
  }
  return user;
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return request.ip ?? "unknown";
}

export async function registerPresenceRoutes(app: FastifyInstance): Promise<void> {
  const secret = await getJwtSecret();

  // --- Health / Presence ping ---
  app.get("/api/presence/health", async (_, reply) => {
    return reply.status(200).send({ ok: true, service: "presence", version: "1.0.0" });
  });

  // --- Check-in (público para portal WiFi; auth opcional para usuarios) ---
  type CheckInBody = {
    site_id?: string;
    zone_id?: string;
    channel?: CheckInChannel;
    lat?: number;
    lng?: number;
    accuracy?: number;
    metadata?: Record<string, unknown>;
    user_id?: string;
    qr_code?: string;
    nfc_tag_id?: string;
    beacon_uuid?: string;
    beacon_major?: number;
    beacon_minor?: number;
    beacon_eddystone_uid?: string;
    beacon_rssi?: number;
    name?: string;
    email?: string;
    document?: string;
    visiting?: string;
  };

  app.post<{ Body: CheckInBody }>("/api/presence/check-in", async (request, reply) => {
    const body = request.body ?? {};
    const ip = getClientIp(request);

    let siteId = body.site_id?.trim();
    const channel = (body.channel || "geolocation") as CheckInChannel;

    if (channel === "ble") {
      const eddystoneUid = body.beacon_eddystone_uid?.trim();
      const uuid = body.beacon_uuid?.trim();
      const major = Number(body.beacon_major ?? 0);
      const minor = Number(body.beacon_minor ?? 0);
      let beacon;
      if (eddystoneUid) {
        beacon = await getBeaconByEddystoneUid(eddystoneUid);
      } else if (uuid) {
        beacon = await getBeaconById(uuid, major, minor);
      }
      if (!beacon) {
        return reply.status(404).send({ ok: false, error: "Beacon no registrado. Requiere beacon_uuid+major+minor o beacon_eddystone_uid." });
      }
      siteId = beacon.site_id;
    } else if (channel === "nfc") {
      const tagId = body.nfc_tag_id?.trim();
      if (!tagId) {
        return reply.status(400).send({ ok: false, error: "nfc_tag_id es requerido para check-in por NFC." });
      }
      const tag = await getNfcTagByTagId(tagId);
      if (!tag) {
        return reply.status(404).send({ ok: false, error: "Tag NFC no registrado." });
      }
      siteId = tag.site_id;
    }

    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id es requerido." });
    }

    const site = await getSiteById(siteId);
    if (!site) {
      return reply.status(404).send({ ok: false, error: "Sitio no encontrado." });
    }

    const enabledChannels = (site.enabled_channels || "geolocation,qr,wifi_portal,ble").split(",").map((c) => c.trim());
    if (!enabledChannels.includes(channel)) {
      return reply.status(400).send({ ok: false, error: `Canal "${channel}" no está habilitado en este sitio.` });
    }

    let zoneId: string | null = body.zone_id?.trim() || null;
    let userId: string | null = body.user_id?.trim() || null;
    const metadata: Record<string, unknown> = { ...body.metadata, ip };

    if (channel === "geolocation") {
      const lat = body.lat;
      const lng = body.lng;
      if (lat == null || lng == null) {
        return reply.status(400).send({ ok: false, error: "geolocation requiere lat y lng." });
      }
      if (!zoneId) {
        return reply.status(400).send({ ok: false, error: "zone_id es requerido para check-in por geolocalización." });
      }
      const zone = await getZoneById(zoneId);
      if (!zone) {
        return reply.status(404).send({ ok: false, error: "Zona no encontrada." });
      }
      const validation = validateLocationInZone(lat, lng, zone);
      if (!validation.valid) {
        return reply.status(400).send({ ok: false, error: validation.reason || "Ubicación fuera de zona." });
      }
      metadata.accuracy = body.accuracy;
      metadata.distance_meters = validation.distance_meters;
    } else if (channel === "wifi_portal") {
      metadata.name = body.name;
      metadata.email = body.email;
      metadata.document = body.document;
      metadata.visiting = body.visiting;
    } else if (channel === "qr") {
      metadata.qr_code = body.qr_code || `site:${siteId}:zone:${zoneId}`;
      if (!zoneId) {
        return reply.status(400).send({ ok: false, error: "zone_id es requerido para check-in por QR." });
      }
      const zone = await getZoneById(zoneId);
      if (!zone) {
        return reply.status(404).send({ ok: false, error: "Zona no encontrada." });
      }
    } else if (channel === "nfc") {
      const tagId = body.nfc_tag_id?.trim();
      if (!tagId) {
        return reply.status(400).send({ ok: false, error: "nfc_tag_id es requerido para check-in por NFC." });
      }
      const tag = await getNfcTagByTagId(tagId);
      if (!tag) {
        return reply.status(404).send({ ok: false, error: "Tag NFC no registrado." });
      }
      zoneId = tag.zone_id;
      metadata.tag_id = tagId;
    } else if (channel === "ble") {
      const eddystoneUid = body.beacon_eddystone_uid?.trim();
      const uuid = body.beacon_uuid?.trim();
      const major = Number(body.beacon_major ?? 0);
      const minor = Number(body.beacon_minor ?? 0);
      let beacon;
      if (eddystoneUid) {
        beacon = await getBeaconByEddystoneUid(eddystoneUid);
      } else if (uuid) {
        beacon = await getBeaconById(uuid, major, minor);
      }
      if (!beacon) {
        return reply.status(404).send({ ok: false, error: "Beacon no registrado." });
      }
      zoneId = beacon.zone_id;
      metadata.beacon_uuid = beacon.uuid;
      metadata.beacon_major = beacon.major;
      metadata.beacon_minor = beacon.minor;
      if (eddystoneUid) metadata.beacon_eddystone_uid = eddystoneUid;
      if (body.beacon_rssi != null) metadata.beacon_rssi = Number(body.beacon_rssi);
    }

    const auth = request.headers.authorization;
    let userIdAudit: string | null = null;
    if (auth?.startsWith("Bearer ")) {
      try {
        const { payload } = await jwtVerify(auth.slice(7), secret);
        userId = (payload.sub as string) || userId;
        userIdAudit = (payload.sub as string) || null;
      } catch {
        /* token opcional */
      }
    }

    const checkIn = await recordCheckIn({
      siteId,
      zoneId,
      userId,
      channel,
      metadata,
      ip,
      userIdAudit,
    });

    return reply.status(201).send({
      ok: true,
      check_in: {
        id: checkIn.id,
        site_id: checkIn.site_id,
        zone_id: checkIn.zone_id,
        channel: checkIn.channel,
        checked_in_at: checkIn.checked_in_at,
      },
      message: "Check-in registrado correctamente.",
    });
  });

  app.post<{ Params: { id: string } }>("/api/presence/check-out/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    const { id } = request.params;
    const ip = getClientIp(request);
    const ok = await recordCheckOut(id, ip, user?.sub ?? null);
    if (!ok) {
      return reply.status(404).send({ ok: false, error: "Check-in no encontrado o ya tiene check-out." });
    }
    return reply.status(200).send({ ok: true, message: "Check-out registrado." });
  });

  // --- Eventos / Historial ---
  app.get("/api/presence/events", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as {
      site_id?: string;
      zone_id?: string;
      user_id?: string;
      channel?: string;
      from?: string;
      to?: string;
      limit?: string;
      offset?: string;
    };
    const events = await getCheckIns({
      siteId: q.site_id,
      zoneId: q.zone_id,
      userId: q.user_id,
      channel: q.channel as CheckInChannel | undefined,
      from: q.from,
      to: q.to,
      limit: q.limit ? parseInt(q.limit, 10) : 100,
      offset: q.offset ? parseInt(q.offset, 10) : 0,
    });
    return reply.status(200).send({ ok: true, events });
  });

  app.get("/api/presence/active", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id?: string }).site_id;
    const active = await getActiveCheckIns(siteId);
    return reply.status(200).send({ ok: true, active });
  });

  // --- Zonas (admin) ---
  app.get("/api/presence/zones", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const zones = await getZonesBySite(siteId);
    return reply.status(200).send({ ok: true, zones });
  });

  // --- Inteligencia / Analytics ---
  app.get("/api/presence/analytics", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    const periodDays = parseInt((request.query as { period_days?: string }).period_days || "7", 10);
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const site = await getSiteById(siteId);
    if (!site) return reply.status(404).send({ ok: false, error: "Sitio no encontrado." });
    const zones = await getZonesBySite(siteId);
    const context = await getAnalyticsContext(siteId, zones, periodDays);
    return reply.status(200).send({ ok: true, analytics: context });
  });

  app.get("/api/presence/chart-data", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    const periodDays = parseInt((request.query as { period_days?: string }).period_days || "7", 10);
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const site = await getSiteById(siteId);
    if (!site) return reply.status(404).send({ ok: false, error: "Sitio no encontrado." });
    const data = await getChartData(siteId, periodDays);
    return reply.status(200).send({ ok: true, chart_data: data });
  });

  app.get("/api/presence/export", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { site_id: string; format?: string; period_days?: string };
    const siteId = q.site_id;
    const format = (q.format || "csv").toLowerCase();
    const periodDays = parseInt(q.period_days || "30", 10);
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const site = await getSiteById(siteId);
    if (!site) return reply.status(404).send({ ok: false, error: "Sitio no encontrado." });
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - periodDays);
    const checkIns = await getCheckIns({
      siteId,
      from: from.toISOString(),
      to: now.toISOString(),
      limit: 10000,
    });
    if (format === "json") {
      return reply
        .status(200)
        .header("Content-Type", "application/json")
        .header("Content-Disposition", `attachment; filename="presence-${siteId}-${from.toISOString().slice(0, 10)}.json"`)
        .send(JSON.stringify({ site_id: siteId, site_name: site.name, period_days: periodDays, check_ins: checkIns }, null, 2));
    }
    const headers = ["id", "site_id", "zone_id", "user_id", "channel", "checked_in_at", "checked_out_at"];
    const rows = checkIns.map((c) => [c.id, c.site_id, c.zone_id ?? "", c.user_id ?? "", c.channel, c.checked_in_at, c.checked_out_at ?? ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    return reply
      .status(200)
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="presence-${siteId}-${from.toISOString().slice(0, 10)}.csv"`)
      .send("\uFEFF" + csv);
  });

  app.get("/api/presence/co-presence", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { site_id: string; date?: string };
    const siteId = q.site_id;
    const dateStr = q.date || new Date().toISOString().slice(0, 10);
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const site = await getSiteById(siteId);
    if (!site) return reply.status(404).send({ ok: false, error: "Sitio no encontrado." });
    const zones = await getZonesBySite(siteId);
    const stats = await getCoPresenceStats(siteId, zones, dateStr);
    return reply.status(200).send({ ok: true, co_presence: stats });
  });

  app.get("/api/presence/occupancy", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const zones = await getZonesBySite(siteId);
    const metrics = await getOccupancyMetrics(siteId, zones);
    return reply.status(200).send({ ok: true, metrics });
  });

  app.get("/api/presence/validate-zone", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const q = request.query as { zone_id: string; lat: string; lng: string };
    const zoneId = q.zone_id;
    const lat = parseFloat(q.lat);
    const lng = parseFloat(q.lng);
    if (!zoneId || isNaN(lat) || isNaN(lng)) {
      return reply.status(400).send({ ok: false, error: "zone_id, lat y lng requeridos." });
    }
    const zone = await getZoneById(zoneId);
    if (!zone) return reply.status(404).send({ ok: false, error: "Zona no encontrada." });
    const result = validateLocationInZone(lat, lng, zone);
    return reply.status(200).send({ ok: true, validation: result });
  });

  // --- Admin: Sites, Beacons, NFC ---
  app.get("/api/presence/admin/sites", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const sites = getSites();
    return reply.status(200).send({ ok: true, sites });
  });

  app.post<{ Body: { name: string; enabled_channels?: string } }>("/api/presence/admin/sites", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body ?? {};
    const name = body.name?.trim();
    if (!name) {
      return reply.status(400).send({ ok: false, error: "name requerido." });
    }
    const site = await createSite(name, {}, body.enabled_channels || "geolocation,qr,wifi_portal");
    return reply.status(201).send({ ok: true, site });
  });

  app.post<{
    Body: {
      site_id: string;
      name: string;
      polygon_geojson: string;
      accuracy_threshold_meters?: number;
    };
  }>("/api/presence/admin/zones", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body ?? {};
    const { site_id, name, polygon_geojson } = body;
    if (!site_id?.trim() || !name?.trim()) {
      return reply.status(400).send({ ok: false, error: "site_id y name requeridos." });
    }
    let geojson = polygon_geojson;
    if (!geojson) {
      return reply.status(400).send({ ok: false, error: "polygon_geojson requerido (GeoJSON Polygon o Point)." });
    }
    if (typeof geojson === "string" && !geojson.trim().startsWith("{")) {
      try {
        const [lng, lat] = geojson.split(",").map((x) => parseFloat(x.trim()));
        if (!isNaN(lng) && !isNaN(lat)) {
          geojson = JSON.stringify({
            type: "Point",
            coordinates: [lng, lat],
          });
        }
      } catch {
        /* ignore */
      }
    }
    const parsed = parsePolygonFromGeoJson(typeof geojson === "string" ? geojson : JSON.stringify(geojson));
    if (!parsed) {
      return reply.status(400).send({ ok: false, error: "polygon_geojson inválido." });
    }
    const zone = await createZone(
      site_id.trim(),
      name.trim(),
      typeof geojson === "string" ? geojson : JSON.stringify(geojson),
      body.accuracy_threshold_meters ?? 50
    );
    return reply.status(201).send({ ok: true, zone });
  });

  app.put<{
    Params: { id: string };
    Body: { name?: string; polygon_geojson?: string; accuracy_threshold_meters?: number };
  }>("/api/presence/admin/zones/:id", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params;
    const body = request.body ?? {};
    const zone = await updateZone(id, {
      name: body.name?.trim(),
      polygon_geojson: body.polygon_geojson,
      accuracy_threshold_meters: body.accuracy_threshold_meters,
    });
    if (!zone) return reply.status(404).send({ ok: false, error: "Zona no encontrada." });
    return reply.status(200).send({ ok: true, zone });
  });

  app.delete<{ Params: { id: string } }>("/api/presence/admin/zones/:id", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params;
    const ok = await deleteZone(id);
    if (!ok) return reply.status(404).send({ ok: false, error: "Zona no encontrada." });
    return reply.status(200).send({ ok: true, message: "Zona eliminada." });
  });

  app.post<{
    Body: {
      site_id: string;
      zone_id: string;
      uuid?: string;
      major?: number;
      minor?: number;
      eddystone_uid?: string;
      name?: string;
    };
  }>("/api/presence/admin/beacons", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body ?? {};
    const { site_id, zone_id, uuid, eddystone_uid } = body;
    const edUid = eddystone_uid?.trim();
    const u = uuid?.trim();
    if (!site_id?.trim() || !zone_id?.trim()) {
      return reply.status(400).send({ ok: false, error: "site_id y zone_id requeridos." });
    }
    if (!u && !edUid) {
      return reply.status(400).send({ ok: false, error: "uuid (iBeacon) o eddystone_uid (Eddystone) requerido." });
    }
    const beacon = await addBeacon(
      site_id.trim(),
      zone_id.trim(),
      u || (edUid ?? ""),
      Number(body.major ?? 0),
      Number(body.minor ?? 0),
      body.name?.trim() || "Beacon",
      edUid || undefined
    );
    return reply.status(201).send({ ok: true, beacon });
  });

  app.get("/api/presence/admin/beacons", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const beacons = await getBeaconsBySite(siteId);
    return reply.status(200).send({ ok: true, beacons });
  });

  app.post<{
    Body: {
      site_id: string;
      zone_id: string;
      tag_id: string;
      name?: string;
    };
  }>("/api/presence/admin/nfc-tags", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body ?? {};
    const { site_id, zone_id, tag_id } = body;
    if (!site_id?.trim() || !zone_id?.trim() || !tag_id?.trim()) {
      return reply.status(400).send({ ok: false, error: "site_id, zone_id y tag_id requeridos." });
    }
    const tag = await addNfcTag(site_id.trim(), zone_id.trim(), tag_id.trim(), body.name?.trim() || "NFC Tag");
    return reply.status(201).send({ ok: true, tag });
  });

  app.get("/api/presence/admin/nfc-tags", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const siteId = (request.query as { site_id: string }).site_id;
    if (!siteId) {
      return reply.status(400).send({ ok: false, error: "site_id requerido." });
    }
    const tags = await getNfcTagsBySite(siteId);
    return reply.status(200).send({ ok: true, tags });
  });
}
