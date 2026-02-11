"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Wrench, Loader2, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CountryCodePhoneInput } from "@/components/ui/CountryCodePhoneInput";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function DashboardWidgetWhatsApp() {
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);
  const [whatsappQR, setWhatsappQR] = useState<string | null>(null);
  const [gettingQR, setGettingQR] = useState(false);
  const [cleaningWhatsApp, setCleaningWhatsApp] = useState(false);
  const [whatsappLinkingError, setWhatsappLinkingError] = useState(false);
  const [whatsappCooldown, setWhatsappCooldown] = useState(false);
  const [whatsappServiceError, setWhatsappServiceError] = useState<string | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState<string | null>(null);
  const [sendPhone, setSendPhone] = useState("");
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkWhatsAppStatus = useCallback(async () => {
    if (!API_URL) {
      setWhatsappServiceError("API no configurada (NEXT_PUBLIC_APLAT_API_URL).");
      setWhatsappConnected(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/whatsapp/status`, {
        headers: getAuthHeaders(),
      });
      const text = await res.text();
      let data: { ok?: boolean; connected?: boolean } = {};
      try {
        data = JSON.parse(text);
      } catch {
        setWhatsappServiceError("Respuesta inválida del servidor.");
        setWhatsappConnected(false);
        return;
      }
      setWhatsappServiceError(null);
      setWhatsappConnected(!!data.connected);
      if (data.connected) setWhatsappQR(null);
    } catch (err) {
      setWhatsappServiceError(err instanceof Error ? err.message : "Error de conexión.");
      setWhatsappConnected(false);
    }
  }, []);

  useEffect(() => {
    void checkWhatsAppStatus();
  }, [checkWhatsAppStatus]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const interval = whatsappQR ? 30_000 : whatsappConnected ? 600_000 : 180_000;
    intervalRef.current = setInterval(() => void checkWhatsAppStatus(), interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [whatsappConnected, whatsappQR, checkWhatsAppStatus]);

  const requestQR = useCallback(async () => {
    if (gettingQR || cleaningWhatsApp || !API_URL) return;
    setGettingQR(true);
    setWhatsappMessage(null);
    setWhatsappLinkingError(false);
    setWhatsappCooldown(false);
    setWhatsappServiceError(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/whatsapp/qr?generate=true`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (data.qr) {
        setWhatsappQR(data.qr);
        setWhatsappConnected(false);
      } else {
        setWhatsappMessage(data.message || "QR no disponible.");
        setWhatsappLinkingError(!!data.linkingError);
        setWhatsappCooldown(!!data.cooldown);
      }
    } catch (err) {
      setWhatsappServiceError(err instanceof Error ? err.message : "Error al obtener QR.");
    } finally {
      setGettingQR(false);
    }
  }, [gettingQR, cleaningWhatsApp]);

  const cleanWhatsAppCredentials = useCallback(async () => {
    if (cleaningWhatsApp || !API_URL) return;
    if (!confirm("¿Limpiar credenciales de WhatsApp? Se generará un nuevo QR para vincular.")) return;
    setCleaningWhatsApp(true);
    setWhatsappMessage(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/whatsapp/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      setWhatsappMessage(data.message ?? (data.ok ? "Credenciales limpiadas." : "Error al limpiar."));
      setWhatsappQR(null);
      setWhatsappConnected(false);
      await checkWhatsAppStatus();
      if (data.ok) setTimeout(() => requestQR(), 500);
    } catch (err) {
      setWhatsappServiceError(err instanceof Error ? err.message : "Error al limpiar.");
    } finally {
      setCleaningWhatsApp(false);
    }
  }, [cleaningWhatsApp, checkWhatsAppStatus, requestQR]);

  const handleDisconnect = useCallback(async () => {
    if (cleaningWhatsApp || gettingQR) return;
    if (!confirm("¿Desconectar WhatsApp? Se limpiarán las credenciales y podrás generar un nuevo QR.")) return;
    setCleaningWhatsApp(true);
    try {
      await fetch(`${API_URL.replace(/\/$/, "")}/api/whatsapp/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: "{}",
      });
      setWhatsappQR(null);
      setWhatsappConnected(false);
      await checkWhatsAppStatus();
    } finally {
      setCleaningWhatsApp(false);
    }
  }, [cleaningWhatsApp, gettingQR, checkWhatsAppStatus]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendPhone.trim() || !sendText.trim() || sending || !API_URL) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ phoneNumber: sendPhone.trim(), message: sendText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setSendResult({
        ok: !!data.ok && !!data.success,
        text: data.error || data.message || (data.ok ? "Enviado." : "Error al enviar."),
      });
    } catch (err) {
      setSendResult({ ok: false, text: err instanceof Error ? err.message : "Error de conexión." });
    } finally {
      setSending(false);
    }
  }, [sendPhone, sendText, sending]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-xl p-2 bg-aplat-emerald/15 text-aplat-emerald">
          <MessageCircle className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-aplat-text">WhatsApp</h2>
      </div>
      <p className="text-aplat-muted text-sm mb-4">
        Conecta con QR (como en Omac). Solo disponible cuando la API corre en Koyeb.
      </p>

      {/* Estado: no conectado + QR o botones */}
      {whatsappConnected === false && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
          <p className="text-amber-200 text-sm font-medium mb-1">WhatsApp no está conectado</p>
          <p className="text-aplat-muted text-xs mb-3">
            {whatsappQR
              ? "Escanea el QR con tu teléfono (WhatsApp → Dispositivos vinculados → Vincular)."
              : whatsappServiceError
                ? whatsappServiceError
                : whatsappLinkingError
                  ? "Límite de dispositivos o error de vinculación. Desvincula dispositivos antiguos en WhatsApp."
                  : whatsappCooldown
                    ? "Espera unos minutos antes de generar otro QR (cooldown)."
                    : "Haz clic en «Obtener QR» para vincular. No se genera automáticamente para evitar restricciones."}
          </p>
          {whatsappMessage && (
            <p className="text-aplat-muted text-xs mb-2">{whatsappMessage}</p>
          )}
          {!whatsappQR && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={requestQR}
                disabled={gettingQR || cleaningWhatsApp}
                className="inline-flex items-center gap-2 rounded-xl bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/40 px-3 py-2 text-sm font-medium disabled:opacity-60"
              >
                {gettingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : "📱"}
                {gettingQR ? "Obteniendo..." : "Obtener QR"}
              </button>
              <button
                type="button"
                onClick={cleanWhatsAppCredentials}
                disabled={cleaningWhatsApp || gettingQR}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 text-sm font-medium disabled:opacity-60"
              >
                {cleaningWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                {cleaningWhatsApp ? "Limpiando..." : "Limpiar credenciales"}
              </button>
            </div>
          )}
          {whatsappQR && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="rounded-xl bg-white p-4">
                <QRCodeSVG value={whatsappQR} size={220} />
              </div>
              <p className="text-aplat-muted text-xs text-center">
                WhatsApp → Dispositivos vinculados → Vincular un dispositivo
              </p>
            </div>
          )}
          {!whatsappQR && gettingQR && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-aplat-cyan" />
              <p className="text-aplat-muted text-xs">Generando QR...</p>
            </div>
          )}
        </div>
      )}

      {/* Estado: conectado */}
      {whatsappConnected === true && (
        <div className="rounded-xl bg-aplat-emerald/10 border border-aplat-emerald/20 p-4 mb-4">
          <p className="text-aplat-emerald text-sm font-medium">WhatsApp conectado</p>
          <p className="text-aplat-muted text-xs">Listo para enviar mensajes.</p>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={cleaningWhatsApp || gettingQR}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {cleaningWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {cleaningWhatsApp ? "Desconectando..." : "Desconectar WhatsApp"}
          </button>
        </div>
      )}

      {/* Enviar mensaje (cuando está conectado) */}
      {whatsappConnected === true && (
        <form onSubmit={handleSendMessage} className="space-y-2">
          <p className="text-aplat-muted text-xs font-medium">Enviar mensaje</p>
          <CountryCodePhoneInput
            value={sendPhone}
            onChange={setSendPhone}
            placeholder="Número"
          />
          <textarea
            value={sendText}
            onChange={(e) => setSendText(e.target.value)}
            placeholder="Mensaje"
            rows={2}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Enviando..." : "Enviar"}
          </button>
          {sendResult && (
            <p className={`text-xs ${sendResult.ok ? "text-aplat-emerald" : "text-red-400"}`}>
              {sendResult.text}
            </p>
          )}
        </form>
      )}

      {whatsappConnected === null && !whatsappServiceError && (
        <div className="flex items-center gap-2 py-2 text-aplat-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Comprobando estado...
        </div>
      )}
    </motion.div>
  );
}
