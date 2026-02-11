"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email.trim() || !password || !confirmPassword) {
      setMessage({ type: "error", text: "Completa todos los campos." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (!API_URL) {
      setMessage({ type: "error", text: "API no configurada." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "Error al crear la cuenta." });
        setLoading(false);
        return;
      }
      if (data.token) {
        typeof window !== "undefined" && localStorage.setItem("aplat_token", data.token);
      }
      setMessage({ type: "success", text: "Cuenta creada. Redirigiendo al panel..." });
      setTimeout(() => router.replace("/dashboard"), 1000);
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aplat-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-aplat-violet/10 rounded-full blur-[120px]" />
      </div>
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass glass-strong rounded-2xl p-8 mirror-shine border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-aplat-text mb-1">Crear cuenta</h1>
            <p className="text-aplat-muted text-sm">Regístrate para acceder a tu panel de cliente.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-aplat-emerald/10 text-aplat-emerald border border-aplat-emerald/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {message.text}
              </div>
            )}
            <label className="block">
              <span className="text-aplat-muted text-sm mb-1 block">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-aplat-muted text-sm mb-1 block">Contraseña (mín. 8 caracteres)</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-aplat-muted text-sm mb-1 block">Confirmar contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-3 font-medium transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-aplat-muted text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-aplat-cyan hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
