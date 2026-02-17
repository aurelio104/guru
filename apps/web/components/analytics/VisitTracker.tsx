"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

/**
 * Registra en la API cada visita a la página (path, referrer).
 * La API guarda IP, user-agent, path, referrer y timestamp.
 * Se envía en cada carga y al cambiar de ruta (navegación cliente).
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!API_URL) return;
    const path = pathname || "/";
    const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
    fetch(`${API_URL.replace(/\/$/, "")}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
