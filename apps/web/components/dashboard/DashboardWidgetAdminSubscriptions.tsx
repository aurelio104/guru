"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, CheckCircle, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type SubRow = {
  id: string;
  phone: string;
  serviceName: string;
  dayOfMonth: number;
  amount?: number;
  status: string;
  paidUntil: string | null;
  nextCutoff: string;
  lastMissedCutoff: string | null;
  nextReminder: string;
  createdAt: string;
};

export function DashboardWidgetAdminSubscriptions() {
  const [list, setList] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [runningCutoffs, setRunningCutoffs] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSubs = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/subscriptions`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.subscriptions)) setList(data.subscriptions);
      else setList([]);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const handleProcessCutoffs = async () => {
    if (!API_URL) return;
    setRunningCutoffs(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/process-cutoffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: data.message ?? "Cortes procesados." });
        await fetchSubs();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setRunningCutoffs(false);
    }
  };

  const handleMarkPaid = async (sub: SubRow) => {
    if (!API_URL) return;
    const cutoffToPay = sub.status === "suspended" && sub.lastMissedCutoff ? sub.lastMissedCutoff : sub.nextCutoff;
    setProcessing(sub.id);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/mark-subscription-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ subscriptionId: sub.id, cutoffDate: cutoffToPay }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: `${sub.serviceName} marcado como pagado.` });
        await fetchSubs();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-guru-violet/15 text-guru-violet">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-guru-text">Estado de suscripciones</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleProcessCutoffs}
            disabled={runningCutoffs}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
            title="Suspender suscripciones con fecha de pago vencida (ejecutar 1 vez al día)"
          >
            {runningCutoffs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Ejecutar cortes
          </button>
          <button type="button" onClick={fetchSubs} disabled={loading} className="p-1.5 rounded-lg text-guru-muted hover:text-guru-text">
            Actualizar
          </button>
        </div>
      </div>
      <p className="text-guru-muted text-sm mb-3">
        Si pasó la fecha de pago y no se marcó como pagado, el servicio se suspende. Ejecuta &quot;Ejecutar cortes&quot; (o un cron diario a <code className="text-xs">POST /api/admin/process-cutoffs</code>). Marca como pagado cuando el cliente pague.
      </p>
      {message && (
        <div
          className={`rounded-xl px-3 py-2 text-sm mb-3 ${
            message.type === "success" ? "bg-guru-emerald/10 text-guru-emerald" : "bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-guru-cyan" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-guru-muted text-sm py-4">No hay suscripciones. Envía invitaciones desde el widget Suscripciones.</p>
      ) : (
        <ul className="space-y-2 max-h-[320px] overflow-y-auto">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-3 py-2 text-sm"
            >
              <span className="font-medium text-guru-text">{s.serviceName}</span>
              <span className="text-guru-muted">+{s.phone}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                  s.status === "active" ? "bg-guru-emerald/20 text-guru-emerald" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {s.status === "active" ? "Activo" : "Suspendido"}
              </span>
              <span className="text-guru-muted">
                {s.status === "suspended" && s.lastMissedCutoff
                  ? `Vencido: ${s.lastMissedCutoff}`
                  : `Próx. corte: ${s.nextCutoff}`}
              </span>
              {s.amount != null && <span className="text-guru-emerald">${s.amount}</span>}
              <button
                type="button"
                onClick={() => handleMarkPaid(s)}
                disabled={processing === s.id}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-guru-emerald/20 hover:bg-guru-emerald/30 text-guru-emerald border border-guru-emerald/30 px-2 py-1 text-xs font-medium disabled:opacity-60"
              >
                {processing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Marcar pagado
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
