"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function ChangePasswordForm() {
  const { user, refetch } = useDashboardUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Completa todos los campos." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "La nueva contraseña y la confirmación no coinciden." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (!API_URL) {
      setMessage({ type: "error", text: "API no configurada." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: "Contraseña actualizada. Redirigiendo..." });
        await refetch();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error al cambiar la contraseña." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="glass glass-strong rounded-2xl p-6 border border-white/10 mirror-shine">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl p-2 bg-guru-cyan/15 text-guru-cyan">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-guru-text">Cambiar contraseña</h1>
            <p className="text-guru-muted text-sm">
              Usa la contraseña temporal que recibiste y elige una contraseña segura para continuar.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-guru-emerald/10 text-guru-emerald border border-guru-emerald/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}
          <label className="block">
            <span className="text-guru-muted text-sm mb-1 block">Contraseña temporal (la que recibiste)</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-guru-text placeholder:text-guru-muted/60 focus:border-guru-cyan/50 focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-guru-muted text-sm mb-1 block">Nueva contraseña (mín. 8 caracteres)</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-guru-text placeholder:text-guru-muted/60 focus:border-guru-cyan/50 focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-guru-muted text-sm mb-1 block">Confirmar nueva contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-guru-text placeholder:text-guru-muted/60 focus:border-guru-cyan/50 focus:outline-none disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-guru-cyan/20 hover:bg-guru-cyan/30 text-guru-cyan border border-guru-cyan/40 px-4 py-3 font-medium transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Cambiar contraseña y continuar
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
