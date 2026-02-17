"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Globe, CheckCircle, XCircle, LogIn } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

export type ConnectionRecord = {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
};

export type VisitorRecord = {
  id: string;
  ip: string;
  userAgent: string;
  path: string;
  referrer: string;
  timestamp: string;
};

function parseUserAgent(ua: string): string {
  if (!ua || ua === "unknown") return "—";
  if (ua.length > 50) return ua.slice(0, 47) + "...";
  return ua;
}

type Tab = "logins" | "visitors";

export function DashboardWidgetConnections() {
  const [tab, setTab] = useState<Tab>("logins");
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loadingConn, setLoadingConn] = useState(true);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
    if (!token || !API_URL) {
      setLoadingConn(false);
      setLoadingVisitors(false);
      if (!API_URL) setError("API no configurada.");
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/dashboard/connections?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.connections)) setConnections(data.connections);
        else setError("No se pudieron cargar las conexiones.");
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoadingConn(false));

    fetch(`${API_URL.replace(/\/$/, "")}/api/dashboard/visitors?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.visitors)) setVisitors(data.visitors);
      })
      .catch(() => {})
      .finally(() => setLoadingVisitors(false));
  }, []);

  const loading = tab === "logins" ? loadingConn : loadingVisitors;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine col-span-1 lg:col-span-2"
    >
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-guru-cyan/15 text-guru-cyan">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-guru-text">
            Quién se conecta y desde dónde
          </h2>
        </div>
        <div className="flex rounded-xl bg-white/5 p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setTab("logins")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "logins"
                ? "bg-guru-cyan/20 text-guru-cyan"
                : "text-guru-muted hover:text-guru-text"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Inicios de sesión
          </button>
          <button
            type="button"
            onClick={() => setTab("visitors")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "visitors"
                ? "bg-guru-cyan/20 text-guru-cyan"
                : "text-guru-muted hover:text-guru-text"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Visitas a la página
          </button>
        </div>
      </div>
      <p className="text-guru-muted text-sm mb-4">
        {tab === "logins"
          ? "Registro de accesos al panel (quién inicia sesión, IP, dispositivo, resultado)."
          : "Personas que entran al sitio: IP, dispositivo, página y procedencia. Como en MundoIAanime."}
      </p>

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-guru-cyan/40 border-t-guru-cyan rounded-full animate-spin" />
        </div>
      )}

      {!loading && tab === "logins" && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-guru-muted border-b border-white/10">
                <th className="text-left py-2 px-2 font-medium">Fecha</th>
                <th className="text-left py-2 px-2 font-medium">Email</th>
                <th className="text-left py-2 px-2 font-medium">IP</th>
                <th className="text-left py-2 px-2 font-medium">Dispositivo</th>
                <th className="text-left py-2 px-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-guru-muted">
                    Aún no hay inicios de sesión registrados.
                  </td>
                </tr>
              ) : (
                connections.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2 px-2 text-guru-text whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleString("es")}
                    </td>
                    <td className="py-2 px-2 text-guru-text">{c.email || "—"}</td>
                    <td className="py-2 px-2 text-guru-muted font-mono text-xs">{c.ip}</td>
                    <td className="py-2 px-2 text-guru-muted max-w-[180px] truncate" title={c.userAgent}>
                      {parseUserAgent(c.userAgent)}
                    </td>
                    <td className="py-2 px-2">
                      {c.success ? (
                        <span className="inline-flex items-center gap-1 text-guru-emerald">
                          <CheckCircle className="w-4 h-4" />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <XCircle className="w-4 h-4" />
                          Fallido
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "visitors" && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-guru-muted border-b border-white/10">
                <th className="text-left py-2 px-2 font-medium">Fecha</th>
                <th className="text-left py-2 px-2 font-medium">IP</th>
                <th className="text-left py-2 px-2 font-medium">Página</th>
                <th className="text-left py-2 px-2 font-medium">Dispositivo</th>
                <th className="text-left py-2 px-2 font-medium">Procedencia</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-guru-muted">
                    Aún no hay visitas registradas. Las visitas se registran al cargar el sitio.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2 px-2 text-guru-text whitespace-nowrap">
                      {new Date(v.timestamp).toLocaleString("es")}
                    </td>
                    <td className="py-2 px-2 text-guru-muted font-mono text-xs">{v.ip}</td>
                    <td className="py-2 px-2 text-guru-text max-w-[120px] truncate" title={v.path}>
                      {v.path || "/"}
                    </td>
                    <td className="py-2 px-2 text-guru-muted max-w-[160px] truncate" title={v.userAgent}>
                      {parseUserAgent(v.userAgent)}
                    </td>
                    <td className="py-2 px-2 text-guru-muted max-w-[140px] truncate" title={v.referrer}>
                      {v.referrer ? (v.referrer.length > 25 ? v.referrer.slice(0, 22) + "..." : v.referrer) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
