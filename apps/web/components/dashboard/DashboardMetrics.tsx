"use client";

import { motion } from "framer-motion";
import {
  Layout,
  CreditCard,
  Users,
  Activity,
  MessageCircle,
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
};

const defaultMetrics: MetricsData = {
  proyectosActivos: 0,
  suscripcionesActivas: 0,
  mrrUsd: 0,
  conexionesRecientes: 0,
  whatsappEstado: "pendiente",
};

const cards: Array<{
  key: keyof MetricsData;
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
];

export function DashboardMetrics({ metrics }: { metrics?: Partial<MetricsData> }) {
  const m = { ...defaultMetrics, ...metrics };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8"
    >
      {cards.map(({ key, label, icon: Icon, iconClass, format }) => (
        <motion.div
          key={key}
          variants={item}
          className="glass glass-neon rounded-2xl p-4 md:p-5 border border-white/10 hover:border-white/15 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-aplat-muted text-xs font-medium uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-2xl font-bold text-aplat-text">
                {key === "whatsappEstado"
                  ? format(0, m)
                  : format(Number(m[key]) ?? 0, m)}
              </p>
            </div>
            <div className={`rounded-xl p-2 ${iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.section>
  );
}
