"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Plus, Loader2, RefreshCw, Upload, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Report = { id: string; title: string; description?: string; type: string; status: string; createdAt: string; updatedAt?: string };
type ExcelResult = { reportId: string; columns: string[]; rows: Record<string, string | number>[]; totalRows: number };

const TYPE_LABEL: Record<string, string> = {
  manual: "Manual",
  scheduled: "Programado",
  export: "Exportación",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  generating: "Generando",
  ready: "Listo",
  failed: "Fallido",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-guru-muted/20 text-guru-muted",
  generating: "bg-guru-cyan/20 text-guru-cyan",
  ready: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function DashboardReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "manual" as string });
  const [excelResult, setExcelResult] = useState<ExcelResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchReports = () => {
    if (!BASE) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/reports`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.reports)) setReports(d.reports);
        else setError(d.error || "Error al cargar");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !BASE) return;
    setUploadError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${BASE}/api/reports/upload-excel`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setExcelResult({ reportId: data.reportId, columns: data.columns, rows: data.rows, totalRows: data.totalRows });
        fetchReports();
      } else setUploadError(data.error || "Error al subir.");
    } catch {
      setUploadError("Error de conexión.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!BASE || !form.title.trim()) return;
    setError(null);
    fetch(`${BASE}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setForm({ title: "", description: "", type: "manual" });
          setShowForm(false);
          fetchReports();
        } else setError(d.error || "Error al crear");
      });
  };

  const deleteReport = (id: string) => {
    if (!BASE || !confirm("¿Eliminar este reporte?")) return;
    fetch(`${BASE}/api/reports/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => d.ok && fetchReports());
  };

  const readyCount = reports.filter((r) => r.status === "ready").length;
  const draftCount = reports.filter((r) => r.status === "draft").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-guru-muted hover:text-guru-text mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-guru-cyan/15 text-guru-cyan">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-guru-text">Reportes</h1>
            <p className="text-guru-muted text-sm">Crear reportes, subir Excel y consultar datos importados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-4 py-2 text-sm font-medium cursor-pointer hover:bg-guru-cyan/30">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Subir Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} disabled={uploading} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-4 py-2 text-sm font-medium text-guru-text"
          >
            <Plus className="w-4 h-4" />
            Nuevo reporte
          </button>
          <button type="button" onClick={fetchReports} className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-guru-muted hover:text-guru-text" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {(error || uploadError) && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-4">
          {error || uploadError}
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-guru-text">{reports.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Listos</p>
            <p className="text-xl font-bold text-emerald-400">{readyCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Borradores</p>
            <p className="text-xl font-bold text-guru-muted">{draftCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Importaciones</p>
            <p className="text-xl font-bold text-guru-cyan">{reports.filter((r) => r.type === "manual" && r.description?.includes("columnas")).length}</p>
          </div>
        </div>
      )}

      {excelResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-guru-muted text-sm mb-2">
            {excelResult.columns.length} columnas, {excelResult.totalRows} filas (mostrando hasta {excelResult.rows.length})
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {excelResult.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-guru-muted font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelResult.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    {excelResult.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-guru-text whitespace-nowrap max-w-[200px] truncate">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setExcelResult(null)} className="mt-2 text-sm text-guru-muted hover:text-guru-text">
            Cerrar vista
          </button>
        </motion.div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6"
        >
          <h2 className="text-lg font-semibold text-guru-text mb-3">Nuevo reporte</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Título *</label>
              <input
                type="text"
                placeholder="Ej. Ventas Q1, Asistencia mensual"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Descripción (opcional)</label>
              <textarea
                placeholder="Detalle o alcance del reporte"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text placeholder:text-guru-muted w-full min-h-[60px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guru-muted mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-guru-text w-full"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Programado</option>
                <option value="export">Exportación</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="rounded-xl bg-guru-cyan/20 text-guru-cyan px-4 py-2 text-sm font-medium">
              Crear
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-guru-muted hover:text-guru-text">
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {loading && reports.length === 0 ? (
        <div className="flex items-center gap-2 text-guru-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
        >
          <FileText className="w-12 h-12 text-guru-muted/70 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-guru-text mb-2">No hay reportes</h2>
          <p className="text-guru-muted text-sm max-w-md mx-auto mb-5">
            Cree un reporte manual o suba un archivo Excel (.xlsx, .xls, .csv) para importar datos y visualizarlos en tabla.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 text-guru-cyan border border-guru-cyan/40 px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-guru-cyan/30">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Subir Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} disabled={uploading} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-guru-muted hover:bg-white/5 hover:text-guru-text"
            >
              <Plus className="w-4 h-4" />
              Nuevo reporte
            </button>
          </div>
        </motion.div>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-guru-text">{r.title}</p>
                {r.description && <p className="text-sm text-guru-muted mt-0.5 line-clamp-1">{r.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  <span className="text-guru-muted text-xs">{TYPE_LABEL[r.type] ?? r.type}</span>
                  <span className="text-guru-muted text-xs">{new Date(r.createdAt).toLocaleString("es")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteReport(r.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 shrink-0"
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
