"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Vulnerability = {
  id: string;
  title: string;
  severity: string;
  description: string;
  cve?: string;
  status: string;
  asset?: string;
  createdAt: string;
  updatedAt: string;
};

type Scan = {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  findingsCount?: number;
  error?: string;
  createdAt: string;
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/20",
  high: "text-orange-400 bg-orange-500/20",
  critical: "text-red-400 bg-red-500/20",
};

export default function DashboardSecurityPage() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    severity: "medium" as string,
    description: "",
    cve: "",
  });

  const fetchData = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${BASE}/api/security/vulnerabilities`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${BASE}/api/security/scans`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([vRes, sRes]) => {
        if (vRes.ok && Array.isArray(vRes.vulnerabilities)) setVulnerabilities(vRes.vulnerabilities);
        if (sRes.ok && Array.isArray(sRes.scans)) setScans(sRes.scans);
        if (!vRes.ok) setError(vRes.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, []);

  const runScan = () => {
    if (!BASE) return;
    setScanning(true);
    fetch(`${BASE}/api/security/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ type: "manual" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) fetchData();
        else setError(d.error || "Error al iniciar escaneo");
      })
      .finally(() => setScanning(false));
  };

  const handleCreateVuln = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !form.title.trim() || !form.description.trim()) return;
    fetch(`${BASE}/api/security/vulnerabilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title: form.title.trim(),
        severity: form.severity,
        description: form.description.trim(),
        cve: form.cve.trim() || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setForm({ title: "", severity: "medium", description: "", cve: "" });
          setShowForm(false);
          fetchData();
        } else setError(d.error || "Error al crear");
      });
  };

  const deleteVuln = (id: string) => {
    if (!BASE || !confirm("¿Eliminar esta vulnerabilidad?")) return;
    fetch(`${BASE}/api/security/vulnerabilities/${id}`, { method: "DELETE", headers: getAuthHeaders() })
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
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-amber-500/15 text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">APlat Security</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Ejecutar escaneo
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-4 py-2 text-sm font-medium text-aplat-text"
          >
            <Plus className="w-4 h-4" />
            Nueva vulnerabilidad
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreateVuln}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-aplat-text mb-3">Nueva vulnerabilidad</h2>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
              required
            />
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted min-h-[80px]"
              required
            />
            <input
              type="text"
              placeholder="CVE (opcional)"
              value={form.cve}
              onChange={(e) => setForm((f) => ({ ...f, cve: e.target.value }))}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="rounded-xl bg-aplat-cyan/20 text-aplat-cyan px-4 py-2 text-sm font-medium"
            >
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-aplat-text">Vulnerabilidades</h2>
            <button
              type="button"
              onClick={fetchData}
              className="p-1.5 rounded-lg text-aplat-muted hover:bg-white/10 hover:text-aplat-text"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading && vulnerabilities.length === 0 ? (
            <div className="flex items-center gap-2 text-aplat-muted py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando...
            </div>
          ) : vulnerabilities.length === 0 ? (
            <p className="text-aplat-muted py-6">No hay vulnerabilidades registradas.</p>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto">
              {vulnerabilities.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-aplat-text truncate">{v.title}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${SEVERITY_COLOR[v.severity] ?? "text-aplat-muted"}`}
                    >
                      {v.severity}
                    </span>
                    {v.cve && <span className="ml-2 text-xs text-aplat-muted">{v.cve}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteVuln(v.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-lg font-semibold text-aplat-text mb-3">Últimos escaneos</h2>
          {scans.length === 0 ? (
            <p className="text-aplat-muted py-6">No hay escaneos aún.</p>
          ) : (
            <ul className="space-y-2">
              {scans.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    {s.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {s.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-aplat-cyan" />}
                    {s.status === "pending" && <RefreshCw className="w-4 h-4 text-aplat-muted" />}
                    {s.status === "failed" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span className="text-aplat-text text-sm">{s.type}</span>
                    <span className="text-aplat-muted text-xs">{s.status}</span>
                  </div>
                  {s.findingsCount != null && (
                    <span className="text-aplat-muted text-sm">{s.findingsCount} hallazgos</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
