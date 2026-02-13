"use client";

import { motion } from "framer-motion";
import {
  Layout,
  CreditCard,
  Users,
  Activity,
  MessageCircle,
  KeyRound,
  ChevronRight,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export type MetricsData = {
  proyectosActivos: number;
  suscripcionesActivas: number;
  mrrUsd: number;
  conexionesRecientes: number;
  whatsappEstado?: "conectado" | "desconectado" | "pendiente";
  passkeyEstado?: "configurado" | "no_configurado";
};

/** Clave del panel que se abre al hacer clic en una tarjeta */
export type MetricPanelKey =
  | "proyectosActivos"
  | "suscripcionesActivas"
  | "mrrUsd"
  | "conexionesRecientes"
  | "whatsappEstado"
  | "passkey";

const defaultMetrics: MetricsData = {
  proyectosActivos: 0,
  suscripcionesActivas: 0,
  mrrUsd: 0,
  conexionesRecientes: 0,
  whatsappEstado: "pendiente",
  passkeyEstado: "no_configurado",
};

const cards: Array<{
  key: MetricPanelKey;
  label: string;
  icon: typeof Layout;
  iconClass: string;
  format: (v: number, m: MetricsData) => string;
}> = [
  {
    key: "proyectosActivos",
    label: "Proyectos activos",
    icon: Layout,
    iconClass: "bg-aplat-cyan/15 text-aplat-cyan",
    format: (v) => String(v),
  },
  {
    key: "suscripcionesActivas",
    label: "Suscripciones activas",
    icon: CreditCard,
    iconClass: "bg-aplat-violet/15 text-aplat-violet",
    format: (v) => String(v),
  },
  {
    key: "mrrUsd",
    label: "MRR (USD)",
    icon: Activity,
    iconClass: "bg-aplat-emerald/15 text-aplat-emerald",
    format: (v) => `$${v}`,
  },
  {
    key: "conexionesRecientes",
    label: "Conexiones recientes",
    icon: Users,
    iconClass: "bg-aplat-cyan/15 text-aplat-cyan",
    format: (v) => String(v),
  },
  {
    key: "whatsappEstado",
    label: "WhatsApp",
    icon: MessageCircle,
    iconClass: "bg-aplat-emerald/15 text-aplat-emerald",
    format: (_, m) =>
      m.whatsappEstado === "conectado"
        ? "Conectado"
        : m.whatsappEstado === "desconectado"
          ? "Desconectado"
          : "Pendiente",
  },
  {
    key: "passkey",
    label: "Passkey",
    icon: KeyRound,
    iconClass: "bg-aplat-violet/15 text-aplat-violet",
    format: (_, m) =>
      m.passkeyEstado === "configurado" ? "Configurado" : "No configurado",
  },
];

type DashboardMetricsProps = {
  metrics?: Partial<MetricsData>;
  onCardClick?: (key: MetricPanelKey) => void;
};

export function DashboardMetrics({ metrics, onCardClick }: DashboardMetricsProps) {
  const m = { ...defaultMetrics, ...metrics };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
    >
      {cards.map(({ key, label, icon: Icon, iconClass, format }) => {
        const value =
          key === "whatsappEstado"
            ? format(0, m)
            : key === "passkey"
              ? format(0, m)
              : format(Number(m[key as keyof MetricsData]) ?? 0, m);
        const isClickable = !!onCardClick;
        const Wrapper = isClickable ? "button" : "div";
        return (
          <motion.div key={key} variants={item} className="contents">
            <Wrapper
              type={isClickable ? "button" : undefined}
              onClick={isClickable ? () => onCardClick(key) : undefined}
              className={`w-full text-left glass glass-neon rounded-2xl p-4 md:p-5 border border-white/10 transition-colors ${
                isClickable
                  ? "hover:border-white/25 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-aplat-cyan/50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-aplat-muted text-xs font-medium uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-aplat-text truncate">
                    {value}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className={`rounded-xl p-2 ${iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isClickable && (
                    <ChevronRight className="w-4 h-4 text-aplat-muted" />
                  )}
                </div>
              </div>
            </Wrapper>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
