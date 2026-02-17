"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { MetricPanelKey } from "@/components/dashboard/DashboardMetrics";
import type { ProjectEntry } from "@/components/dashboard/DashboardWidgetSubscriptions";
import { DashboardWidgetWhatsApp } from "@/components/dashboard/DashboardWidgetWhatsApp";
import { DashboardWidgetPasskey } from "@/components/dashboard/DashboardWidgetPasskey";
import { DashboardWidgetSubscriptions } from "@/components/dashboard/DashboardWidgetSubscriptions";
import { DashboardWidgetConnections } from "@/components/dashboard/DashboardWidgetConnections";
import { Layout, CreditCard, Activity, Users, MessageCircle, KeyRound } from "lucide-react";

const titles: Record<MetricPanelKey, string> = {
  proyectosActivos: "Proyectos activos",
  suscripcionesActivas: "Suscripciones activas",
  mrrUsd: "MRR (USD)",
  conexionesRecientes: "Conexiones recientes",
  whatsappEstado: "WhatsApp",
  passkey: "Passkey",
};

const icons: Record<MetricPanelKey, typeof Layout> = {
  proyectosActivos: Layout,
  suscripcionesActivas: CreditCard,
  mrrUsd: Activity,
  conexionesRecientes: Users,
  whatsappEstado: MessageCircle,
  passkey: KeyRound,
};

type DashboardMetricPanelProps = {
  panel: MetricPanelKey;
  onClose: () => void;
  projects: ProjectEntry[];
  mrrUsd?: number;
};

export function DashboardMetricPanel({
  panel,
  onClose,
  projects,
  mrrUsd = 0,
}: DashboardMetricPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const TitleIcon = icons[panel];
  const title = titles[panel];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "tween", duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-guru-card shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-center justify-between gap-2 shrink-0 p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="rounded-xl p-2 bg-guru-cyan/15 text-guru-cyan">
                <TitleIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-guru-text">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-guru-muted hover:text-guru-text hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-guru-cyan/50"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {panel === "proyectosActivos" && (
              <div className="space-y-2">
                <p className="text-guru-muted text-sm mb-4">
                  Proyectos del portafolio en producción.
                </p>
                <ul className="space-y-2">
                  {projects.map(({ name, url }) => (
                    <li key={name}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl px-4 py-3 border border-white/10 hover:border-guru-cyan/30 hover:bg-white/5 text-guru-text transition-colors"
                      >
                        <span className="font-medium">{name}</span>
                        <span className="text-guru-muted text-sm block truncate">{url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {panel === "suscripcionesActivas" && (
              <DashboardWidgetSubscriptions projects={projects} />
            )}
            {panel === "mrrUsd" && (
              <div className="space-y-2">
                <p className="text-guru-muted text-sm mb-4">
                  Ingresos recurrentes mensuales (MRR) en USD.
                </p>
                <div className="rounded-xl border border-white/10 px-4 py-6 text-center">
                  <p className="text-3xl font-bold text-guru-emerald">${mrrUsd}</p>
                  <p className="text-guru-muted text-sm mt-1">Total MRR</p>
                </div>
              </div>
            )}
            {panel === "conexionesRecientes" && (
              <DashboardWidgetConnections />
            )}
            {panel === "whatsappEstado" && (
              <div className="[&_.mirror-shine]:shadow-none">
                <DashboardWidgetWhatsApp />
              </div>
            )}
            {panel === "passkey" && (
              <div className="[&_.mirror-shine]:shadow-none">
                <DashboardWidgetPasskey />
              </div>
            )}
          </div>
      </motion.div>
    </motion.div>
  );
}
