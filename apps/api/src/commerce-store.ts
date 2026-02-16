/**
 * APlat Commerce — Catálogo de productos y pedidos.
 * Persistencia en JSON (APLAT_DATA_PATH).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.APLAT_DATA_PATH || path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "commerce-products.json");
const ORDERS_FILE = path.join(DATA_DIR, "commerce-orders.json");

export type CommerceProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  sku?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export type CommerceOrder = {
  id: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  total: number;
  currency: string;
  status: OrderStatus;
  customerEmail?: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

let products: CommerceProduct[] = [];
let orders: CommerceOrder[] = [];

function loadProducts(): CommerceProduct[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function loadOrders(): CommerceOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveProducts(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (err) {
    console.warn("[commerce-store] No se pudo guardar products:", err);
  }
}

function saveOrders(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.warn("[commerce-store] No se pudo guardar orders:", err);
  }
}

export function initCommerceStore(): void {
  products = loadProducts();
  orders = loadOrders();
  console.log("[commerce-store] Cargado:", products.length, "productos,", orders.length, "pedidos");
}

export function getAllProducts(): CommerceProduct[] {
  if (products.length === 0 && fs.existsSync(PRODUCTS_FILE)) products = loadProducts();
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

export function getProductById(id: string): CommerceProduct | undefined {
  if (products.length === 0) products = loadProducts();
  return products.find((p) => p.id === id);
}

export function createProduct(opts: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  sku?: string;
}): CommerceProduct {
  if (products.length === 0) products = loadProducts();
  const now = new Date().toISOString();
  const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const p: CommerceProduct = {
    id,
    name: opts.name,
    description: opts.description ?? "",
    price: opts.price,
    currency: opts.currency ?? "EUR",
    sku: opts.sku,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  products.push(p);
  saveProducts();
  return p;
}

export function getAllOrders(): CommerceOrder[] {
  if (orders.length === 0 && fs.existsSync(ORDERS_FILE)) orders = loadOrders();
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrderById(id: string): CommerceOrder | undefined {
  if (orders.length === 0) orders = loadOrders();
  return orders.find((o) => o.id === id);
}

export function createOrder(opts: {
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  customerEmail?: string;
  customerName?: string;
  notes?: string;
}): CommerceOrder {
  if (orders.length === 0) orders = loadOrders();
  const total = opts.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const now = new Date().toISOString();
  const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const o: CommerceOrder = {
    id,
    items: opts.items,
    total,
    currency: "EUR",
    status: "pending",
    customerEmail: opts.customerEmail,
    customerName: opts.customerName,
    notes: opts.notes,
    createdAt: now,
    updatedAt: now,
  };
  orders.push(o);
  saveOrders();
  return o;
}

export function updateOrderStatus(id: string, status: OrderStatus): CommerceOrder | undefined {
  if (orders.length === 0) orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  orders[idx] = { ...orders[idx], status, updatedAt: now };
  saveOrders();
  return orders[idx];
}
