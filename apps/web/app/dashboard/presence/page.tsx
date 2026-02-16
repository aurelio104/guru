"use client";

/**
 * APlat Presence — Dashboard de presencia e inteligencia
 * Métricas, eventos en tiempo real, insights, QR por zona y recomendaciones.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  MapPin,
  Users,
  TrendingUp,
  Wifi,
  Lightbulb,
  RefreshCw,
  ExternalLink,
  Loader2,
  QrCode,
  Download,
  BarChart3,
  PieChart,
  MessageCircle,
} from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { BeaconAdmin } from "@/components/presence/BeaconAdmin";
import { NfcTagAdmin } from "@/components/presence/NfcTagAdmin";

const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Site = { id: string; name: string };
type Zone = { id: string; name: string; site_id: string };
type Analytics = {
  site_id: string;
  total_check_ins: number;
  unique_users: number;
  occupancy_metrics: {
    current: number;
    peak_today: number;
    peak_hour_today: string;
    average_dwell_minutes: number;
    by_zone: Record<string, { current: number; total_today: number }>;
    by_channel: Record<string, number>;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    severity: string;
    confidence: number;
  }>;
  recommendations: string[];
};

type ChartData = {
  by_hour: Array<{ hour: number; label: string; count: number }>;
  by_day: Array<{ date: string; label: string; count: number }>;
  by_channel: Array<{ channel: string; count: number }>;
};

function CreateFirstSiteCard({ onCreated }: { onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!BASE) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/presence/admin/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: "Sede Principal", enabled_channels: "geolocation,qr,wifi_portal,ble,nfc" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        onCreated();
      } else {
        setError(data.error || "Error al crear el sitio.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl glass p-8 text-center max-w-md mx-auto">
      <MapPin className="w-12 h-12 text-aplat-cyan mx-auto mb-4 opacity-80" />
      <p className="text-aplat-muted mb-4">No hay sitios configurados. Crea el primero para usar Presence.</p>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-5 py-2.5 font-medium disabled:opacity-60"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Crear sitio «Sede Principal»
      </button>
    </div>
  );
}

export default function PresenceDashboardPage() {
  const { user } = useDashboardUser();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [active, setActive] = useState<Array<{ id: string; channel: string; checked_in_at: string }>>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsSending, setAlertsSending] = useState(false);

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!Object.keys(headers).length || !API_URL) {
      setLoading(false);
      return;
    }
    try {
      const sitesRes = await fetch(`${BASE}/api/presence/admin/sites`, { headers });
      const sitesData = await sitesRes.json().catch(() => ({}));
      if (sitesData.ok && Array.isArray(sitesData.sites)) {
        setSites(sitesData.sites);
        if (!selectedSiteId && sitesData.sites.length > 0) {
          setSelectedSiteId(sitesData.sites[0].id);
        }
      }
    } catch {
      /* fallthrough */
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedSiteId || !API_URL) {
      setLoading(false);
      return;
    }
    const headers = getAuthHeaders();
    if (!Object.keys(headers).length) return;
    setRefreshing(true);
    try {
      const [analyticsRes, activeRes, zonesRes, chartRes] = await Promise.all([
        fetch(`${BASE}/api/presence/analytics?site_id=${selectedSiteId}&period_days=7`, { headers }),
        fetch(`${BASE}/api/presence/active?site_id=${selectedSiteId}`, { headers }),
        fetch(`${BASE}/api/presence/zones?site_id=${selectedSiteId}`, { headers }),
        fetch(`${BASE}/api/presence/chart-data?site_id=${selectedSiteId}&period_days=7`, { headers }),
      ]);
      const analyticsData = await analyticsRes.json().catch(() => ({}));
      const activeData = await activeRes.json().catch(() => ({}));
      if (analyticsData.ok && analyticsData.analytics) {
        setAnalytics(analyticsData.analytics);
      }
      if (activeData.ok && Array.isArray(activeData.active)) {
        setActive(activeData.active);
      }
      const zonesData = await zonesRes.json().catch(() => ({}));
      if (zonesData.ok && Array.isArray(zonesData.zones)) {
        setZones(zonesData.zones);
      }
      const chartDataRes = await chartRes.json().catch(() => ({}));
      if (chartDataRes.ok && chartDataRes.chart_data) {
        setChartData(chartDataRes.chart_data);
      }
    } catch {
      setAnalytics(null);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedSiteId) fetchAnalytics();
  }, [selectedSiteId, fetchAnalytics]);

  if (user?.role !== "master") {
    return (
      <div className="rounded-xl glass p-6 text-center">
        <p className="text-aplat-muted">Acceso restringido a administradores.</p>
      </div>
    );
  }

  if (!API_URL) {
    return (
      <div className="rounded-xl glass p-6 text-center">
        <p className="text-aplat-muted">Configure NEXT_PUBLIC_APLAT_API_URL para usar Presence.</p>
      </div>
    );
  }

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-aplat-cyan" />
      </div>
    );
  }

  if (!loading && sites.length === 0) {
    return (
      <CreateFirstSiteCard
        onCreated={() => {
          setLoading(true);
          fetchData();
        }}
      />
    );
  }

  const m = analytics?.occupancy_metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-aplat-text flex items-center gap-2">
            <MapPin className="w-7 h-7 text-aplat-cyan" />
            Presence
          </h1>
          <p className="text-aplat-muted text-sm mt-1">
            Presencia, check-ins e inteligencia contextual
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sites.length > 1 && (
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-aplat-text"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              const headers = getAuthHeaders();
              const url = `${BASE}/api/presence/export?site_id=${selectedSiteId}&format=csv&period_days=30`;
              fetch(url, { headers })
                .then((r) => r.text())
                .then((text) => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
                  a.download = `presence-${selectedSiteId}-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-aplat-text text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              const headers = getAuthHeaders();
              const url = `${BASE}/api/presence/export?site_id=${selectedSiteId}&format=json&period_days=30`;
              fetch(url, { headers })
                .then((r) => r.json())
                .then((data) => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
                  a.download = `presence-${selectedSiteId}-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-aplat-text text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              setAlertsSending(true);
              try {
                const res = await fetch(`${BASE}/api/admin/presence-alerts`, {
                  method: "POST",
                  headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                  body: JSON.stringify({ site_id: selectedSiteId || undefined }),
                });
                const data = await res.json().catch(() => ({}));
                if (data.ok) alert(`Alertas: ${data.sent ?? 0} enviadas, ${data.skipped ?? 0} omitidas.`);
                else alert(data.error || "Error al enviar alertas.");
              } finally {
                setAlertsSending(false);
              }
            }}
            disabled={alertsSending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm"
          >
            <MessageCircle className={`w-4 h-4 ${alertsSending ? "animate-pulse" : ""}`} />
            Alertas WA
          </button>
          <button
            onClick={() => fetchAnalytics()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan hover:bg-aplat-cyan/30"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {refreshing && !analytics && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-aplat-cyan" />
        </div>
      )}

      {!refreshing && !analytics && sites.length > 0 && (
        <div className="rounded-xl glass p-6 text-center">
          <p className="text-aplat-muted">No se pudieron cargar los datos. Revisa la conexión e intenta de nuevo.</p>
          <button
            type="button"
            onClick={() => fetchAnalytics()}
            className="mt-3 px-4 py-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan hover:bg-aplat-cyan/30 text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-neon rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-aplat-muted text-sm mb-1">
                <Users className="w-4 h-4" />
                Ahora
              </div>
              <p className="text-2xl font-bold text-aplat-text">{m?.current ?? 0}</p>
              <p className="text-xs text-aplat-muted">personas en el sitio</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-neon rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-aplat-muted text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Pico hoy
              </div>
              <p className="text-2xl font-bold text-aplat-text">{m?.peak_today ?? 0}</p>
              <p className="text-xs text-aplat-muted">a las {m?.peak_hour_today ?? "—"}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-neon rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-aplat-muted text-sm mb-1">Total 7 días</div>
              <p className="text-2xl font-bold text-aplat-text">{analytics.total_check_ins}</p>
              <p className="text-xs text-aplat-muted">check-ins</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-neon rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-aplat-muted text-sm mb-1">Permanencia</div>
              <p className="text-2xl font-bold text-aplat-text">{m?.average_dwell_minutes ?? 0} min</p>
              <p className="text-xs text-aplat-muted">promedio</p>
            </motion.div>
          </div>

          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="glass-neon rounded-xl p-6"
              >
                <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-aplat-cyan" />
                  Check-ins por hora (7 días)
                </h3>
                <div className="flex items-end gap-0.5 h-24">
                  {chartData.by_hour.slice(6, 22).map((item) => {
                    const max = Math.max(1, ...chartData.by_hour.map((x) => x.count));
                    const pct = (item.count / max) * 100;
                    return (
                      <div key={item.hour} className="flex-1 flex flex-col items-center" title={`${item.label}: ${item.count}`}>
                        <div
                          className="w-full min-h-[2px] rounded-t bg-aplat-cyan/60 transition-all duration-300"
                          style={{ height: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-aplat-muted">
                  <span>06:00</span>
                  <span>22:00</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-neon rounded-xl p-6"
              >
                <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-aplat-emerald" />
                  Check-ins por día (7 días)
                </h3>
                <div className="flex items-end gap-1 h-24">
                  {chartData.by_day.slice(-7).map((item) => {
                    const max = Math.max(1, ...chartData.by_day.map((x) => x.count));
                    const pct = (item.count / max) * 100;
                    return (
                      <div key={item.date} className="flex-1 flex flex-col items-center" title={`${item.label}: ${item.count}`}>
                        <div
                          className="w-full min-h-[2px] rounded-t bg-aplat-emerald/60"
                          style={{ height: `${Math.max(2, pct)}%` }}
                        />
                        <span className="text-[10px] text-aplat-muted mt-1 truncate max-w-full">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {chartData?.by_channel && chartData.by_channel.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="glass-neon rounded-xl p-6"
            >
              <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-aplat-cyan" />
                Check-ins por canal
              </h3>
              <div className="flex flex-wrap gap-3">
                {chartData.by_channel.map(({ channel, count }) => {
                  const total = chartData.by_channel.reduce((s, c) => s + c.count, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={channel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                      <span className="text-aplat-text text-sm capitalize">{channel.replace("_", " ")}</span>
                      <span className="text-aplat-cyan font-medium">{count}</span>
                      <span className="text-aplat-muted text-xs">({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="glass-neon rounded-xl p-6"
            >
              <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-aplat-cyan" />
                Activos ahora
              </h3>
              {active.length === 0 ? (
                <p className="text-aplat-muted text-sm">Nadie en el sitio.</p>
              ) : (
                <ul className="space-y-2">
                  {active.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <span className="text-aplat-text text-sm">
                        Check-in vía {a.channel} • {new Date(a.checked_in_at).toLocaleTimeString("es")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-neon rounded-xl p-6"
            >
              <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-aplat-emerald" />
                Insights
              </h3>
              {!analytics.insights?.length ? (
                <p className="text-aplat-muted text-sm">Sin insights aún.</p>
              ) : (
                <ul className="space-y-3">
                  {analytics.insights.slice(0, 5).map((insight, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-aplat-text">{insight.title}</span>
                      <p className="text-aplat-muted mt-0.5">{insight.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>

          {analytics.recommendations?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6 border border-aplat-cyan/20"
            >
              <h3 className="font-semibold text-aplat-text mb-3">Recomendaciones</h3>
              <ul className="space-y-2">
                {analytics.recommendations.map((r, i) => (
                  <li key={i} className="text-aplat-muted text-sm flex items-start gap-2">
                    <span className="text-aplat-cyan">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {zones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-neon rounded-xl p-6"
            >
              <h3 className="font-semibold text-aplat-text mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-aplat-cyan" />
                Códigos QR por zona
              </h3>
              <p className="text-aplat-muted text-sm mb-4">
                Imprima o muestre en pantalla. Los visitantes escanean con la cámara del teléfono.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {zones.map((z) => {
                  const qrUrl = typeof window !== "undefined"
                    ? `${window.location.origin}/presence/check-in?site_id=${selectedSiteId}&zone_id=${z.id}&channel=qr`
                    : "";
                  return (
                    <div
                      key={z.id}
                      className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      {qrUrl && (
                        <div className="p-2 bg-white rounded-lg mb-2">
                          <QRCodeSVG value={qrUrl} size={120} level="M" />
                        </div>
                      )}
                      <p className="text-aplat-text text-sm font-medium text-center">{z.name}</p>
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aplat-cyan text-xs mt-1 hover:underline"
                      >
                        Abrir
                      </a>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-neon rounded-xl p-6"
            >
              <BeaconAdmin siteId={selectedSiteId} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glass-neon rounded-xl p-6"
            >
              <NfcTagAdmin siteId={selectedSiteId} />
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/portal?site_id=${selectedSiteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-aplat-text text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Portal WiFi
            </a>
            <a
              href={`/presence/check-in?site_id=${selectedSiteId}&channel=smart`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Check-in Inteligente
            </a>
            <a
              href={`/presence/check-in?site_id=${selectedSiteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-aplat-text text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Check-in manual
            </a>
          </div>
        </>
      )}
    </div>
  );
}
