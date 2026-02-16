"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, ShoppingCart } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

type CatalogService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceOneTime: number;
  priceMonthly: number;
  active: boolean;
  order: number;
};

type QuoteItem = { id: string; name: string; priceOneTime: number; priceMonthly: number };

export default function ServiciosPage() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quote, setQuote] = useState<{ items: QuoteItem[]; totalOneTime: number; totalMonthly: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) {
      setError("API no configurada (NEXT_PUBLIC_APLAT_API_URL).");
      setLoading(false);
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/catalog/services`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.services)) setServices(d.services);
      })
      .catch(() => setError("Error al cargar catálogo."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!API_URL || selectedIds.size === 0) {
      setQuote(null);
      return;
    }
    const ids = Array.from(selectedIds);
    fetch(`${API_URL.replace(/\/$/, "")}/api/catalog/quote?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setQuote({ items: d.items, totalOneTime: d.totalOneTime, totalMonthly: d.totalMonthly });
      })
      .catch(() => setQuote(null));
  }, [selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-aplat-deep text-aplat-text">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-aplat-text mb-2">
            Paquetes y membresías
          </h1>
          <p className="text-aplat-muted">
            Selecciona los servicios del ecosistema APlat. Verás el costo único y la suscripción mensual total.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 text-aplat-muted py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando catálogo...
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-3 mb-8">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => toggle(svc.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    selectedIds.has(svc.id)
                      ? "border-aplat-cyan/50 bg-aplat-cyan/10"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                        selectedIds.has(svc.id) ? "border-aplat-cyan bg-aplat-cyan/20" : "border-white/30"
                      }`}
                    >
                      {selectedIds.has(svc.id) && <Check className="w-4 h-4 text-aplat-cyan" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-aplat-text">{svc.name}</p>
                      <p className="text-sm text-aplat-muted mt-0.5">{svc.description}</p>
                      <p className="text-xs text-aplat-muted mt-2">
                        {svc.priceOneTime > 0 && (
                          <span className="text-aplat-emerald">Costo único: ${svc.priceOneTime}</span>
                        )}
                        {svc.priceOneTime > 0 && svc.priceMonthly > 0 && " · "}
                        {svc.priceMonthly > 0 && (
                          <span>Mensual: ${svc.priceMonthly}/mes</span>
                        )}
                        {svc.priceOneTime === 0 && svc.priceMonthly === 0 && " Precio a consultar"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {quote && quote.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-aplat-cyan/30 bg-aplat-cyan/5 p-6"
              >
                <h2 className="text-lg font-semibold text-aplat-text mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Resumen
                </h2>
                <ul className="space-y-2 mb-4">
                  {quote.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-aplat-muted">{item.name}</span>
                      <span>
                        {item.priceOneTime > 0 && `$${item.priceOneTime} + `}
                        {item.priceMonthly > 0 && `$${item.priceMonthly}/mes`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/10 pt-4 flex justify-between font-semibold">
                  <span>Costo único total</span>
                  <span className="text-aplat-emerald">${quote.totalOneTime}</span>
                </div>
                <div className="flex justify-between font-semibold mt-1">
                  <span>Suscripción mensual total</span>
                  <span className="text-aplat-cyan">${quote.totalMonthly}/mes</span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
