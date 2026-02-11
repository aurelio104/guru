"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  RefreshCw,
  ToggleLeft,
  Trash2,
  X,
} from "lucide-react";
import { CountryCodePhoneInput } from "@/components/ui/CountryCodePhoneInput";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
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
  clientEmail: string | null;
  clientId: string | null;
};

export type ProjectEntry = { name: string; url: string };

function getNextReminderLabel(dayOfMonth: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let cobroDate: Date;
  if (now.getDate() < dayOfMonth) {
    cobroDate = new Date(year, month, dayOfMonth);
  } else {
    cobroDate = new Date(year, month + 1, dayOfMonth);
  }
  const reminder = new Date(cobroDate);
  reminder.setDate(reminder.getDate() - 5);
  const months = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
  return `${reminder.getDate()} ${months[reminder.getMonth()]}`;
}

export function DashboardWidgetSubscriptions({ projects }: { projects: ProjectEntry[] }) {
  const [list, setList] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<SubRow | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [runningCutoffs, setRunningCutoffs] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Nueva suscripción (form antes de enviar WhatsApp)
  const [newOpen, setNewOpen] = useState(false);
  const [newService, setNewService] = useState("");
  const [newDay, setNewDay] = useState(1);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState<number | "">("");
  const [sendingInvite, setSendingInvite] = useState(false);

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

  const metrics = {
    total: list.length,
    active: list.filter((s) => s.status === "active").length,
    suspended: list.filter((s) => s.status === "suspended").length,
  };

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

  const handleSendNewInvite = async () => {
    if (!API_URL || !newService.trim() || !newPhone.trim()) {
      setMessage({ type: "error", text: "Servicio y teléfono son obligatorios." });
      return;
    }
    setSendingInvite(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/send-subscription-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          serviceName: newService,
          dayOfMonth: newDay,
          phone: newPhone,
          email: newEmail.trim() || undefined,
          amount: newAmount === "" ? undefined : Number(newAmount),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: "Invitación enviada y suscripción guardada." });
        setNewOpen(false);
        setNewService("");
        setNewDay(1);
        setNewEmail("");
        setNewPhone("");
        setNewAmount("");
        await fetchSubs();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error al enviar." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setSendingInvite(false);
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
          <div className="rounded-xl p-2 bg-aplat-violet/15 text-aplat-violet">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-aplat-text">Suscripciones</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 rounded-lg text-aplat-muted hover:text-aplat-text text-sm"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Ocultar lista" : "Ver lista"}
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2 text-center">
          <div className="text-lg font-semibold text-aplat-text">{metrics.total}</div>
          <div className="text-xs text-aplat-muted">Total</div>
        </div>
        <div className="rounded-xl bg-aplat-emerald/10 border border-aplat-emerald/20 px-3 py-2 text-center">
          <div className="text-lg font-semibold text-aplat-emerald">{metrics.active}</div>
          <div className="text-xs text-aplat-muted">Activas</div>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center">
          <div className="text-lg font-semibold text-amber-400">{metrics.suspended}</div>
          <div className="text-xs text-aplat-muted">Suspendidas</div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-3 py-2 text-sm mb-3 ${
            message.type === "success" ? "bg-aplat-emerald/10 text-aplat-emerald" : "bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleProcessCutoffs}
                disabled={runningCutoffs}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                {runningCutoffs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Ejecutar cortes
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewOpen(true);
                  setSelected(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-violet/20 hover:bg-aplat-violet/30 text-aplat-violet border border-aplat-violet/30 px-2.5 py-1.5 text-xs font-medium"
              >
                Nueva suscripción
              </button>
              <button type="button" onClick={fetchSubs} disabled={loading} className="p-1.5 rounded-lg text-aplat-muted hover:text-aplat-text text-xs">
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-aplat-cyan" />
              </div>
            ) : list.length === 0 ? (
              <p className="text-aplat-muted text-sm py-4">No hay suscripciones guardadas. Crea una con &quot;Nueva suscripción&quot; y Enviar invitación por WhatsApp.</p>
            ) : (
              <ul className="space-y-2 max-h-[320px] overflow-y-auto">
                {list.map((s) => (
                  <li
                    key={s.id}
                    role="button"
                    onClick={() => {
                      setSelected(s);
                      setNewOpen(false);
                    }}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-3 py-2 text-sm cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span className="font-medium text-aplat-text">{s.serviceName}</span>
                    <span className="text-aplat-muted">
                      {s.status === "suspended" && s.lastMissedCutoff ? `Vencido: ${s.lastMissedCutoff}` : `Corte: ${s.nextCutoff}`}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                        s.status === "active" ? "bg-aplat-emerald/20 text-aplat-emerald" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {s.status === "active" ? "Activo" : "Suspendido"}
                    </span>
                    {s.amount != null && <span className="text-aplat-emerald text-xs">${s.amount}</span>}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form nueva suscripción */}
      <AnimatePresence>
        {newOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-aplat-text">Nueva suscripción</h3>
              <button type="button" onClick={() => setNewOpen(false)} className="p-1 rounded-lg text-aplat-muted hover:text-aplat-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-aplat-muted text-xs">Activa ON, define día de cobro, correo y WhatsApp. Al enviar se guarda y se envía la invitación.</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <span className="text-aplat-violet text-xs font-medium w-24">Servicio</span>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1.5 text-sm flex-1"
                >
                  <option value="">Seleccionar</option>
                  {projects.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-aplat-violet shrink-0" />
                <span className="text-aplat-muted text-xs w-24">Día de cobro</span>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(Number(e.target.value))}
                  className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1 text-sm"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} de cada mes
                    </option>
                  ))}
                </select>
                <span className="text-aplat-cyan/90 text-xs">Recordatorio: {getNextReminderLabel(newDay)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-aplat-muted text-xs w-24">Correo</span>
                <input
                  type="email"
                  placeholder="cliente@email.com (crea cuenta)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-lg bg-white/5 border border-white/10 text-aplat-text placeholder:text-aplat-muted/60 px-2 py-1.5 text-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-aplat-emerald shrink-0" />
                <CountryCodePhoneInput
                  value={newPhone}
                  onChange={setNewPhone}
                  placeholder="Número WhatsApp"
                  compact
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-aplat-muted text-xs w-24">Monto $</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Opcional"
                  value={newAmount === "" ? "" : newAmount}
                  onChange={(e) => setNewAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1.5 text-sm w-24"
                />
              </div>
              <button
                type="button"
                onClick={handleSendNewInvite}
                disabled={sendingInvite || !newService.trim() || !newPhone.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/40 px-3 py-2 text-sm font-medium disabled:opacity-60"
              >
                {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar invitación por WhatsApp (guarda automático)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal detalle / editar suscripción */}
      <AnimatePresence>
        {selected && !newOpen && (
          <SubscriptionModal
            sub={selected}
            projects={projects}
            onClose={() => setSelected(null)}
            onSaved={() => {
              fetchSubs();
              setSelected(null);
            }}
            setMessage={setMessage}
            setProcessing={setProcessing}
            processing={processing}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SubscriptionModal({
  sub,
  projects,
  onClose,
  onSaved,
  setMessage,
  setProcessing,
  processing,
}: {
  sub: SubRow;
  projects: ProjectEntry[];
  onClose: () => void;
  onSaved: () => void;
  setMessage: (m: { type: "success" | "error"; text: string } | null) => void;
  setProcessing: (id: string | null) => void;
  processing: string | null;
}) {
  const [serviceName, setServiceName] = useState(sub.serviceName);
  const [status, setStatus] = useState<"active" | "suspended">(sub.status as "active" | "suspended");
  const [dayOfMonth, setDayOfMonth] = useState(sub.dayOfMonth);
  const [phone, setPhone] = useState(sub.phone);
  const [clientEmail, setClientEmail] = useState(sub.clientEmail ?? "");
  const [amount, setAmount] = useState<number | "">(sub.amount ?? "");
  const [sendingWa, setSendingWa] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cutoffToPay = sub.status === "suspended" && sub.lastMissedCutoff ? sub.lastMissedCutoff : sub.nextCutoff;

  const handleSave = async () => {
    if (!API_URL) return;
    setProcessing(sub.id);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          serviceName,
          dayOfMonth,
          status,
          phone: phone.trim() || undefined,
          clientEmail: clientEmail.trim() || undefined,
          amount: amount === "" ? undefined : Number(amount),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: "Suscripción actualizada." });
        onSaved();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!API_URL) return;
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
        setMessage({ type: "success", text: "Marcado como pagado." });
        onSaved();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setProcessing(null);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!API_URL) return;
    setSendingWa(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/send-subscription-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ subscriptionId: sub.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: "Mensaje enviado por WhatsApp." });
      } else {
        setMessage({ type: "error", text: data.error ?? "Error al enviar." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setSendingWa(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (!API_URL) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/subscriptions/${sub.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: "Suscripción eliminada. El servicio queda sin usuario." });
        onSaved();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-aplat-bg/95 border border-white/10 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-aplat-text">Editar suscripción</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-aplat-muted hover:text-aplat-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-aplat-muted text-sm w-28">Servicio</span>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1.5 text-sm flex-1"
            >
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
              {!projects.find((p) => p.name === serviceName) && (
                <option value={serviceName}>{serviceName}</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-aplat-violet shrink-0" />
            <span className="text-aplat-muted text-sm w-28">Estado</span>
            <button
              type="button"
              onClick={() => setStatus((s) => (s === "active" ? "suspended" : "active"))}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                status === "active" ? "bg-aplat-emerald/20 text-aplat-emerald" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {status === "active" ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-aplat-violet shrink-0" />
            <span className="text-aplat-muted text-sm w-28">Día de cobro</span>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d} de cada mes
                </option>
              ))}
            </select>
            <span className="text-aplat-cyan/90 text-xs">Recordatorio: {getNextReminderLabel(dayOfMonth)}</span>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 shrink-0 text-aplat-emerald" />
            <span className="text-aplat-muted text-sm w-28">Teléfono</span>
            <CountryCodePhoneInput value={phone} onChange={setPhone} placeholder="WhatsApp" compact className="flex-1" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-aplat-muted text-sm w-28">Correo</span>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1.5 text-sm flex-1"
              placeholder="cliente@email.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-aplat-muted text-sm w-28">Monto $</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount === "" ? "" : amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1.5 text-sm w-24"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleSave}
            disabled={processing === sub.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-violet/20 hover:bg-aplat-violet/30 text-aplat-violet border border-aplat-violet/30 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {processing === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar
          </button>
          {sub.status === "suspended" && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={processing === sub.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/30 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              {processing === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Marcar pagado
            </button>
          )}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={sendingWa}
            className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/40 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar WhatsApp
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 ${
              confirmDelete
                ? "bg-red-500/30 text-red-400 border border-red-500/50"
                : "bg-white/10 text-aplat-muted hover:text-red-400 border border-white/10"
            }`}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {confirmDelete ? "Confirmar eliminar" : "Eliminar suscripción"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
