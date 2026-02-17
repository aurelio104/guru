"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";
const BASE = API_URL.replace(/\/$/, "");

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function DashboardWidgetPush() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"unknown" | "supported" | "unsupported" | "subscribed" | "unsubscribed">("unknown");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("supported");
  }, []);

  async function subscribe() {
    if (!BASE || status !== "supported") return;
    setMessage(null);
    setLoading(true);
    try {
      const vapidRes = await fetch(`${BASE}/api/push/vapid-public`);
      const vapidData = await vapidRes.json().catch(() => ({}));
      if (!vapidData.ok || !vapidData.publicKey) {
        setMessage("Push no configurado en el servidor (VAPID).");
        setLoading(false);
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permiso de notificaciones denegado.");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.publicKey as string,
      });
      const authKey = sub.getKey("auth");
      const p256Key = sub.getKey("p256dh");
      if (!authKey || !p256Key) throw new Error("Keys missing");
      const body = {
        endpoint: sub.endpoint,
        keys: {
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256Key))),
        },
        userAgent: navigator.userAgent,
      };
      const res = await fetch(`${BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("subscribed");
        setMessage("Notificaciones activadas.");
      } else {
        setMessage(data.error || "Error al registrar.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al suscribirse.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "unsupported") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-guru-muted">Notificaciones push no soportadas en este navegador.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4 text-guru-cyan" />
        <span className="font-medium text-guru-text text-sm">Notificaciones push</span>
      </div>
      {message && <p className="text-xs text-guru-muted mb-2">{message}</p>}
      {status === "subscribed" ? (
        <p className="text-sm text-guru-emerald/80">Activadas</p>
      ) : (
        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-guru-cyan/20 text-guru-cyan px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Activar notificaciones
        </button>
      )}
    </div>
  );
}
