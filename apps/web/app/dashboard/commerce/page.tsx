"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Product = { id: string; name: string; price: number; currency: string; active: boolean };
type Order = { id: string; total: number; currency: string; status: string; createdAt: string };

export default function DashboardCommercePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!BASE) return;
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/commerce/products`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${BASE}/api/commerce/orders`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([pRes, oRes]) => {
        if (pRes.ok && Array.isArray(pRes.products)) setProducts(pRes.products);
        if (oRes.ok && Array.isArray(oRes.orders)) setOrders(oRes.orders);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-emerald-500/15 text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">Commerce</h1>
        </div>
        <button type="button" onClick={fetchData} className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-aplat-muted hover:text-aplat-text">
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>
      {loading && products.length === 0 && orders.length === 0 ? (
        <div className="flex items-center gap-2 text-aplat-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-aplat-text mb-3">Productos</h2>
            {products.length === 0 ? (
              <p className="text-aplat-muted py-4">No hay productos. Crear desde API (rol master).</p>
            ) : (
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex justify-between">
                    <span className="text-aplat-text">{p.name}</span>
                    <span className="text-aplat-muted">{p.price} {p.currency}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-aplat-text mb-3">Pedidos</h2>
            {orders.length === 0 ? (
              <p className="text-aplat-muted py-4">No hay pedidos.</p>
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 15).map((o) => (
                  <li key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex justify-between">
                    <span className="text-aplat-text text-sm">{o.id}</span>
                    <span className="text-aplat-muted text-sm">{o.total} {o.currency} · {o.status}</span>
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
