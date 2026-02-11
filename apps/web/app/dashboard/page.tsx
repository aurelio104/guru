"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardWidgetWhatsApp } from "@/components/dashboard/DashboardWidgetWhatsApp";
import { DashboardWidgetSubscriptions } from "@/components/dashboard/DashboardWidgetSubscriptions";
import { DashboardWidgetConnections } from "@/components/dashboard/DashboardWidgetConnections";
import { DashboardWidgetPasskey } from "@/components/dashboard/DashboardWidgetPasskey";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import type { MetricsData } from "@/components/dashboard/DashboardMetrics";
import type { ProjectEntry } from "@/components/dashboard/DashboardWidgetSubscriptions";
import portfolioUrls from "@/data/portfolio-production-urls.json";

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

      <DashboardMetrics metrics={metrics} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetWhatsApp />
        <DashboardWidgetPasskey />
        <DashboardWidgetSubscriptions projects={projects} />
        <DashboardWidgetConnections />
      </section>
    </>
  );
}
