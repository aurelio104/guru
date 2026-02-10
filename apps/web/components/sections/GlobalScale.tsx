"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { GlobalScaleBackground } from "@/components/ui/GlobalScaleBackground";
import { Globe, ShieldCheck, Zap } from "lucide-react";

const FEATURES = [
  {
    Icon: Globe,
    title: "Escala global",
    desc: "Despliegue multi-región, baja latencia y resiliencia para usuarios en cualquier lugar.",
  },
  {
    Icon: ShieldCheck,
    title: "Seguridad de primer nivel",
    desc: "Arquitectura segura por diseño, buenas prácticas y auditoría cuando lo necesites.",
  },
  {
    Icon: Zap,
    title: "Tiempo real",
    desc: "Datos vivos, APIs rápidas y decisiones respaldadas por contexto actualizado.",
  },
];

const PILLS = ["TypeScript", "Node 24", "React", "Vercel", "APIs REST", "Multi-región"];

export function GlobalScale() {
  return (
    <section
      id="a-nivel-global"
      className="relative py-10 sm:py-12 md:py-16 lg:py-20 overflow-hidden min-h-0"
      aria-labelledby="global-scale-heading"
    >
      <GlobalScaleBackground />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl w-full">
        {/* Bloque único: badge + título + texto unificado + cards + pills */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-emerald/25 bg-aplat-emerald/5 px-3 py-1 text-xs font-semibold text-aplat-emerald uppercase tracking-widest mb-3">
            A nivel global
          </span>
          <h2
            id="global-scale-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gradient-cyan max-w-4xl mx-auto leading-tight mb-2"
          >
            Construido para competir en cualquier escala.
          </h2>
          <p className="text-aplat-muted text-center text-sm sm:text-base max-w-2xl mx-auto mb-1">
            Infraestructura de primer nivel, datos en tiempo real y decisiones que importan.
          </p>
          <p className="text-aplat-muted/80 text-center text-sm max-w-2xl mx-auto mb-8 italic">
            Inteligencia que trasciende fronteras. Cada solución se despliega con los mismos estándares que exigen las operaciones globales: rendimiento, observabilidad y evolución continua.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-5 mirror-shine border border-white/10 hover:border-aplat-emerald/30 h-full min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-aplat-emerald/10 border border-aplat-emerald/20 text-aplat-emerald mb-3">
                  <feature.Icon className="w-4 h-4" />
                </span>
                <h3 className="text-base font-semibold text-aplat-text mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-aplat-muted text-xs leading-relaxed">
                  {feature.desc}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-aplat-muted backdrop-blur-sm"
            >
              {pill}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
