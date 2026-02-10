"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3, BookOpen, Cpu } from "lucide-react";

const PILLARS = [
  {
    icon: Brain,
    title: "Inteligencia",
    text: "Procesamos datos y contexto para decisiones precisas en tiempo real.",
  },
  {
    icon: BarChart3,
    title: "Análisis",
    text: "Extraemos patrones, métricas y tendencias de tus operaciones.",
  },
  {
    icon: BookOpen,
    title: "Contexto",
    text: "Cada dato se entiende dentro de tu ecosistema y reglas de negocio.",
  },
  {
    icon: Cpu,
    title: "Aprendizaje",
    text: "El sistema mejora con cada interacción y feedback.",
  },
];

export function Intelligence() {
  return (
    <section
      id="inteligencia"
      className="relative py-24 overflow-hidden"
      aria-labelledby="intelligence-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aplat-cyan/5 rounded-full blur-[180px]" />
      </div>

      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="intelligence-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Inteligencia integrada
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Cuatro pilares que hacen que cada solución sea adaptable y escalable.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-aplat-cyan/20 transition-all"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{
                y: -4,
                boxShadow: "0 20px 40px -20px rgba(34, 211, 238, 0.2)",
              }}
            >
              <pillar.icon className="w-10 h-10 text-aplat-cyan mb-4" />
              <h3 className="text-lg font-semibold text-aplat-text mb-2">
                {pillar.title}
              </h3>
              <p className="text-aplat-muted text-sm leading-relaxed">
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
