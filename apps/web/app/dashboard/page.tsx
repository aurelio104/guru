"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { MapPin, Package, ShieldAlert, FileCheck, AlertTriangle, Calendar, FileText, ShoppingCart, ChevronRight } from "lucide-react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardMetricPanel } from "@/components/dashboard/DashboardMetricPanel";
import { DashboardWidgetSubscriptions } from "@/components/dashboard/DashboardWidgetSubscriptions";
import { DashboardWidgetConnections } from "@/components/dashboard/DashboardWidgetConnections";
import { DashboardWidgetPush } from "@/components/dashboard/DashboardWidgetPush";
import { DashboardWidgetPlatformStatus } from "@/components/dashboard/DashboardWidgetPlatformStatus";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import type { MetricsData, MetricPanelKey } from "@/components/dashboard/DashboardMetrics";
import type { ProjectEntry } from "@/components/dashboard/DashboardWidgetSubscriptions";
import portfolioUrls from "@/data/portfolio-production-urls.json";

const QUICK_LINKS = [
  { href: "/dashboard/presence", label: "Presence", desc: "Check-ins, zonas, beacons, portal WiFi", icon: MapPin, color: "bg-aplat-cyan/15 text-aplat-cyan" },
  { href: "/dashboard/assets", label: "Activos", desc: "Tracking BLE de activos", icon: Package, color: "bg-aplat-cyan/15 text-aplat-cyan" },
  { href: "/dashboard/security", label: "Security", desc: "Vulnerabilidades y escaneos", icon: ShieldAlert, color: "bg-amber-500/15 text-amber-400" },
  { href: "/dashboard/gdpr", label: "GDPR / LOPD", desc: "Checklist de cumplimiento", icon: FileCheck, color: "bg-emerald-500/15 text-emerald-400" },
  { href: "/dashboard/incidents", label: "Incidentes", desc: "Registro y playbooks", icon: AlertTriangle, color: "bg-orange-500/15 text-orange-400" },
  { href: "/dashboard/slots", label: "Slots", desc: "Disponibilidad y reservas", icon: Calendar, color: "bg-aplat-violet/15 text-aplat-violet" },
  { href: "/dashboard/reports", label: "Reportes", desc: "Informes y análisis", icon: FileText, color: "bg-aplat-violet/15 text-aplat-violet" },
  { href: "/dashboard/commerce", label: "Commerce", desc: "Pedidos y productos", icon: ShoppingCart, color: "bg-aplat-emerald/15 text-aplat-emerald" },
] as const;

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

const projects: ProjectEntry[] = Object.entries(portfolioUrls as Record<string, string>).map(
  ([name, url]) => ({ name, url })
);

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default function DashboardPage() {
  const { user } = useDashboardUser();
  const [metrics, setMetrics] = useState<Partial<MetricsData>>({});
  const [openPanel, setOpenPanel] = useState<MetricPanelKey | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (user?.role !== "master") return;
    const headers = getAuthHeaders();
    if (!Object.keys(headers).length || !API_URL) {
      setMetrics({
        proyectosActivos: projects.length,
        suscripcionesActivas: 0,
        mrrUsd: 0,
        conexionesRecientes: 0,
        whatsappEstado: "pendiente",
      });
      return;
    }
    try {
      const [connRes, subsRes, waRes] = await Promise.all([
        fetch(`${BASE}/api/dashboard/connections?limit=100`, { headers }),
        fetch(`${BASE}/api/admin/subscriptions`, { headers }),
        fetch(`${BASE}/api/whatsapp/status`, { headers }),
      ]);
      const connData = await connRes.json().catch(() => ({}));
      const subsData = await subsRes.json().catch(() => ({}));
      const waData = await waRes.json().catch(() => ({}));

      const conexionesRecientes = Array.isArray(connData.connections) ? connData.connections.length : 0;
      const subscriptions = Array.isArray(subsData.subscriptions) ? subsData.subscriptions : [];
      const suscripcionesActivas = subscriptions.filter((s: { status?: string }) => s.status === "active").length;
      const mrrUsd = subscriptions
        .filter((s: { status?: string; amount?: number }) => s.status === "active" && s.amount != null)
        .reduce((sum: number, s: { amount?: number }) => sum + (Number(s.amount) || 0), 0);
      const whatsappEstado =
        waData.connected === true ? "conectado" : waData.connected === false ? "desconectado" : "pendiente";

      setMetrics({
        proyectosActivos: projects.length,
        suscripcionesActivas,
        mrrUsd: Math.round(mrrUsd * 100) / 100,
        conexionesRecientes,
        whatsappEstado,
      });
    } catch {
      setMetrics({
        proyectosActivos: projects.length,
        suscripcionesActivas: 0,
        mrrUsd: 0,
        conexionesRecientes: 0,
        whatsappEstado: "pendiente",
      });
    }
  }, [user?.role]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (user?.role === "client") {
    return <ClientDashboard />;
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-aplat-text mb-2">Panel de control</h1>
      <p className="text-aplat-muted text-sm mb-6">
        Métricas globales, widgets por servicio y registro de conexiones.
      </p>

      <DashboardMetrics
        metrics={metrics}
        onCardClick={(key) => setOpenPanel(key)}
      />

      {user?.role === "master" && <DashboardWidgetPlatformStatus />}

      <AnimatePresence>
        {openPanel && (
          <DashboardMetricPanel
            key={openPanel}
            panel={openPanel}
            onClose={() => setOpenPanel(null)}
            projects={projects}
            mrrUsd={metrics.mrrUsd}
          />
        )}
      </AnimatePresence>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetSubscriptions projects={projects} />
        <DashboardWidgetConnections />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-aplat-text mb-3">Accesos rápidos</h2>
        <p className="text-aplat-muted text-sm mb-4">
          Módulos del panel: presencia, seguridad, cumplimiento, incidentes y más.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 hover:border-white/20 transition-colors group"
              >
                <div className={`rounded-lg p-2 ${link.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-aplat-text group-hover:text-aplat-cyan">{link.label}</p>
                  <p className="text-xs text-aplat-muted truncate">{link.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-aplat-muted shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <DashboardWidgetPush />
      </section>
    </>
  );
}
