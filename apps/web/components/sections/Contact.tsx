"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Check, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

type Status = "idle" | "sending" | "success" | "error";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setErrorText("");
    setStatus("sending");

    if (!API_URL) {
      setStatus("error");
      setErrorText("API no configurada. Añade NEXT_PUBLIC_APLAT_API_URL.");
      return;
    }

    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorText(data?.error ?? "Error al enviar. Intenta de nuevo.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorText("Error de conexión. Revisa tu red e intenta de nuevo.");
    }
  }

  return (
    <section
      id="contacto"
      className="relative py-24 overflow-hidden"
      aria-labelledby="contact-heading"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-aplat-violet/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative container mx-auto px-6 max-w-2xl">
        <motion.h2
          id="contact-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Contacto
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Cuéntanos tu proyecto y te respondemos con una propuesta a medida.
        </motion.p>

        <motion.form
          className="glass glass-strong rounded-2xl p-8 mirror-shine border border-white/10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
        >
          {(status === "success" || status === "error") && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-aplat-emerald/10 text-aplat-emerald border border-aplat-emerald/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {status === "success" ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  Mensaje enviado. Te responderemos pronto.
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorText}
                </>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-aplat-muted text-sm mb-1 block">Nombre</span>
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={status === "sending"}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 transition-colors disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-aplat-muted text-sm mb-1 block">Email</span>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "sending"}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 transition-colors disabled:opacity-60"
              />
            </label>
          </div>
          <label className="block mb-4">
            <span className="text-aplat-muted text-sm mb-1 block">Mensaje</span>
            <textarea
              placeholder="Describe tu proyecto o necesidad..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={status === "sending"}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 transition-colors resize-none disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-6 py-3 font-medium transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] disabled:opacity-60 disabled:pointer-events-none"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar mensaje
              </>
            )}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
