"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { Cpu, BarChart3, Layers, Sparkles } from "lucide-react";

const STEPS = [
  {
    id: "1",
    num: "01",
    title: "Inteligencia",
    desc: "Procesamos datos y contexto para decisiones precisas.",
    Icon: Cpu,
  },
  {
    id: "2",
    num: "02",
    title: "Análisis",
    desc: "Extraemos patrones y métricas en tiempo real.",
    Icon: BarChart3,
  },
  {
    id: "3",
    num: "03",
    title: "Contexto",
    desc: "Cada dato se entiende dentro de tu ecosistema.",
    Icon: Layers,
  },
  {
    id: "4",
    num: "04",
    title: "Aprendizaje",
    desc: "El sistema mejora con cada interacción.",
    Icon: Sparkles,
  },
];

const STRUCTURE_LINES = [
  { path: "M 0 40 L 120 40 L 120 100", delay: 0 },
  { path: "M 120 100 L 120 160 L 240 160", delay: 0.2 },
  { path: "M 240 160 L 240 220 L 360 220", delay: 0.4 },
  { path: "M 360 220 L 360 280 L 480 280", delay: 0.6 },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden min-h-0"
      aria-labelledby="how-it-works-heading"
    >
      {/* Fondo: mismo esquema (responsive, z-0) */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-aplat-surface/40" />
        <div className="absolute top-1/4 left-1/4 w-[40vmax] h-[40vmax] max-w-[550px] max-h-[550px] rounded-full bg-aplat-cyan/8 blur-[18vmin] animate-neon-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[35vmax] h-[35vmax] max-w-[450px] max-h-[450px] rounded-full bg-aplat-violet/6 blur-[16vmin]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px), linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)",
            backgroundSize: "clamp(24px, 4vw, 48px) clamp(24px, 4vw, 48px)",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl w-full">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-violet/25 bg-aplat-violet/5 px-4 py-1.5 text-xs font-semibold text-aplat-violet uppercase tracking-widest">
            Cómo funciona
          </span>
        </motion.div>
        <motion.h2
          id="how-it-works-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 sm:mb-5 text-gradient-cyan max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Proceso inteligente
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Cuatro pilares conectados: desde el dato hasta la acción.
        </motion.p>

        {/* Flujo: líneas que se dibujan + nodos */}
        <motion.div
          className="flex justify-center mb-10 sm:mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <svg
            viewBox="0 0 500 320"
            className="w-full max-w-md h-auto"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <defs>
              <linearGradient id="line-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
                <stop offset="100%" stopColor="rgba(167,139,250,0.3)" />
              </linearGradient>
            </defs>
            {STRUCTURE_LINES.map((line, i) => (
              <g key={i}>
                <motion.path
                  d={line.path}
                  stroke="rgba(255,255,255,0.06)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: line.delay + 0.3, ease: "easeInOut" }}
                />
                <motion.path
                  d={line.path}
                  stroke="url(#line-glow)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: line.delay + 0.3, ease: "easeInOut" }}
                />
              </g>
            ))}
            {STEPS.map((step, i) => {
              const x = 60 + i * 120;
              const y = i % 2 === 0 ? 40 : 160;
              return (
                <motion.g key={step.id}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="22"
                    fill="rgba(10,10,18,0.95)"
                    stroke="rgba(34,211,238,0.4)"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 + i * 0.2 }}
                  />
                  <motion.text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    className="fill-aplat-cyan text-xs font-mono font-semibold"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.2 }}
                  >
                    {step.num}
                  </motion.text>
                </motion.g>
              );
            })}
          </svg>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mirror-shine border border-white/10 hover:border-aplat-cyan/30 h-full min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-aplat-cyan/10 border border-aplat-cyan/20 text-aplat-cyan">
                    <step.Icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-mono text-aplat-muted">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold text-aplat-text mb-2">
                  {step.title}
                </h3>
                <p className="text-aplat-muted text-sm leading-relaxed">
                  {step.desc}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
