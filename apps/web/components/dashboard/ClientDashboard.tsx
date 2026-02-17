"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CreditCard,
  Calendar,
  Loader2,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bell,
  DollarSign,
} from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type SubItem = {
  id: string;
  serviceName: string;
  dayOfMonth: number;
  amount?: number;
  status: "active" | "suspended";
  nextCutoff: string;
  nextReminder: string;
};

type ProfileRes = { nombres?: string; apellidos?: string; telefono?: string; telefonoVerificado?: boolean };

/** Días hasta una fecha YYYY-MM-DD desde hoy. */
function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/** Próximos cortes ordenados (para timeline); cada uno con serviceName, date, daysLeft. */
function getUpcomingCutoffs(subs: SubItem[], limit: number): { serviceName: string; date: string; daysLeft: number }[] {
  const withDays = subs
    .filter((s) => s.status === "active")
    .map((s) => ({ serviceName: s.serviceName, date: s.nextCutoff, daysLeft: daysUntil(s.nextCutoff) }));
  withDays.sort((a, b) => a.daysLeft - b.daysLeft);
  return withDays.slice(0, limit);
}

export function ClientDashboard() {
  const { user } = useDashboardUser();
  const [profile, setProfile] = useState<ProfileRes | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.sub || !API_URL) return;
    try {
      const [profileRes, subsRes] = await Promise.all([
        fetch(`${API_URL.replace(/\/$/, "")}/api/client/profile`, { headers: getAuthHeaders() }).then((r) => r.json()),
        fetch(`${API_URL.replace(/\/$/, "")}/api/client/subscriptions`, { headers: getAuthHeaders() }).then((r) =>
          r.json()
        ),
      ]);
      if (profileRes.ok && profileRes.profile) setProfile(profileRes.profile);
      else setProfile(null);
      if (subsRes.ok && Array.isArray(subsRes.subscriptions)) setSubscriptions(subsRes.subscriptions);
      else setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    if (!user?.sub || !API_URL) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.sub, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const totalMonthly =
    subscriptions.filter((s) => s.status === "active" && s.amount != null).reduce((sum, s) => sum + (s.amount ?? 0), 0) ||
    0;
  const upcoming = getUpcomingCutoffs(subscriptions, 4);
  const nextCutoffLabel =
    upcoming.length > 0
      ? upcoming[0]!.daysLeft <= 0
        ? "Hoy"
        : upcoming[0]!.daysLeft === 1
          ? "Mañana"
          : `En ${upcoming[0]!.daysLeft} días`
      : "—";

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-guru-cyan" />
      </div>
    );
  }

  const hasProfile = profile && (profile.nombres || profile.apellidos || profile.telefono);
  const needsProfile = !hasProfile;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-guru-text mb-1">Mi panel</h1>
          <p className="text-guru-muted text-sm">
            Tus servicios, fechas de corte y perfil. Actualiza para ver los últimos cambios.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-sm font-medium text-guru-text disabled:opacity-50 transition-all"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </div>

      {needsProfile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-strong rounded-2xl p-6 border border-guru-cyan/20 mb-6 mirror-shine"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-3 bg-guru-cyan/15 text-guru-cyan">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-guru-text mb-1">Completa tu perfil</h2>
              <p className="text-guru-muted text-sm mb-4">
                Añade tus datos personales, verifica tu teléfono y elige tu tipo de servicio.
              </p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-xl bg-guru-cyan/20 hover:bg-guru-cyan/30 text-guru-cyan border border-guru-cyan/40 px-4 py-2.5 text-sm font-medium transition-all"
              >
                Ir a Perfil
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Métricas resumen */}
      {subscriptions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          <div className="glass glass-strong rounded-2xl p-4 border border-white/10 flex items-center gap-4">
            <div className="rounded-xl p-2.5 bg-guru-violet/15 text-guru-violet">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-guru-muted text-xs uppercase tracking-wider">Servicios activos</p>
              <p className="text-xl font-bold text-guru-text">{activeCount}</p>
            </div>
          </div>
          <div className="glass glass-strong rounded-2xl p-4 border border-white/10 flex items-center gap-4">
            <div className="rounded-xl p-2.5 bg-guru-emerald/15 text-guru-emerald">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-guru-muted text-xs uppercase tracking-wider">Próximo corte</p>
              <p className="text-xl font-bold text-guru-text">{nextCutoffLabel}</p>
              {upcoming[0] && (
                <p className="text-xs text-guru-muted mt-0.5">{upcoming[0].serviceName} · {upcoming[0].date}</p>
              )}
            </div>
          </div>
          <div className="glass glass-strong rounded-2xl p-4 border border-white/10 flex items-center gap-4">
            <div className="rounded-xl p-2.5 bg-guru-cyan/15 text-guru-cyan">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-guru-muted text-xs uppercase tracking-wider">Total mensual</p>
              <p className="text-xl font-bold text-guru-text">${totalMonthly}</p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Timeline próximos cortes (solo si hay activos) */}
      {upcoming.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass glass-strong rounded-2xl p-5 border border-white/10 mb-6 mirror-shine"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl p-2 bg-guru-cyan/15 text-guru-cyan">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-guru-text">Próximos cortes</h2>
          </div>
          <p className="text-guru-muted text-sm mb-4">
            Fechas de cobro de tus servicios activos. Recibirás un recordatorio por WhatsApp unos días antes.
          </p>
          <ul className="space-y-3">
            {upcoming.map((item, i) => {
              const days = item.daysLeft;
              const fillPct = days <= 0 ? 100 : Math.max(0, Math.min(100, 100 - (days / 31) * 100));
              return (
                <li key={`${item.serviceName}-${item.date}`} className="rounded-xl bg-white/5 border border-white/5 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-guru-text">{item.serviceName}</span>
                    <span className="text-guru-cyan text-sm">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-guru-muted shrink-0 w-20">
                      {days < 0 ? "Vencido" : days === 0 ? "Hoy" : days === 1 ? "Mañana" : `${days} días`}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-guru-cyan/40 to-guru-cyan/80"
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Mis servicios (tarjetas expandibles) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl p-2 bg-guru-violet/15 text-guru-violet">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-guru-text">Servicios contratados</h2>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-guru-muted text-sm">
              Aún no tienes servicios asociados. Cuando te afilien por WhatsApp, aparecerán aquí.
            </p>
          ) : (
            <ul className="space-y-2">
              {subscriptions.map((s) => {
                const isExpanded = expandedId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-3 py-2.5 gap-2 text-left hover:bg-white/10 transition-colors"
                    >
                      <span className="text-guru-text font-medium truncate">{s.serviceName}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                            s.status === "active" ? "bg-guru-emerald/20 text-guru-emerald" : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {s.status === "active" ? "Activo" : "Suspendido"}
                        </span>
                        {s.amount != null && <span className="text-guru-emerald text-sm">${s.amount}</span>}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-guru-muted" /> : <ChevronDown className="w-4 h-4 text-guru-muted" />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-b-xl bg-white/5 border border-t-0 border-white/5 px-3 py-3 text-sm space-y-2">
                            <div className="flex justify-between text-guru-muted">
                              <span>Corte</span>
                              <span className="text-guru-text">{s.nextCutoff}</span>
                            </div>
                            <div className="flex justify-between text-guru-muted">
                              <span>Recordatorio</span>
                              <span className="text-guru-cyan">{s.nextReminder}</span>
                            </div>
                            {s.amount != null && (
                              <div className="flex justify-between text-guru-muted">
                                <span>Monto</span>
                                <span className="text-guru-emerald">${s.amount}/mes</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Mi perfil */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
        >
          <div className="flex items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2.5 bg-guru-cyan/15 text-guru-cyan">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-guru-text">Mi perfil</h2>
                <p className="text-guru-muted text-sm">
                  {hasProfile ? "Datos personales, teléfono y tipo de servicio." : "Completa tus datos para continuar."}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-guru-text border border-white/10 px-4 py-2.5 text-sm font-medium transition-all shrink-0"
            >
              {hasProfile ? (
                <>
                  <CheckCircle className="w-4 h-4 text-guru-emerald" />
                  Ver / Editar
                </>
              ) : (
                <>
                  Completar perfil
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
