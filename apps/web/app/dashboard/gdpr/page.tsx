"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileCheck, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
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

const CATEGORY_ORDER = ["breach", "legal", "rights", "security", "latam", "venezuela", "inac"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  breach: "Brecha (EU)",
  legal: "Legal / Transparencia (EU)",
  rights: "Derechos (EU)",
  security: "Seguridad (EU)",
  latam: "Latinoamérica",
  venezuela: "Venezuela",
  inac: "INAC (Aviación Venezuela)",
};

export default function DashboardGdprPage() {
  const [items, setItems] = useState<GdprItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

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

  const saveNotes = (id: string, notes: string) => {
    if (!BASE) return;
    setEditingNotesId(null);
    fetch(`${BASE}/api/gdpr/checklist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ notes: notes.trim() || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes: d.item.notes, updatedAt: d.item.updatedAt } : i)));
      });
  };

  const seedDefaults = () => {
    if (!BASE) return;
    fetch(`${BASE}/api/gdpr/checklist/seed`, { method: "POST", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) {
          setItems(d.items);
          if (d.added > 0) setError(null);
        }
      })
      .catch(() => setError("Error al añadir ítems"));
  };

  const byCategory = items.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, GdprItem[]>);

  const orderedCategories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length);
  const pending = items.filter((i) => i.status === "pending").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
        className="flex items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-emerald-500/15 text-emerald-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-guru-text">Cumplimiento normativo</h1>
            <p className="text-guru-muted text-sm">EU (GDPR/LOPD) · Latinoamérica · Venezuela · INAC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={seedDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-3 py-2 text-sm hover:bg-emerald-500/20"
            title="Añadir ítems por defecto que falten"
          >
            Completar checklist
          </button>
          <button
            type="button"
            onClick={fetchChecklist}
            className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-guru-muted hover:text-guru-text"
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

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-guru-text">{items.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-amber-400">{pending}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">En progreso</p>
            <p className="text-xl font-bold text-guru-cyan">{inProgress}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-guru-muted text-xs uppercase tracking-wider">Hecho</p>
            <p className="text-xl font-bold text-emerald-400">{done}</p>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-guru-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando checklist...
        </div>
      ) : (
        <div className="space-y-6">
          {orderedCategories.length ? orderedCategories.map((cat) => (
            <section key={cat} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold text-guru-text mb-3">
                {CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <ul className="space-y-2">
                {(byCategory[cat] ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/5 p-3 border border-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-guru-text">{item.title}</p>
                      <p className="text-sm text-guru-muted">{item.description}</p>
                      {editingNotesId === item.id ? (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            onBlur={() => saveNotes(item.id, notesDraft)}
                            onKeyDown={(e) => e.key === "Enter" && saveNotes(item.id, notesDraft)}
                            placeholder="Notas (opcional)"
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm text-guru-text placeholder:text-guru-muted"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesId(item.id);
                            setNotesDraft(item.notes ?? "");
                          }}
                          className="text-xs text-guru-muted hover:text-guru-cyan mt-1.5"
                        >
                          {item.notes ? `Notas: ${item.notes}` : "+ Añadir notas"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm text-guru-text"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )) : (
            <p className="text-guru-muted py-6 text-center">No hay ítems en el checklist.</p>
          )}
        </div>
      )}
    </div>
  );
}
