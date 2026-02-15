"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type NfcTag = { id: string; name: string; tag_id: string; zone_id: string };
type Zone = { id: string; name: string };

export function NfcTagAdmin({ siteId }: { siteId: string }) {
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", tag_id: "", zone_id: "" });
  const [error, setError] = useState("");

  const headers = getAuthHeaders();

  useEffect(() => {
    if (!siteId || !Object.keys(headers).length) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${BASE}/api/presence/admin/nfc-tags?site_id=${siteId}`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/api/presence/zones?site_id=${siteId}`, { headers }).then((r) => r.json()),
    ]).then(([tagsRes, zonesRes]) => {
      if (tagsRes.ok && Array.isArray(tagsRes.tags)) setTags(tagsRes.tags);
      if (zonesRes.ok && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
        if (zonesRes.zones.length > 0 && !form.zone_id) setForm((f) => ({ ...f, zone_id: zonesRes.zones[0].id }));
      }
      setLoading(false);
    });
  }, [siteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tag_id.trim() || !form.zone_id) {
      setError("Tag ID y zona son requeridos.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/presence/admin/nfc-tags`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          zone_id: form.zone_id,
          tag_id: form.tag_id.trim(),
          name: form.name.trim() || "NFC Tag",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.tag) {
        setTags((t) => [data.tag, ...t]);
        setForm({ name: "", tag_id: "", zone_id: zones[0]?.id ?? "" });
        setShowForm(false);
      } else {
        setError(data.error || "Error al registrar.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-aplat-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando tags NFC...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-aplat-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-aplat-violet" />
          Tags NFC
        </h4>
        {zones.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aplat-violet/20 text-aplat-violet text-sm hover:bg-aplat-violet/30"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        )}
      </div>

      {showForm && zones.length > 0 && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm"
          />
          <input
            type="text"
            placeholder="Tag ID (escaneado o ingresado)"
            value={form.tag_id}
            onChange={(e) => setForm((f) => ({ ...f, tag_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm font-mono"
          />
          <select
            value={form.zone_id}
            onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-aplat-violet text-white font-medium text-sm disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-white/5 text-aplat-muted text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {tags.length === 0 && !showForm && (
        <p className="text-aplat-muted text-sm">No hay tags NFC. Añada uno para check-in por NFC (Chrome Android).</p>
      )}
      {tags.length > 0 && (
        <ul className="space-y-2">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm">
              <div>
                <span className="text-aplat-text font-medium">{t.name}</span>
                <span className="text-aplat-muted ml-2 font-mono text-xs">{t.tag_id}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
