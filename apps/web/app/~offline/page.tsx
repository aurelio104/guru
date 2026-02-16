"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-aplat-deep flex flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 max-w-md">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-amber-500/20 p-4">
            <WifiOff className="w-12 h-12 text-amber-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-aplat-text mb-2">Sin conexión</h1>
        <p className="text-aplat-muted mb-6">
          No hay conexión a internet. Revisa tu red e inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <p className="mt-4 text-sm text-aplat-muted">
          <Link href="/" className="text-aplat-cyan/80 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
