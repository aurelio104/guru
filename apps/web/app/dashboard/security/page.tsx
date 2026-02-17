"use client";

import { useEffect, useState, useCallback } from "react";
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
  Pencil,
  Download,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
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
  remediation?: string;
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

const SEVERITY_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/20",
  high: "text-orange-400 bg-orange-500/20",
  critical: "text-red-400 bg-red-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Abierta",
  mitigated: "Mitigada",
  closed: "Cerrada",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-400",
  mitigated: "bg-blue-500/20 text-blue-400",
  closed: "bg-emerald-500/20 text-emerald-400",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function scanDuration(started: string, completed?: string): string | null {
  if (!completed) return null;
  try {
    const a = new Date(started).getTime();
    const b = new Date(completed).getTime();
    const s = Math.round((b - a) / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  } catch {
    return null;
  }
}

const emptyVulnForm = () => ({
  title: "",
  severity: "medium" as string,
  description: "",
  cve: "",
  asset: "",
  status: "open" as string,
  remediation: "",
});

export default function DashboardSecurityPage() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyVulnForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyVulnForm());
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, [fetchData]);

  const runScan = () => {
    if (!BASE) return;
    setScanning(true);
    setError(null);
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
    setSubmitting(true);
    setError(null);
    fetch(`${BASE}/api/security/vulnerabilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title: form.title.trim(),
        severity: form.severity,
        description: form.description.trim(),
        cve: form.cve.trim() || undefined,
        asset: form.asset.trim() || undefined,
        status: form.status,
        remediation: form.remediation.trim() || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setForm(emptyVulnForm());
          setShowForm(false);
          fetchData();
        } else setError(d.error || "Error al crear");
      })
      .finally(() => setSubmitting(false));
  };

  const openEdit = (v: Vulnerability) => {
    setEditingId(v.id);
    setEditForm({
      title: v.title,
      severity: v.severity,
      description: v.description,
      cve: v.cve || "",
      asset: v.asset || "",
      status: v.status,
      remediation: v.remediation || "",
    });
  };

  const handleUpdateVuln = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !editingId || !editForm.title.trim() || !editForm.description.trim()) return;
    setSubmitting(true);
    setError(null);
    fetch(`${BASE}/api/security/vulnerabilities/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title: editForm.title.trim(),
        severity: editForm.severity,
        description: editForm.description.trim(),
        cve: editForm.cve.trim() || undefined,
        asset: editForm.asset.trim() || undefined,
        status: editForm.status,
        remediation: editForm.remediation.trim() || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setEditingId(null);
          fetchData();
        } else setError(d.error || "Error al actualizar");
      })
      .finally(() => setSubmitting(false));
  };

  const deleteVuln = (id: string) => {
    if (!BASE || !confirm("¿Eliminar esta vulnerabilidad?")) return;
    fetch(`${BASE}/api/security/vulnerabilities/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => d.ok && fetchData());
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      total: vulnerabilities.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byStatus: { open: 0, mitigated: 0, closed: 0 },
      vulnerabilities,
    };
    vulnerabilities.forEach((v) => {
      if (payload.bySeverity[v.severity as keyof typeof payload.bySeverity] !== undefined)
        payload.bySeverity[v.severity as keyof typeof payload.bySeverity]++;
      if (payload.byStatus[v.status as keyof typeof payload.byStatus] !== undefined)
        payload.byStatus[v.status as keyof typeof payload.byStatus]++;
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `security-vulnerabilities-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openCount = vulnerabilities.filter((v) => v.status === "open").length;
  const criticalHigh = vulnerabilities.filter((v) => v.severity === "critical" || v.severity === "high").length;
  const lastScan = scans[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-guru-muted hover:text-guru-text mb-6"
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
          <div>
            <h1 className="text-2xl font-bold text-guru-text">Guru Security</h1>
            <p className="text-guru-muted text-sm">Vulnerabilidades, escaneos y estado de seguridad</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 hover:bg-guru-cyan/30 text-guru-cyan border border-guru-cyan/40 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Ejecutar escaneo
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-4 py-2 text-sm font-medium text-guru-text"
          >
            <Plus className="w-4 h-4" />
            Nueva vulnerabilidad
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-4 py-2 text-sm text-guru-muted hover:text-guru-text"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Resumen */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-guru-muted text-xs uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-guru-text">{vulnerabilities.length}</p>
            <p className="text-guru-muted text-xs">vulnerabilidades</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-guru-muted text-xs uppercase tracking-wider mb-1">Críticas / Altas</p>
            <p className="text-2xl font-bold text-orange-400">{criticalHigh}</p>
            <p className="text-guru-muted text-xs">prioridad</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-guru-muted text-xs uppercase tracking-wider mb-1">Abiertas</p>
            <p className="text-2xl font-bold text-amber-400">{openCount}</p>
            <p className="text-guru-muted text-xs">pendientes</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-guru-muted text-xs uppercase tracking-wider mb-1">Último escaneo</p>
            {lastScan ? (
              <>
                <p className="text-lg font-semibold text-guru-text">{lastScan.status === "completed" ? lastScan.findingsCount ?? 0 : "—"}</p>
                <p className="text-guru-muted text-xs">{lastScan.status} · {formatDate(lastScan.startedAt)}</p>
              </>
            ) : (
              <p className="text-guru-muted text-sm">Sin escaneos</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Form nueva vulnerabilidad */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreateVuln}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-guru-text mb-2">Nueva vulnerabilidad</h2>
          <p className="text-guru-muted text-sm mb-3">
            Registre un hallazgo manual o resultado de auditoría (OWASP, pentest). Incluya CVE si aplica y remediación recomendada.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-guru-muted mb-1">Título *</label>
              <input
                type="text"
                placeholder="Ej. XSS en formulario de contacto"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Severidad *</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
              >
                <option value="open">Abierta</option>
                <option value="mitigated">Mitigada</option>
                <option value="closed">Cerrada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">CVE (opcional)</label>
              <input
                type="text"
                placeholder="CVE-2024-XXXX"
                value={form.cve}
                onChange={(e) => setForm((f) => ({ ...f, cve: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Activo / componente (opcional)</label>
              <input
                type="text"
                placeholder="Ej. API pública, panel admin"
                value={form.asset}
                onChange={(e) => setForm((f) => ({ ...f, asset: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-guru-muted mb-1">Descripción *</label>
              <textarea
                placeholder="Detalle técnico del hallazgo, pasos para reproducir, impacto."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted min-h-[80px]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-guru-muted mb-1">Remediación (opcional)</label>
              <textarea
                placeholder="Acciones recomendadas para corregir o mitigar."
                value={form.remediation}
                onChange={(e) => setForm((f) => ({ ...f, remediation: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted min-h-[60px]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-guru-muted hover:text-guru-text"
            >
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vulnerabilidades */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-guru-text">Vulnerabilidades</h2>
            <button
              type="button"
              onClick={fetchData}
              className="p-1.5 rounded-lg text-guru-muted hover:bg-white/10 hover:text-guru-text"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading && vulnerabilities.length === 0 ? (
            <div className="flex items-center gap-2 text-guru-muted py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando...
            </div>
          ) : vulnerabilities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <Shield className="w-10 h-10 text-guru-muted/70 mx-auto mb-3" />
              <p className="text-guru-text font-medium mb-1">No hay vulnerabilidades registradas</p>
              <p className="text-guru-muted text-sm mb-4 max-w-sm mx-auto">
                Registre hallazgos manualmente o ejecute un escaneo para evaluar el estado de seguridad (OWASP, pentest, auditoría).
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-3 py-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Registrar primera vulnerabilidad
                </button>
                <button
                  type="button"
                  onClick={runScan}
                  disabled={scanning}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm text-guru-muted hover:text-guru-text disabled:opacity-60"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Ejecutar escaneo
                </button>
              </div>
            </motion.div>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {vulnerabilities.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-guru-text truncate">{v.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${SEVERITY_COLOR[v.severity] ?? "text-guru-muted"}`}>
                        {SEVERITY_LABEL[v.severity] ?? v.severity}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[v.status] ?? "bg-white/10 text-guru-muted"}`}>
                        {STATUS_LABEL[v.status] ?? v.status}
                      </span>
                      {v.asset && <span className="text-xs text-guru-muted">{v.asset}</span>}
                      {v.cve && (
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${v.cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-guru-cyan hover:underline"
                        >
                          {v.cve}
                        </a>
                      )}
                    </div>
                    {v.description && (
                      <p className="text-guru-muted text-xs mt-1 line-clamp-2">{v.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      className="p-1.5 rounded-lg text-guru-muted hover:bg-white/10 hover:text-guru-cyan"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVuln(v.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Últimos escaneos */}
        <section>
          <h2 className="text-lg font-semibold text-guru-text mb-3">Últimos escaneos</h2>
          {scans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <Play className="w-10 h-10 text-guru-muted/70 mx-auto mb-3" />
              <p className="text-guru-text font-medium mb-1">No hay escaneos aún</p>
              <p className="text-guru-muted text-sm mb-4">Ejecute un escaneo para evaluar el estado de seguridad.</p>
              <button
                type="button"
                onClick={runScan}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-4 py-2 text-sm disabled:opacity-60"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Ejecutar primer escaneo
              </button>
            </motion.div>
          ) : (
            <ul className="space-y-2">
              {scans.slice(0, 10).map((s) => {
                const dur = scanDuration(s.startedAt, s.completedAt);
                return (
                  <li
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-2 flex-wrap"
                  >
                    <div className="flex items-center gap-2">
                      {s.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {s.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-guru-cyan shrink-0" />}
                      {s.status === "pending" && <RefreshCw className="w-4 h-4 text-guru-muted shrink-0" />}
                      {s.status === "failed" && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-guru-text text-sm font-medium">{s.type === "manual" ? "Manual" : "Programado"}</span>
                      <span className="text-guru-muted text-xs">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-guru-muted">
                      {s.findingsCount != null && (
                        <span>{s.findingsCount} hallazgos</span>
                      )}
                      {dur && <span>{dur}</span>}
                      <span className="text-xs">{formatDate(s.startedAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Modal editar vulnerabilidad */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setEditingId(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-white/10 bg-guru-deep p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-guru-text">Editar vulnerabilidad</h2>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-2 rounded-lg text-guru-muted hover:bg-white/10 hover:text-guru-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateVuln} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-guru-muted mb-1">Título *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-guru-muted mb-1">Severidad</label>
                  <select
                    value={editForm.severity}
                    onChange={(e) => setEditForm((f) => ({ ...f, severity: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-guru-muted mb-1">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
                  >
                    <option value="open">Abierta</option>
                    <option value="mitigated">Mitigada</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-guru-muted mb-1">CVE</label>
                <input
                  type="text"
                  value={editForm.cve}
                  onChange={(e) => setEditForm((f) => ({ ...f, cve: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-guru-muted mb-1">Activo / componente</label>
                <input
                  type="text"
                  value={editForm.asset}
                  onChange={(e) => setEditForm((f) => ({ ...f, asset: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-guru-muted mb-1">Descripción *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text min-h-[80px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-guru-muted mb-1">Remediación</label>
                <textarea
                  value={editForm.remediation}
                  onChange={(e) => setEditForm((f) => ({ ...f, remediation: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text min-h-[60px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-guru-cyan/20 text-guru-cyan px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-guru-muted hover:text-guru-text"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
