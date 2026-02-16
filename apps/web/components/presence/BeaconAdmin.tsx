"use client";

import { useState, useEffect } from "react";
import { Bluetooth, Plus, Loader2, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Beacon = { id: string; name: string; uuid: string; major: number; minor: number; zone_id: string };
type Zone = { id: string; name: string };

export function BeaconAdmin({ siteId }: { siteId: string }) {
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", uuid: "", major: 0, minor: 0, zone_id: "", useEddystone: false, eddystone_uid: "" });
  const [error, setError] = useState("");

  const headers = getAuthHeaders();

  useEffect(() => {
    if (!siteId || !Object.keys(headers).length) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${BASE}/api/presence/admin/beacons?site_id=${siteId}`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/api/presence/zones?site_id=${siteId}`, { headers }).then((r) => r.json()),
    ]).then(([beaconsRes, zonesRes]) => {
      if (beaconsRes.ok && Array.isArray(beaconsRes.beacons)) setBeacons(beaconsRes.beacons);
      if (zonesRes.ok && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
        if (zonesRes.zones.length > 0 && !form.zone_id) setForm((f) => ({ ...f, zone_id: zonesRes.zones[0].id }));
      }
      setLoading(false);
    });
  }, [siteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isEddystone = form.useEddystone && form.eddystone_uid.trim();
    if (!form.zone_id) {
      setError("Zona es requerida.");
      return;
    }
    if (!isEddystone && !form.uuid.trim()) {
      setError("UUID (iBeacon) o Eddystone UID es requerido.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        site_id: siteId,
        zone_id: form.zone_id,
        name: form.name.trim() || "Beacon",
      };
      if (isEddystone) {
        body.eddystone_uid = form.eddystone_uid.trim();
      } else {
        body.uuid = form.uuid.trim();
        body.major = Number(form.major) || 0;
        body.minor = Number(form.minor) || 0;
      }
      const res = await fetch(`${BASE}/api/presence/admin/beacons`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.beacon) {
        setBeacons((b) => [data.beacon, ...b]);
        setForm({ name: "", uuid: "", major: 0, minor: 0, zone_id: zones[0]?.id ?? "", useEddystone: false, eddystone_uid: "" });
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
        Cargando beacons...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-aplat-text flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-aplat-cyan" />
          Beacons BLE
        </h4>
        {zones.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aplat-cyan/20 text-aplat-cyan text-sm hover:bg-aplat-cyan/30"
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
          <label className="flex items-center gap-2 text-sm text-aplat-muted">
            <input
              type="checkbox"
              checked={form.useEddystone}
              onChange={(e) => setForm((f) => ({ ...f, useEddystone: e.target.checked }))}
              className="rounded"
            />
            Eddystone (en lugar de iBeacon)
          </label>
          {form.useEddystone ? (
            <input
              type="text"
              placeholder="Eddystone UID (32 hex: namespace+instance)"
              value={form.eddystone_uid}
              onChange={(e) => setForm((f) => ({ ...f, eddystone_uid: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm font-mono"
            />
          ) : (
            <>
              <input
                type="text"
                placeholder="UUID (ej. E2C56DB5-DFFB-48D2-B060-D0F5A71096E0)"
                value={form.uuid}
                onChange={(e) => setForm((f) => ({ ...f, uuid: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Major"
                  value={form.major || ""}
                  onChange={(e) => setForm((f) => ({ ...f, major: parseInt(e.target.value, 10) || 0 }))}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm"
                />
                <input
                  type="number"
                  placeholder="Minor"
                  value={form.minor || ""}
                  onChange={(e) => setForm((f) => ({ ...f, minor: parseInt(e.target.value, 10) || 0 }))}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm"
                />
              </div>
            </>
          )}
          <label className="block text-xs text-aplat-muted mb-0.5">Zona</label>
          <select
            value={form.zone_id}
            onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-aplat-text text-sm"
            aria-label="Zona"
          >
            <option value="">Seleccionar zona...</option>
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
              className="px-4 py-2 rounded-lg bg-aplat-cyan text-aplat-deep font-medium text-sm disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-white/5 text-aplat-muted text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {zones.length === 0 && (
        <p className="text-aplat-muted text-sm">
          No hay zonas en esta sede. Cree al menos una en la sección «Zonas» más arriba para poder añadir beacons.
        </p>
      )}
      {beacons.length === 0 && !showForm && zones.length > 0 && (
        <p className="text-aplat-muted text-sm">No hay beacons registrados. Añada uno para check-in por proximidad BLE.</p>
      )}
      {beacons.length > 0 && (
        <ul className="space-y-2">
          {beacons.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm">
              <div>
                <span className="text-aplat-text font-medium">{b.name}</span>
                <span className="text-aplat-muted ml-2 font-mono text-xs">
                  {b.uuid} / {b.major}:{b.minor}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
