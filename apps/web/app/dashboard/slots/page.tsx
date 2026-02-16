"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Plus, Loader2, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Resource = { id: string; name: string; description: string; slotDurationMinutes: number; active: boolean };
type Booking = { id: string; resourceId: string; startAt: string; endAt: string; title?: string; status: string };

export default function DashboardSlotsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!BASE) return;
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/slots/resources`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${BASE}/api/slots/bookings/recent?limit=20`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([rRes, bRes]) => {
        if (rRes.ok && Array.isArray(rRes.resources)) setResources(rRes.resources);
        if (bRes.ok && Array.isArray(bRes.bookings)) setBookings(bRes.bookings);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-aplat-cyan/15 text-aplat-cyan">
            <Calendar className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-aplat-text">Slots / Reservas</h1>
        </div>
        <button type="button" onClick={fetchData} className="p-2 rounded-xl border border-white/20 hover:bg-white/5 text-aplat-muted hover:text-aplat-text">
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>
      {loading && resources.length === 0 ? (
        <div className="flex items-center gap-2 text-aplat-muted py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-aplat-text mb-3">Recursos</h2>
            {resources.length === 0 ? (
              <p className="text-aplat-muted py-4">No hay recursos. Crear desde API (rol master).</p>
            ) : (
              <ul className="space-y-2">
                {resources.map((r) => (
                  <li key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="font-medium text-aplat-text">{r.name}</p>
                    <p className="text-sm text-aplat-muted">{r.slotDurationMinutes} min/slot</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-aplat-text mb-3">Últimas reservas</h2>
            {bookings.length === 0 ? (
              <p className="text-aplat-muted py-4">No hay reservas.</p>
            ) : (
              <ul className="space-y-2">
                {bookings.map((b) => (
                  <li key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-aplat-text text-sm">{b.title || "Reserva"}</p>
                    <p className="text-xs text-aplat-muted">
                      {new Date(b.startAt).toLocaleString()} – {new Date(b.endAt).toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
