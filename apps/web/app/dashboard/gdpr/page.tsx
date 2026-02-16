"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileCheck, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type GdprItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  notes?: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "done", label: "Hecho" },
  { value: "na", label: "N/A" },
];

const CATEGORY_LABEL: Record<string, string> = {
  legal: "Legal",
  rights: "Derechos",
  security: "Seguridad",
  breach: "Brecha",
};

export default function DashboardGdprPage() {
  const [items, setItems] = useState<GdprItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/gdpr/checklist`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) setItems(d.items);
        else setError(d.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  const updateStatus = (id: string, status: string) => {
    if (!BASE) return;
    fetch(`${BASE}/api/gdpr/checklist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, updatedAt: d.item.updatedAt } : i)));
      });
  };

  const byCategory = items.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, GdprItem[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text mb-6"
      >
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
            <FileCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">GDPR / LOPD</h1>
        </div>
        <button
          type="button"
          onClick={fetchChecklist}
          className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-aplat-muted hover:text-aplat-text"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-aplat-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando checklist...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, list]) => (
            <section key={cat} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold text-aplat-text mb-3">
                {CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <ul className="space-y-2">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 p-3 border border-white/5"
                  >
                    <div>
                      <p className="font-medium text-aplat-text">{item.title}</p>
                      <p className="text-sm text-aplat-muted">{item.description}</p>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm text-aplat-text"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
