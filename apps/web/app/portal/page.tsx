"use client";

/**
 * APlat Presence — Captive Portal
 * Página pública para check-in cuando el usuario se conecta al WiFi.
 * Redirigir aquí desde el router CUDY AP1200 u otro captive portal.
 */
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Wifi, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { OcrCedulaCapture } from "@/components/portal/OcrCedulaCapture";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

function useSiteIdFromQuery(): string | null {
  const [siteId, setSiteId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSiteId(params.get("site_id") || params.get("site") || null);
  }, []);
  return siteId;
}

function PortalForm() {
  const siteIdFromQuery = useSiteIdFromQuery();
  const [siteId, setSiteId] = useState<string>(siteIdFromQuery || "");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [visiting, setVisiting] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (siteIdFromQuery) setSiteId(siteIdFromQuery);
  }, [siteIdFromQuery]);

  // Si no hay site_id, intentar obtener el primero de la API (endpoint público)
  useEffect(() => {
    if (siteId || !API_URL) return;
    fetch(`${API_URL.replace(/\/$/, "")}/api/presence/health`).catch(() => {});
  }, [siteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!API_URL) {
      setMessage("Servicio no configurado.");
      setStatus("error");
      return;
    }
    if (!siteId.trim()) {
      setMessage("Identificador de sede no configurado. Contacte al administrador.");
      setStatus("error");
      return;
    }
    if (!name.trim()) {
      setMessage("Ingrese su nombre.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/presence/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId.trim(),
          channel: "wifi_portal",
          name: name.trim(),
          document: document.trim() || undefined,
          visiting: visiting.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("success");
        setName("");
        setDocument("");
        setVisiting("");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al registrar. Intente de nuevo.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Verifique su red.");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-neon rounded-2xl p-8 text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-aplat-emerald mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-aplat-text mb-2">¡Bienvenido!</h2>
        <p className="text-aplat-muted text-sm">
          Registro completado. Ya puede navegar por internet.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-neon rounded-2xl p-6 sm:p-8 space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-aplat-cyan/10">
          <Wifi className="w-6 h-6 text-aplat-cyan" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-aplat-text">Check-in WiFi</h1>
          <p className="text-aplat-muted text-sm">Complete el formulario para continuar</p>
        </div>
      </div>

      {!siteIdFromQuery && (
        <div>
          <label className="block text-sm font-medium text-aplat-muted mb-1">ID de sede</label>
          <input
            type="text"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            placeholder="Identificador de la sede"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text placeholder-aplat-muted/60 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/40"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-aplat-muted mb-1">Nombre *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Su nombre completo"
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text placeholder-aplat-muted/60 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-aplat-muted mb-1">Documento / Cédula</label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="V-12345678"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text placeholder-aplat-muted/60 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/40"
          />
          <OcrCedulaCapture
            onExtract={(_, docNum) => {
              if (docNum) setDocument(docNum);
            }}
            disabled={status === "loading"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-aplat-muted mb-1">¿A quién visita?</label>
        <input
          type="text"
          value={visiting}
          onChange={(e) => setVisiting(e.target.value)}
          placeholder="Departamento o persona"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text placeholder-aplat-muted/60 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-aplat-muted mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text placeholder-aplat-muted/60 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/40"
        />
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 px-4 rounded-xl bg-aplat-cyan text-aplat-deep font-semibold hover:bg-aplat-cyan/90 focus:outline-none focus:ring-2 focus:ring-aplat-cyan/50 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Registrando...
          </>
        ) : (
          "Registrarme y continuar"
        )}
      </button>
    </motion.form>
  );
}

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-aplat-deep flex flex-col items-center justify-center p-4 bg-grid-perspective">
      <Suspense
        fallback={
          <div className="glass-neon rounded-2xl p-8 flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-aplat-cyan" />
            <span className="text-aplat-muted">Cargando...</span>
          </div>
        }
      >
        <PortalForm />
      </Suspense>
      <p className="mt-6 text-aplat-muted/60 text-xs text-center">
        APlat Presence · Check-in automático
      </p>
    </div>
  );
}
