"use client";

import { motion } from "framer-motion";
import { MessageCircle, ExternalLink, Send } from "lucide-react";

export function DashboardWidgetWhatsApp() {
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
        Estado de integración y envíos. Conecta con Omac u otros proyectos para ver métricas en tiempo real.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href="https://omac569.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-aplat-cyan/10 border border-white/10 px-3 py-2 text-sm text-aplat-text transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Omac
        </a>
        <span className="inline-flex items-center gap-2 rounded-xl bg-aplat-muted/10 text-aplat-muted px-3 py-2 text-sm">
          <Send className="w-4 h-4" />
          Recordatorios (próximamente)
        </span>
      </div>
    </motion.div>
  );
}
