"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[GURU Global Error]", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#030306] text-white font-sans flex flex-col items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
            !
          </div>
          <h1 className="text-xl font-semibold mb-2">Error crítico</h1>
          <p className="text-gray-400 text-sm mb-4">
            La aplicación no pudo continuar. Intenta recargar la página.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-4 py-2 text-sm font-medium hover:bg-cyan-500/30"
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
