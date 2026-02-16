"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[APlat Error Boundary]", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-aplat-deep">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-aplat-text mb-2">Algo salió mal</h1>
        <p className="text-aplat-muted text-sm mb-4">
          La aplicación encontró un error. Puedes intentar de nuevo o volver al inicio.
        </p>
        {error?.message && (
          <p className="text-red-400/80 text-xs font-mono mb-4 truncate max-w-full" title={error.message}>
            {error.message}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2 text-sm font-medium hover:bg-aplat-cyan/30"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm text-aplat-muted hover:bg-white/5 hover:text-aplat-text"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
