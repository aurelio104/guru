"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Plus, Loader2, RefreshCw, Upload } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Report = { id: string; title: string; description?: string; type: string; status: string; createdAt: string };
type ExcelResult = { reportId: string; columns: string[]; rows: Record<string, string | number>[]; totalRows: number };

export default function DashboardReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [excelResult, setExcelResult] = useState<ExcelResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchReports = () => {
    if (!BASE) return;
    setLoading(true);
    fetch(`${BASE}/api/reports`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.reports)) setReports(d.reports);
      })
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
    if (!BASE || !formTitle.trim()) return;
    fetch(`${BASE}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ title: formTitle.trim() }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setFormTitle("");
          setShowForm(false);
          fetchReports();
        }
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-aplat-cyan/15 text-aplat-cyan">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">Reportes</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo reporte
          </button>
          <button type="button" onClick={fetchReports} className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-aplat-muted hover:text-aplat-text">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-aplat-text px-4 py-2 text-sm font-medium cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Subir Excel
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} disabled={uploading} className="hidden" />
        </label>
        {uploadError && <span className="text-sm text-red-400">{uploadError}</span>}
      </div>

      {excelResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-aplat-muted text-sm mb-2">
            {excelResult.columns.length} columnas, {excelResult.totalRows} filas (mostrando hasta {excelResult.rows.length})
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {excelResult.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-aplat-muted font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelResult.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    {excelResult.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-aplat-text whitespace-nowrap max-w-[200px] truncate">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setExcelResult(null)} className="mt-2 text-sm text-aplat-muted hover:text-aplat-text">
            Cerrar vista
          </button>
        </motion.div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
          <input
            type="text"
            placeholder="Título del reporte"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-aplat-text placeholder:text-aplat-muted w-full"
            required
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="rounded-xl bg-aplat-cyan/20 text-aplat-cyan px-4 py-2 text-sm font-medium">
              Crear
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-aplat-muted">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {loading && reports.length === 0 ? (
        <div className="flex items-center gap-2 text-aplat-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      ) : reports.length === 0 ? (
        <p className="text-aplat-muted py-8">No hay reportes.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-aplat-text">{r.title}</p>
                <p className="text-xs text-aplat-muted">{r.status} · {r.type}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
