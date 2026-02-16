"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type PlatformStatus = {
  ok: boolean;
  at: string;
  counts: {
    sites: number;
    products: number;
    orders: number;
    assets: number;
    reports: number;
    vulnerabilitiesOpen: number;
    incidentsOpen: number;
    gdprPending: number;
  };
  suggestions: string[];
};

export function DashboardWidgetPlatformStatus() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!BASE || !getAuthHeaders().Authorization) {
      setLoading(false);
      return;
    }
    fetch(`${BASE}/api/platform/status`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => d.ok && d.counts && setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !status) return null;

  const { counts, suggestions } = status;
  const hasGaps = suggestions.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-aplat-text">Estado de la plataforma</h2>
      </div>
      <p className="text-aplat-muted text-sm mb-3">
        Resumen de módulos y sugerencias para completar la configuración.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-3">
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-cyan font-semibold text-sm">{counts.sites}</p>
          <p className="text-aplat-muted text-xs">Sedes</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-text font-semibold text-sm">{counts.products}</p>
          <p className="text-aplat-muted text-xs">Productos</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-text font-semibold text-sm">{counts.orders}</p>
          <p className="text-aplat-muted text-xs">Pedidos</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-text font-semibold text-sm">{counts.assets}</p>
          <p className="text-aplat-muted text-xs">Activos</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-text font-semibold text-sm">{counts.reports}</p>
          <p className="text-aplat-muted text-xs">Reportes</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-amber-400 font-semibold text-sm">{counts.vulnerabilitiesOpen}</p>
          <p className="text-aplat-muted text-xs">Vulns abiertas</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-orange-400 font-semibold text-sm">{counts.incidentsOpen}</p>
          <p className="text-aplat-muted text-xs">Incidentes abiertos</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
          <p className="text-aplat-muted font-semibold text-sm">{counts.gdprPending}</p>
          <p className="text-aplat-muted text-xs">GDPR pend.</p>
        </div>
      </div>
      {hasGaps && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
          <p className="text-amber-400/90 text-sm font-medium mb-2">Sugerencias</p>
          <ul className="space-y-1 text-sm text-aplat-muted">
            {suggestions.slice(0, 5).map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-aplat-cyan text-xs mt-2 hover:underline"
          >
            Ver accesos rápidos
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
