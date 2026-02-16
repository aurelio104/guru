"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Loader2,
  RefreshCw,
  BookOpen,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Incident = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  playbookId?: string;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string;
};

type Playbook = { id: string; name: string; description: string; steps: string[] };

const SEV_COLOR: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/20",
  high: "text-orange-400 bg-orange-500/20",
  critical: "text-red-400 bg-red-500/20",
};

const SEV_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  investigating: "Investigando",
  contained: "Contenido",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export default function DashboardIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium" as string, playbookId: "" });

  const fetchData = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${BASE}/api/incidents`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${BASE}/api/incidents/playbooks`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([iRes, pRes]) => {
        if (iRes.ok && Array.isArray(iRes.incidents)) setIncidents(iRes.incidents);
        if (pRes.ok && Array.isArray(pRes.playbooks)) setPlaybooks(pRes.playbooks);
        if (!iRes.ok) setError(iRes.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !form.title.trim() || !form.description.trim()) return;
    fetch(`${BASE}/api/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        playbookId: form.playbookId || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setForm({ title: "", description: "", severity: "medium", playbookId: "" });
          setShowForm(false);
          fetchData();
        } else setError(d.error || "Error al crear");
      });
  };

  const seedPlaybooks = () => {
    if (!BASE) return;
    fetch(`${BASE}/api/incidents/playbooks/seed`, { method: "POST", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.playbooks)) setPlaybooks(d.playbooks);
      });
  };

  const updateStatus = (id: string, status: string) => {
    if (!BASE) return;
    const body: { status: string; resolvedAt?: string } = { status };
    if (status === "resolved" || status === "closed") body.resolvedAt = new Date().toISOString();
    fetch(`${BASE}/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => d.ok && fetchData());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
          <div className="rounded-xl p-2 bg-orange-500/15 text-orange-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-aplat-text">Incidentes</h1>
            <p className="text-aplat-muted text-sm">Registro y respuesta ante incidentes de seguridad</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo incidente
          </button>
          <button
            type="button"
            onClick={seedPlaybooks}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-400 px-3 py-2 text-sm hover:bg-orange-500/20"
            title="Añadir playbooks por defecto que falten"
          >
            Completar playbooks
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-aplat-muted hover:text-aplat-text"
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

      {!loading && incidents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-aplat-muted text-xs uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-aplat-text">{incidents.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-aplat-muted text-xs uppercase tracking-wider">Abiertos</p>
            <p className="text-xl font-bold text-amber-400">{incidents.filter((i) => i.status === "open" || i.status === "investigating").length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-aplat-muted text-xs uppercase tracking-wider">Críticos / Altos</p>
            <p className="text-xl font-bold text-orange-400">{incidents.filter((i) => i.severity === "critical" || i.severity === "high").length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-aplat-muted text-xs uppercase tracking-wider">Resueltos / Cerrados</p>
            <p className="text-xl font-bold text-emerald-400">{incidents.filter((i) => i.status === "resolved" || i.status === "closed").length}</p>
          </div>
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-aplat-text mb-3">Nuevo incidente</h2>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
              required
            />
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted min-h-[80px]"
              required
            />
            <div>
              <label className="block text-sm font-medium text-aplat-muted mb-1">Severidad</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-aplat-muted mb-1">Playbook (opcional)</label>
              <select
                value={form.playbookId}
                onChange={(e) => setForm((f) => ({ ...f, playbookId: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text"
              >
                <option value="">Sin playbook</option>
                {playbooks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="rounded-xl bg-aplat-cyan/20 text-aplat-cyan px-4 py-2 text-sm font-medium">
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

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold text-aplat-text mb-3">Incidentes</h2>
          {loading && incidents.length === 0 ? (
            <div className="flex items-center gap-2 text-aplat-muted py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando...
            </div>
          ) : incidents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <AlertTriangle className="w-10 h-10 text-aplat-muted/70 mx-auto mb-3" />
              <p className="text-aplat-text font-medium mb-1">No hay incidentes</p>
              <p className="text-aplat-muted text-sm mb-4 max-w-sm mx-auto">
                Registre un incidente cuando detecte una brecha, malware, phishing o cualquier evento de seguridad que requiera seguimiento.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Registrar primer incidente
              </button>
            </motion.div>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {incidents.map((i) => {
                const playbook = i.playbookId ? playbooks.find((p) => p.id === i.playbookId) : null;
                return (
                  <li
                    key={i.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-aplat-text">{i.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${SEV_COLOR[i.severity] ?? ""}`}>
                          {SEV_LABEL[i.severity] ?? i.severity}
                        </span>
                        <span className="text-aplat-muted text-xs">{STATUS_LABEL[i.status] ?? i.status}</span>
                        {playbook && <span className="text-xs text-aplat-cyan">{playbook.name}</span>}
                      </div>
                      {i.description && <p className="text-aplat-muted text-xs mt-1 line-clamp-2">{i.description}</p>}
                      <p className="text-aplat-muted text-xs mt-1">{new Date(i.reportedAt).toLocaleString("es")}</p>
                    </div>
                    <select
                      value={i.status}
                      onChange={(e) => updateStatus(i.id, e.target.value)}
                      className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-aplat-text shrink-0"
                    >
                      <option value="open">Abierto</option>
                      <option value="investigating">Investigando</option>
                      <option value="contained">Contenido</option>
                      <option value="resolved">Resuelto</option>
                      <option value="closed">Cerrado</option>
                    </select>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-lg font-semibold text-aplat-text mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Playbooks
          </h2>
          {playbooks.length === 0 ? (
            <p className="text-aplat-muted py-6">No hay playbooks. Use «Completar playbooks» para cargar los por defecto.</p>
          ) : (
            <ul className="space-y-2">
              {playbooks.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium text-aplat-text">{p.name}</p>
                  <p className="text-sm text-aplat-muted mt-1">{p.description}</p>
                  <ol className="mt-2 list-decimal list-inside text-sm text-aplat-muted space-y-0.5">
                    {p.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
