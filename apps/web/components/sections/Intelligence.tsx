"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { GlobalScaleBackground } from "@/components/ui/GlobalScaleBackground";
import { Globe, Shield, Zap, Activity } from "lucide-react";

const PILLARS = [
  {
    icon: Globe,
    title: "Escala global",
    text: "Despliegue multi-región, baja latencia y resiliencia para usuarios en cualquier lugar.",
    color: "cyan",
  },
  {
    icon: Shield,
    title: "Seguridad de primer nivel",
    text: "Arquitectura segura por diseño, buenas prácticas y auditoría cuando lo necesites.",
    color: "violet",
  },
  {
    icon: Zap,
    title: "Tiempo real",
    text: "Datos vivos, APIs rápidas y decisiones respaldadas por contexto actualizado.",
    color: "emerald",
  },
];

const TECH_STRIP = [
  "TypeScript",
  "Node 24",
  "React",
  "Vercel",
  "APIs REST",
  "Multi-región",
];

const colorMap = {
  cyan: "border-aplat-cyan/25 text-aplat-cyan [--glow:rgba(34,211,238,0.15)]",
  violet: "border-aplat-violet/25 text-aplat-violet [--glow:rgba(167,139,250,0.15)]",
  emerald: "border-aplat-emerald/25 text-aplat-emerald [--glow:rgba(52,211,153,0.15)]",
};

export function Intelligence() {
  return (
    <section
      id="inteligencia"
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden min-h-0"
      aria-labelledby="intelligence-heading"
    >
      <GlobalScaleBackground />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl w-full">
        {/* Badge + título */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-cyan/25 bg-aplat-cyan/5 px-4 py-1.5 text-xs font-medium text-aplat-cyan uppercase tracking-widest">
            A nivel global
          </span>
        </motion.div>
        <motion.h2
          id="intelligence-heading"
          className="text-4xl md:text-6xl font-bold text-center mb-5 text-gradient-cyan max-w-4xl mx-auto leading-tight transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Construido para competir en cualquier escala.
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-20 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Infraestructura de primer nivel, datos en tiempo real y decisiones que importan.
        </motion.p>

        {/* Bento: bloque principal + 3 pilares */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
          {/* Bloque hero: mensaje principal */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card3D className="glass glass-strong rounded-3xl p-8 md:p-10 mirror-shine border border-white/10 h-full min-h-[280px] flex flex-col justify-center relative overflow-hidden group hover:border-aplat-cyan/20 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-aplat-cyan/5 rounded-full blur-[80px] group-hover:bg-aplat-cyan/8 transition-colors duration-500" />
              <Activity className="w-12 h-12 text-aplat-cyan/80 mb-6" />
              <h3 className="text-2xl md:text-3xl font-bold text-aplat-text mb-3 leading-tight">
                Inteligencia que trasciende fronteras.
              </h3>
              <p className="text-aplat-muted text-base leading-relaxed max-w-md">
                Cada solución se despliega con los mismos estándares que exigen las operaciones globales: rendimiento, observabilidad y evolución continua.
              </p>
            </Card3D>
          </motion.div>

          {/* Tres pilares */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card3D
                  className={`glass glass-strong rounded-2xl p-6 mirror-shine border h-full transition-all duration-300 hover:shadow-[0_0_40px_var(--glow)] ${colorMap[pillar.color as keyof typeof colorMap]}`}
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-inherit mb-4">
                    <pillar.icon className="w-5 h-5" />
                  </span>
                  <h4 className="text-lg font-semibold text-aplat-text mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-aplat-muted text-sm leading-relaxed">
                    {pillar.text}
                  </p>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Strip tecnológico */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {TECH_STRIP.map((tech, i) => (
            <span
              key={tech}
              className="px-4 py-2 rounded-full glass border border-white/10 text-aplat-muted text-sm font-medium hover:text-aplat-text hover:border-aplat-cyan/20 transition-colors duration-200"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
