"use client";

import { useEffect, useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardWidgetWhatsApp } from "@/components/dashboard/DashboardWidgetWhatsApp";
import { DashboardWidgetSubscriptions } from "@/components/dashboard/DashboardWidgetSubscriptions";
import { DashboardWidgetConnections } from "@/components/dashboard/DashboardWidgetConnections";
import type { MetricsData } from "@/components/dashboard/DashboardMetrics";
import type { ProjectEntry } from "@/components/dashboard/DashboardWidgetSubscriptions";
import portfolioUrls from "@/data/portfolio-production-urls.json";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

const projects: ProjectEntry[] = Object.entries(portfolioUrls as Record<string, string>).map(
  ([name, url]) => ({ name, url })
);

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Partial<MetricsData>>({});
  const [connectionsCount, setConnectionsCount] = useState(0);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
    if (!token || !API_URL) {
      setMetrics({
        proyectosActivos: projects.length,
        suscripcionesActivas: 0,
        mrrUsd: 0,
        conexionesRecientes: 0,
        whatsappEstado: "pendiente",
      });
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/dashboard/connections?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const count = Array.isArray(data.connections) ? data.connections.length : 0;
        setConnectionsCount(count);
        setMetrics({
          proyectosActivos: projects.length,
          suscripcionesActivas: 0,
          mrrUsd: 0,
          conexionesRecientes: count,
          whatsappEstado: "pendiente",
        });
      })
      .catch(() => {
        setMetrics({
          proyectosActivos: projects.length,
          suscripcionesActivas: 0,
          mrrUsd: 0,
          conexionesRecientes: 0,
          whatsappEstado: "pendiente",
        });
      });
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold text-aplat-text mb-2">Panel de control</h1>
      <p className="text-aplat-muted text-sm mb-6">
        Métricas globales, widgets por servicio y registro de conexiones.
      </p>

      <DashboardMetrics metrics={metrics} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetWhatsApp />
        <DashboardWidgetSubscriptions projects={projects} />
        <DashboardWidgetConnections />
      </section>
    </>
  );
}
