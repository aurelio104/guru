/**
 * URL de la API GURU.
 * Usa NEXT_PUBLIC_GURU_API_URL o fallback según el host (producción en Vercel → Koyeb).
 */
const PRODUCTION_API = "https://guru-aurelio104-8e2f096a.koyeb.app";

export function getApiUrl(): string {
  const env = process.env.NEXT_PUBLIC_GURU_API_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h.includes("vercel.app") || h.includes("guru")) return PRODUCTION_API;
    if (h === "localhost" || h === "127.0.0.1") return "http://localhost:3001";
  }
  return "";
}
