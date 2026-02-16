"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Asset = {
  id: string;
  name: string;
  description: string;
  beaconId: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", beaconId: "", siteId: "" });

  const fetchAssets = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/assets`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.assets)) setAssets(d.assets);
        else setError(d.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !form.name.trim() || !form.beaconId.trim() || !form.siteId.trim()) return;
    setSubmitting(true);
    fetch(`${BASE}/api/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        beaconId: form.beaconId.trim(),
        siteId: form.siteId.trim(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setForm({ name: "", description: "", beaconId: "", siteId: "" });
          setShowForm(false);
          fetchAssets();
        } else setError(d.error || "Error al crear");
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (id: string) => {
    if (!BASE || !confirm("¿Eliminar este activo?")) return;
    fetch(`${BASE}/api/assets/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) fetchAssets();
      });
  };

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
          <div className="rounded-xl p-2 bg-aplat-cyan/15 text-aplat-cyan">
            <Package className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">Activos (tracking BLE)</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo activo
        </button>
      </motion.div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-aplat-text mb-3">Nuevo activo</h2>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
              required
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
            />
            <input
              type="text"
              placeholder="ID del beacon"
              value={form.beaconId}
              onChange={(e) => setForm((f) => ({ ...f, beaconId: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
              required
            />
            <input
              type="text"
              placeholder="ID del sitio"
              value={form.siteId}
              onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
              required
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-aplat-muted hover:text-aplat-text"
            >
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-aplat-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando activos...
        </div>
      )}
      {!loading && assets.length === 0 && !showForm && (
        <p className="text-aplat-muted py-8">No hay activos. Añade uno con «Nuevo activo».</p>
      )}
      {!loading && assets.length > 0 && (
        <ul className="space-y-3">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-aplat-text">{asset.name}</p>
                {asset.description && (
                  <p className="text-sm text-aplat-muted mt-0.5">{asset.description}</p>
                )}
                <p className="text-xs text-aplat-muted mt-1">
                  Beacon: {asset.beaconId} · Sitio: {asset.siteId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(asset.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
