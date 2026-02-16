/**
 * APlat Commerce — API productos y pedidos.
 * Opcional: notificación WhatsApp al crear pedido (APLAT_COMMERCE_NOTIFY_PHONE).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";
import { sendWhatsAppMessage } from "./whatsapp.js";
import {
  getAllProducts,
  getProductById,
  createProduct,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  initCommerceStore,
} from "./commerce-store.js";
import type { OrderStatus } from "./commerce-store.js";

type AuthPayload = { sub?: string; email?: string; role?: string };

async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.APLAT_JWT_SECRET || "dev-aplat-secret-SOLO-DESARROLLO-CAMBIAR";
  return new TextEncoder().encode(secret);
}

async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<AuthPayload | null> {
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

async function requireMaster(request: FastifyRequest, reply: FastifyReply): Promise<AuthPayload | null> {
  const user = await requireAuth(request, reply);
  if (!user) return null;
  if (user.role !== "master") {
    await reply.status(403).send({ ok: false, error: "Se requiere rol master." });
    return null;
  }
  return user;
}

export async function registerCommerceRoutes(app: FastifyInstance): Promise<void> {
  initCommerceStore();

  app.get("/api/commerce/products", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllProducts();
    return reply.status(200).send({ ok: true, products: list });
  });

  app.get("/api/commerce/products/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const p = getProductById(id);
    if (!p) return reply.status(404).send({ ok: false, error: "Producto no encontrado." });
    return reply.status(200).send({ ok: true, product: p });
  });

  app.post("/api/commerce/products", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const body = request.body as {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      sku?: string;
    };
    if (!body.name || body.price == null) {
      return reply.status(400).send({ ok: false, error: "Faltan name o price." });
    }
    const p = createProduct(body);
    return reply.status(201).send({ ok: true, product: p });
  });

  app.get("/api/commerce/orders", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const list = getAllOrders();
    return reply.status(200).send({ ok: true, orders: list });
  });

  app.get("/api/commerce/orders/:id", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const o = getOrderById(id);
    if (!o) return reply.status(404).send({ ok: false, error: "Pedido no encontrado." });
    return reply.status(200).send({ ok: true, order: o });
  });

  app.post("/api/commerce/orders", async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;
    const body = request.body as {
      items: { productId: string; name: string; quantity: number; unitPrice: number }[];
      customerEmail?: string;
      customerName?: string;
      notes?: string;
    };
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({ ok: false, error: "items es obligatorio y no puede estar vacío." });
    }
    for (const it of body.items) {
      const prod = getProductById(it.productId);
      if (!prod) return reply.status(400).send({ ok: false, error: `Producto ${it.productId} no encontrado.` });
    }
    const o = createOrder({
      items: body.items,
      customerEmail: body.customerEmail ?? user.email,
      customerName: body.customerName,
      notes: body.notes,
    });
    const notifyPhone = process.env.APLAT_COMMERCE_NOTIFY_PHONE?.trim();
    if (notifyPhone) {
      try {
        const lines = [`Nuevo pedido ${o.id}`, `Total: ${o.total} ${o.currency}`, o.customerEmail ? `Cliente: ${o.customerEmail}` : ""].filter(Boolean);
        await sendWhatsAppMessage(notifyPhone, lines.join("\n"));
      } catch {
        // ignore
      }
    }
    return reply.status(201).send({ ok: true, order: o });
  });

  app.patch("/api/commerce/orders/:id/status", async (request, reply) => {
    const user = await requireMaster(request, reply);
    if (!user) return;
    const { id } = request.params as { id: string };
    const body = request.body as { status: OrderStatus };
    if (!body.status) return reply.status(400).send({ ok: false, error: "Falta status." });
    const o = updateOrderStatus(id, body.status);
    if (!o) return reply.status(404).send({ ok: false, error: "Pedido no encontrado." });
    return reply.status(200).send({ ok: true, order: o });
  });
}
