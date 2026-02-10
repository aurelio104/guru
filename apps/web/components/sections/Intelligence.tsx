"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
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
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aplat-cyan/8 rounded-full blur-[180px] animate-neon-pulse" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-aplat-violet/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="intelligence-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Inteligencia integrada
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Cuatro pilares que hacen que cada solución sea adaptable y escalable.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-aplat-cyan/20 h-full">
                <pillar.icon className="w-10 h-10 text-aplat-cyan mb-4" />
                <h3 className="text-lg font-semibold text-aplat-text mb-2">
                  {pillar.title}
                </h3>
                <p className="text-aplat-muted text-sm leading-relaxed">
                  {pillar.text}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
