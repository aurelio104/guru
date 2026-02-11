"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, Monitor, CheckCircle, XCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

export type ConnectionRecord = {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
};

function parseUserAgent(ua: string): string {
  if (!ua || ua === "unknown") return "—";
  if (ua.length > 50) return ua.slice(0, 47) + "...";
  return ua;
}

export function DashboardWidgetConnections() {
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
    if (!token || !API_URL) {
      setLoading(false);
      if (!API_URL) setConnections([]);
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/dashboard/connections?limit=30`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.connections)) {
          setConnections(data.connections);
        } else {
          setError("No se pudieron cargar las conexiones.");
        }
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine col-span-1 lg:col-span-2"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-xl p-2 bg-aplat-cyan/15 text-aplat-cyan">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-aplat-text">
          Quién se conecta y desde dónde
        </h2>
      </div>
      <p className="text-aplat-muted text-sm mb-4">
        Registro de accesos al panel (IP, dispositivo, resultado). Como en MundoIAanime.
      </p>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-aplat-cyan/40 border-t-aplat-cyan rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-aplat-muted border-b border-white/10">
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
                  <td colSpan={5} className="py-6 text-center text-aplat-muted">
                    Aún no hay conexiones registradas.
                  </td>
                </tr>
              ) : (
                connections.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2 px-2 text-aplat-text whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleString("es")}
                    </td>
                    <td className="py-2 px-2 text-aplat-text">{c.email || "—"}</td>
                    <td className="py-2 px-2 text-aplat-muted font-mono text-xs">
                      {c.ip}
                    </td>
                    <td className="py-2 px-2 text-aplat-muted max-w-[180px] truncate" title={c.userAgent}>
                      {parseUserAgent(c.userAgent)}
                    </td>
                    <td className="py-2 px-2">
                      {c.success ? (
                        <span className="inline-flex items-center gap-1 text-aplat-emerald">
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
    </motion.div>
  );
}
