"use client";

import { useEffect, useState, useCallback } from "react";
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

type Site = { id: string; name: string };
type Beacon = { id: string; name: string; uuid: string; major: number; minor: number; zone_id: string };

export default function DashboardAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [beaconsLoading, setBeaconsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", beaconId: "", siteId: "" });

  const fetchAssets = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (!BASE || !getAuthHeaders().Authorization) return;
    fetch(`${BASE}/api/presence/admin/sites`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.sites)) setSites(d.sites);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!BASE || !form.siteId) {
      setBeacons([]);
      return;
    }
    setBeaconsLoading(true);
    fetch(`${BASE}/api/presence/admin/beacons?site_id=${encodeURIComponent(form.siteId)}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.beacons)) setBeacons(d.beacons);
        else setBeacons([]);
      })
      .catch(() => setBeacons([]))
      .finally(() => setBeaconsLoading(false));
  }, [form.siteId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !form.name.trim() || !form.beaconId.trim() || !form.siteId.trim()) return;
    setSubmitting(true);
    setError(null);
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

  const canCreate = sites.length > 0 && (form.siteId ? beacons.length > 0 : true);

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
          <p className="text-aplat-muted text-sm mb-3">
            Asocie un beacon BLE de Presence a un activo (equipo, mochila, etc.) para hacer tracking.
          </p>
          {sites.length === 0 ? (
            <p className="text-amber-400/90 text-sm py-2">
              No hay sedes en Presence. Cree una en Dashboard → Presence para poder elegir sede y beacon.
            </p>
          ) : (
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-aplat-muted mb-1">Sede</label>
                <select
                  value={form.siteId}
                  onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value, beaconId: "" }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text"
                  required
                >
                  <option value="">Seleccionar sede...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {form.siteId && (
                <div>
                  <label className="block text-sm font-medium text-aplat-muted mb-1">Beacon</label>
                  {beaconsLoading ? (
                    <div className="flex items-center gap-2 text-aplat-muted text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando beacons...
                    </div>
                  ) : beacons.length === 0 ? (
                    <p className="text-amber-400/90 text-sm py-2">
                      No hay beacons en esta sede. Añada uno en Dashboard → Presence (sección Beacons BLE).
                    </p>
                  ) : (
                    <select
                      value={form.beaconId}
                      onChange={(e) => setForm((f) => ({ ...f, beaconId: e.target.value }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text"
                      required
                    >
                      <option value="">Seleccionar beacon...</option>
                      {beacons.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.uuid.slice(0, 8)}… {b.major}:{b.minor})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-aplat-muted mb-1">Nombre del activo</label>
                <input
                  type="text"
                  placeholder="Ej. Mochila oficina, Laptop sala 2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-aplat-muted mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  placeholder="Detalles adicionales"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting || !canCreate || !form.name.trim() || !form.beaconId.trim() || !form.siteId.trim()}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
        >
          <Package className="w-12 h-12 text-aplat-muted/70 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-aplat-text mb-2">No hay activos registrados</h2>
          <p className="text-aplat-muted text-sm max-w-md mx-auto mb-5">
            Cree un activo para asociar un beacon BLE (de Presence) a un elemento físico y hacer tracking — por ejemplo equipos, mochilas o dispositivos.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Crear primer activo
          </button>
        </motion.div>
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
