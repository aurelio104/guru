"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Loader2, RefreshCw, Plus } from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  active: boolean;
};

type Order = {
  id: string;
  total: number;
  currency: string;
  status: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-guru-cyan/20 text-guru-cyan",
  shipped: "bg-guru-violet/20 text-guru-violet",
  delivered: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function DashboardCommercePage() {
  const { user } = useDashboardUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", currency: "EUR" });
  const [submitting, setSubmitting] = useState(false);

  const isMaster = user?.role === "master";

  const fetchData = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${BASE}/api/commerce/products`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${BASE}/api/commerce/orders`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([pRes, oRes]) => {
        if (pRes.ok && Array.isArray(pRes.products)) setProducts(pRes.products);
        if (oRes.ok && Array.isArray(oRes.orders)) setOrders(oRes.orders);
        if (!pRes.ok) setError(pRes.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(productForm.price);
    if (!BASE || !productForm.name.trim() || isNaN(price) || price < 0) return;
    setSubmitting(true);
    setError(null);
    fetch(`${BASE}/api/commerce/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        price,
        currency: productForm.currency || "EUR",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setProductForm({ name: "", description: "", price: "", currency: "EUR" });
          setShowProductForm(false);
          fetchData();
        } else setError(d.error || "Error al crear producto");
      })
      .finally(() => setSubmitting(false));
  };

  const updateOrderStatus = (orderId: string, status: string) => {
    if (!BASE || !isMaster) return;
    fetch(`${BASE}/api/commerce/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((d) => d.ok && fetchData());
  };

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-guru-muted hover:text-guru-text mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-emerald-500/15 text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-guru-text">Commerce</h1>
            <p className="text-guru-muted text-sm">Productos y pedidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMaster && (
            <button
              type="button"
              onClick={() => { setShowProductForm(!showProductForm); setError(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-4 py-2 text-sm font-medium hover:bg-guru-cyan/30"
            >
              <Plus className="w-4 h-4" />
              Nuevo producto
            </button>
          )}
          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-guru-muted hover:text-guru-text"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {!loading && (products.length > 0 || orders.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Productos</p>
            <p className="text-xl font-bold text-guru-text">{products.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Pedidos</p>
            <p className="text-xl font-bold text-guru-text">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-amber-400">{pendingOrders}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Activos</p>
            <p className="text-xl font-bold text-emerald-400">{products.filter((p) => p.active).length}</p>
          </div>
        </div>
      )}

      {isMaster && showProductForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreateProduct}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-guru-text mb-3">Nuevo producto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Nombre *</label>
              <input
                type="text"
                placeholder="Ej. Plan básico, Servicio premium"
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={productForm.price}
                onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-guru-muted mb-1">Descripción (opcional)</label>
              <textarea
                placeholder="Detalle del producto"
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted min-h-[60px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Moneda</label>
              <select
                value={productForm.currency}
                onChange={(e) => setProductForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-guru-cyan/20 text-guru-cyan px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowProductForm(false)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-guru-muted hover:text-guru-text"
            >
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {loading && products.length === 0 && orders.length === 0 ? (
        <div className="flex items-center gap-2 text-guru-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-guru-text mb-3">Productos</h2>
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <ShoppingCart className="w-10 h-10 text-guru-muted/70 mx-auto mb-3" />
                <p className="text-guru-text font-medium mb-1">No hay productos</p>
                <p className="text-guru-muted text-sm mb-4 max-w-sm mx-auto">
                  {isMaster
                    ? "Añada productos para poder recibir pedidos. Los pedidos se crean desde la API o el flujo de compra."
                    : "El catálogo de productos se gestiona desde el panel (rol master)."}
                </p>
                {isMaster && (
                  <button
                    type="button"
                    onClick={() => setShowProductForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-4 py-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir primer producto
                  </button>
                )}
              </motion.div>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-guru-text">{p.name}</p>
                      {p.description && (
                        <p className="text-sm text-guru-muted mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                      <p className="text-xs text-guru-muted mt-1">
                        {p.price} {p.currency}
                        {!p.active && <span className="ml-2 text-amber-400">· Inactivo</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-guru-text mb-3">Pedidos</h2>
            {orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <ShoppingCart className="w-10 h-10 text-guru-muted/70 mx-auto mb-3" />
                <p className="text-guru-text font-medium mb-1">No hay pedidos</p>
                <p className="text-guru-muted text-sm max-w-sm mx-auto">
                  Los pedidos se crean al realizar una compra (API o flujo de checkout). Configure productos y el flujo de pedidos para empezar.
                </p>
              </motion.div>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {orders.slice(0, 20).map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-guru-text text-sm">{o.id}</p>
                      <p className="text-guru-muted text-sm">
                        {o.total} {o.currency}
                        {o.customerName && ` · ${o.customerName}`}
                        {o.customerEmail && !o.customerName && ` · ${o.customerEmail}`}
                      </p>
                      <p className="text-xs text-guru-muted mt-1">{new Date(o.createdAt).toLocaleString("es")}</p>
                    </div>
                    {isMaster ? (
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className={`rounded-lg px-2 py-1 text-xs shrink-0 ${ORDER_STATUS_COLOR[o.status] ?? ""} bg-white/5 border border-white/10 text-guru-text`}
                      >
                        {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs shrink-0 ${ORDER_STATUS_COLOR[o.status] ?? "bg-white/10 text-guru-muted"}`}>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
