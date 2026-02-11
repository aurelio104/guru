"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink, ToggleLeft, Calendar, MessageCircle, Send, Loader2 } from "lucide-react";

const STORAGE_KEY = "aplat_subscription_mode";
const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export type SubscriptionConfig = {
  on: boolean;
  /** Día del mes en que se cobra (1-28). Si es 1, el recordatorio se envía 5 días antes = día 27 del mes anterior. */
  dayOfMonth?: number;
  /** Teléfono (WhatsApp) para enviar el recordatorio. Opcional. */
  phone?: string;
};

function parseStored(raw: string | null): Record<string, SubscriptionConfig> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean | SubscriptionConfig>;
    const out: Record<string, SubscriptionConfig> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") {
        out[key] = { on: value, dayOfMonth: value ? 1 : undefined };
      } else if (value && typeof value === "object" && "on" in value) {
        out[key] = {
          on: !!value.on,
          dayOfMonth: value.dayOfMonth ?? (value.on ? 1 : undefined),
          phone: value.phone,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function getStored(): Record<string, SubscriptionConfig> {
  if (typeof window === "undefined") return {};
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

function setStored(data: Record<string, SubscriptionConfig>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Fecha del próximo recordatorio (5 días antes del día de cobro). */
function getNextReminderDate(dayOfMonth: number): { day: number; month: string; isPreviousMonth: boolean } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Próxima fecha de cobro: día N de este mes o del próximo
  let cobroDate: Date;
  if (now.getDate() < dayOfMonth) {
    cobroDate = new Date(year, month, dayOfMonth);
  } else {
    cobroDate = new Date(year, month + 1, dayOfMonth);
  }
  const reminder = new Date(cobroDate);
  reminder.setDate(reminder.getDate() - 5);
  const months = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
  return {
    day: reminder.getDate(),
    month: months[reminder.getMonth()],
    isPreviousMonth: reminder.getMonth() !== now.getMonth(),
  };
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export type ProjectEntry = { name: string; url: string };

export function DashboardWidgetSubscriptions({ projects }: { projects: ProjectEntry[] }) {
  const [local, setLocal] = useState<Record<string, SubscriptionConfig>>({});
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<{ project: string; type: "success" | "error"; text: string } | null>(null);

  const initial = useMemo(() => getStored(), []);
  const configByProject = useMemo(() => {
    const out: Record<string, SubscriptionConfig> = {};
    projects.forEach((p) => {
      const stored = initial[p.name] ?? local[p.name];
      out[p.name] = stored ?? { on: false };
      if (out[p.name].on && (out[p.name].dayOfMonth == null || out[p.name].dayOfMonth! < 1 || out[p.name].dayOfMonth! > 28)) {
        out[p.name].dayOfMonth = 1;
      }
    });
    return out;
  }, [projects, initial, local]);

  const state = useMemo(() => {
    const s = { ...configByProject };
    Object.keys(local).forEach((k) => {
      s[k] = local[k];
    });
    return s;
  }, [configByProject, local]);

  const toggle = (name: string) => {
    const current = state[name] ?? { on: false };
    const nextOn = !current.on;
    const next: SubscriptionConfig = nextOn
      ? { on: true, dayOfMonth: current.dayOfMonth ?? 1, phone: current.phone }
      : { on: false };
    const nextState = { ...state, [name]: next };
    setLocal((prev) => ({ ...prev, [name]: next }));
    setStored(nextState);
  };

  const setDay = (name: string, day: number) => {
    const current = state[name] ?? { on: false };
    const next: SubscriptionConfig = { ...current, on: true, dayOfMonth: day };
    const nextState = { ...state, [name]: next };
    setLocal((prev) => ({ ...prev, [name]: next }));
    setStored(nextState);
  };

  const setPhone = (name: string, phone: string) => {
    const current = state[name] ?? { on: false };
    const next: SubscriptionConfig = { ...current, phone: phone.trim() || undefined };
    const nextState = { ...state, [name]: next };
    setLocal((prev) => ({ ...prev, [name]: next }));
    setStored(nextState);
    setInviteMessage(null);
  };

  const sendSubscriptionInvite = useCallback(async (name: string) => {
    const config = state[name] ?? { on: false };
    const phone = config.phone?.trim();
    const day = config.dayOfMonth ?? 1;
    if (!phone || !API_URL) {
      setInviteMessage({ project: name, type: "error", text: "Ingresa un teléfono primero." });
      return;
    }
    setSendingInvite(name);
    setInviteMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/admin/send-subscription-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ serviceName: name, dayOfMonth: day, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setInviteMessage({ project: name, type: "success", text: "Invitación enviada por WhatsApp." });
      } else {
        setInviteMessage({ project: name, type: "error", text: data.error ?? "Error al enviar." });
      }
    } catch {
      setInviteMessage({ project: name, type: "error", text: "Error de conexión." });
    } finally {
      setSendingInvite(null);
    }
  }, [state]);

  const activeCount = Object.values(state).filter((c) => c.on).length;

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
        <span className="text-aplat-muted text-sm">
          {activeCount} con modo suscripción
        </span>
      </div>
      <p className="text-aplat-muted text-sm mb-2">
        Activa el modo suscripción por proyecto y define el <strong className="text-aplat-text">día de cobro</strong> (ej. 1 = día 1 de cada mes). 
        Se enviará recordatorio por WhatsApp <strong className="text-aplat-cyan">5 días antes</strong> para evitar corte de servicios.
      </p>
      <ul className="space-y-2 max-h-[420px] overflow-y-auto">
        {projects.map((p) => {
          const config = state[p.name] ?? { on: false };
          const day = config.on ? (config.dayOfMonth ?? 1) : 1;
          const reminder = config.on ? getNextReminderDate(day) : null;
          return (
            <li
              key={p.name}
              className="rounded-xl bg-white/5 border border-white/5 px-3 py-2 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-aplat-text text-sm font-medium truncate">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggle(p.name)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1 transition-colors ${
                      config.on ? "bg-aplat-violet/20 text-aplat-violet" : "text-aplat-muted hover:text-aplat-text"
                    }`}
                    title={config.on ? "Desactivar modo suscripción" : "Activar modo suscripción"}
                  >
                    <ToggleLeft className="w-4 h-4" />
                    {config.on ? "ON" : "OFF"}
                  </button>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-aplat-muted hover:text-aplat-cyan transition-colors"
                    title="Abrir proyecto"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              {config.on && (
                <div className="flex flex-wrap items-center gap-3 pl-0 text-xs border-t border-white/5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-aplat-violet" />
                    <span className="text-aplat-muted">Día de cobro:</span>
                    <select
                      value={day}
                      onChange={(e) => setDay(p.name, Number(e.target.value))}
                      className="rounded-lg bg-white/5 border border-white/10 text-aplat-text px-2 py-1 focus:border-aplat-violet/50 focus:outline-none"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d} de cada mes
                        </option>
                      ))}
                    </select>
                  </div>
                  {reminder && (
                    <span className="text-aplat-cyan/90">
                      Recordatorio: {reminder.day} {reminder.month}
                      {reminder.isPreviousMonth ? " (mes anterior)" : ""}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageCircle className="w-3.5 h-3.5 text-aplat-emerald shrink-0" />
                    <input
                      type="tel"
                      placeholder="Teléfono (WhatsApp)"
                      value={config.phone ?? ""}
                      onChange={(e) => setPhone(p.name, e.target.value)}
                      className="rounded-lg bg-white/5 border border-white/10 text-aplat-text placeholder:text-aplat-muted/60 px-2 py-1 w-44 max-w-full focus:border-aplat-violet/50 focus:outline-none text-xs"
                    />
                  </div>
                  {config.phone?.trim() && (
                    <div className="w-full pl-0">
                      <button
                        type="button"
                        onClick={() => sendSubscriptionInvite(p.name)}
                        disabled={sendingInvite === p.name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/40 px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
                      >
                        {sendingInvite === p.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Enviar invitación por WhatsApp
                      </button>
                      {inviteMessage?.project === p.name && (
                        <span className={`ml-2 text-xs ${inviteMessage.type === "success" ? "text-aplat-emerald" : "text-red-400"}`}>
                          {inviteMessage.text}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
