/**
 * Geofencing: validación de coordenadas dentro de un radio (haversine).
 * Omac: órdenes de trabajo con validación de llegada a punto.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import {
  getAllOrders as getOmacOrders,
  getOrderById as getOmacOrderById,
  createOrder as createOmacOrder,
  updateOrderStatus as updateOmacOrderStatus,
  initOmacStore,
} from "./omac-store.js";

const EARTH_RADIUS_M = 6_371_000;

function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export async function registerGeofencingRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/geofencing/validate", async (request, reply) => {
    const q = request.query as {
      lat?: string;
      lng?: string;
      target_lat?: string;
      target_lng?: string;
      radius_m?: string;
    };
    const lat = Number(q.lat);
    const lng = Number(q.lng);
    const targetLat = Number(q.target_lat);
    const targetLng = Number(q.target_lng);
    const radiusM = Number(q.radius_m) || 100;

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(targetLat) || Number.isNaN(targetLng)) {
      return reply.status(400).send({
        ok: false,
        error: "Parámetros requeridos: lat, lng, target_lat, target_lng (números). Opcional: radius_m (metros).",
      });
    }
    if (lat < -90 || lat > 90 || targetLat < -90 || targetLat > 90) {
      return reply.status(400).send({ ok: false, error: "Latitud debe estar entre -90 y 90." });
    }
    if (lng < -180 || lng > 180 || targetLng < -180 || targetLng > 180) {
      return reply.status(400).send({ ok: false, error: "Longitud debe estar entre -180 y 180." });
    }

    const distanceM = haversineDistanceM(lat, lng, targetLat, targetLng);
    const inside = distanceM <= radiusM;

    return reply.status(200).send({
      ok: true,
      inside,
      distance_m: Math.round(distanceM * 100) / 100,
      radius_m: radiusM,
    });
  });

  // --- Omac: órdenes de trabajo y validación de llegada ---
  initOmacStore();

  async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<{ sub?: string; email?: string } | null> {
    const auth = request.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      await reply.status(401).send({ ok: false, error: "No autorizado." });
      return null;
    }
    try {
      const secret = new TextEncoder().encode(process.env.GURU_JWT_SECRET || "dev-guru-secret-SOLO-DESARROLLO-CAMBIAR");
      const { payload } = await jwtVerify(token, secret);
      return payload as { sub?: string; email?: string };
    } catch {
      await reply.status(401).send({ ok: false, error: "Token inválido." });
      return null;
    }
  }

  app.get("/api/geofencing/omac/orders", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getOmacOrders();
    return reply.status(200).send({ ok: true, orders: list });
  });

  app.post("/api/geofencing/omac/orders", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { title: string; target_lat: number; target_lng: number; radius_m?: number };
    if (!body.title || body.target_lat == null || body.target_lng == null) {
      return reply.status(400).send({ ok: false, error: "Faltan title, target_lat o target_lng." });
    }
    const order = createOmacOrder({
      title: body.title,
      targetLat: body.target_lat,
      targetLng: body.target_lng,
      radiusM: body.radius_m,
    });
    return reply.status(201).send({ ok: true, order });
  });

  app.post("/api/geofencing/omac/validate-arrival", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as { order_id: string; lat: number; lng: number };
    if (!body.order_id || body.lat == null || body.lng == null) {
      return reply.status(400).send({ ok: false, error: "Faltan order_id, lat o lng." });
    }
    const order = getOmacOrderById(body.order_id);
    if (!order) return reply.status(404).send({ ok: false, error: "Orden no encontrada." });
    const distanceM = haversineDistanceM(body.lat, body.lng, order.targetLat, order.targetLng);
    const inside = distanceM <= order.radiusM;
    if (inside && order.status !== "arrived" && order.status !== "completed") {
      updateOmacOrderStatus(order.id, "arrived", new Date().toISOString());
    }
    return reply.status(200).send({
      ok: true,
      inside,
      distance_m: Math.round(distanceM * 100) / 100,
      radius_m: order.radiusM,
      order_status: inside ? "arrived" : order.status,
    });
  });
}
