"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  Calendar,
  Loader2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
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

export function ClientDashboard() {
  const { user } = useDashboardUser();
  const [profile, setProfile] = useState<ProfileRes | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.sub || !API_URL) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API_URL.replace(/\/$/, "")}/api/client/profile`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${API_URL.replace(/\/$/, "")}/api/client/subscriptions`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ]).then(([profileRes, subsRes]) => {
      if (profileRes.ok && profileRes.profile) setProfile(profileRes.profile);
      else setProfile(null);
      if (subsRes.ok && Array.isArray(subsRes.subscriptions)) setSubscriptions(subsRes.subscriptions);
      else setSubscriptions([]);
    }).finally(() => setLoading(false));
  }, [user?.sub]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-aplat-cyan" />
      </div>
    );
  }

  const hasProfile = profile && (profile.nombres || profile.apellidos || profile.telefono);
  const needsProfile = !hasProfile;

  return (
    <>
      <h1 className="text-2xl font-bold text-aplat-text mb-2">Mi panel</h1>
      <p className="text-aplat-muted text-sm mb-6">
        Tus servicios contratados, fechas de corte y perfil.
      </p>

      {needsProfile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-strong rounded-2xl p-6 border border-aplat-cyan/20 mb-6 mirror-shine"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-3 bg-aplat-cyan/15 text-aplat-cyan">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-aplat-text mb-1">Completa tu perfil</h2>
              <p className="text-aplat-muted text-sm mb-4">
                Añade tus datos personales, verifica tu teléfono y elige tu tipo de servicio para tener todo al día.
              </p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium transition-all"
              >
                Ir a Perfil
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl p-2 bg-aplat-violet/15 text-aplat-violet">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-aplat-text">Servicios contratados</h2>
          </div>
          <p className="text-aplat-muted text-sm mb-4">
            {subscriptions.length === 0
              ? "Aún no tienes servicios asociados. Cuando te afilien por WhatsApp, aparecerán aquí."
              : `${subscriptions.length} servicio(s). Los datos se actualizan al cargar.`}
          </p>
          {subscriptions.length > 0 && (
            <ul className="space-y-2">
              {subscriptions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-3 py-2 gap-2"
                >
                  <span className="text-aplat-text font-medium truncate">{s.serviceName}</span>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg ${
                      s.status === "active"
                        ? "bg-aplat-emerald/20 text-aplat-emerald"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {s.status === "active" ? "Activo" : "Suspendido"}
                  </span>
                  {s.amount != null && (
                    <span className="text-aplat-emerald text-sm shrink-0">${s.amount}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl p-2 bg-aplat-emerald/15 text-aplat-emerald">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-aplat-text">Próximos cortes y recordatorios</h2>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-aplat-muted text-sm">No hay fechas programadas.</p>
          ) : (
            <ul className="space-y-2">
              {subscriptions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl bg-white/5 border border-white/5 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
                >
                  <span className="text-aplat-text font-medium">{s.serviceName}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                      s.status === "active" ? "bg-aplat-emerald/20 text-aplat-emerald" : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {s.status === "active" ? "Activo" : "Suspendido"}
                  </span>
                  <span className="text-aplat-muted">Corte: {s.nextCutoff}</span>
                  <span className="text-aplat-cyan">Recordatorio: {s.nextReminder}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl p-2 bg-aplat-cyan/15 text-aplat-cyan">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-aplat-text">Mi perfil</h2>
              <p className="text-aplat-muted text-sm">
                {hasProfile ? "Datos personales, teléfono y tipo de servicio." : "Completa tus datos para continuar."}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-aplat-text border border-white/10 px-4 py-2.5 text-sm font-medium transition-all"
          >
            {hasProfile ? (
              <>
                <CheckCircle className="w-4 h-4 text-aplat-emerald" />
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
    </>
  );
}
