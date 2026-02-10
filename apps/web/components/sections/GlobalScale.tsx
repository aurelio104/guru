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
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden min-h-0"
      aria-labelledby="global-scale-heading"
    >
      <GlobalScaleBackground />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl w-full">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-emerald/25 bg-aplat-emerald/5 px-4 py-1.5 text-xs font-semibold text-aplat-emerald uppercase tracking-widest">
            A nivel global
          </span>
        </motion.div>
        <motion.h2
          id="global-scale-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 sm:mb-5 text-gradient-cyan max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Construido para competir en cualquier escala.
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-6 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Infraestructura de primer nivel, datos en tiempo real y decisiones que importan.
        </motion.p>

        <motion.blockquote
          className="text-center text-aplat-muted/90 text-base md:text-lg max-w-3xl mx-auto mb-12 sm:mb-16 italic"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        >
          Inteligencia que trasciende fronteras. Cada solución se despliega con los mismos estándares que exigen las operaciones globales: rendimiento, observabilidad y evolución continua.
        </motion.blockquote>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mirror-shine border border-white/10 hover:border-aplat-emerald/30 h-full min-w-0">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-aplat-emerald/10 border border-aplat-emerald/20 text-aplat-emerald mb-4">
                  <feature.Icon className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-semibold text-aplat-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-aplat-muted text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Pills: stack tecnológico */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {PILLS.map((pill, i) => (
            <span
              key={pill}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-aplat-muted backdrop-blur-sm"
            >
              {pill}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
