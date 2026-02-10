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
      className="relative py-24 overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-aplat-cyan/8 blur-[120px] animate-neon-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-aplat-violet/6 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-violet/20 bg-aplat-violet/5 px-4 py-1.5 text-xs font-medium text-aplat-violet uppercase tracking-wider">
            Cómo funciona
          </span>
        </motion.div>
        <motion.h2
          id="how-it-works-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Proceso inteligente
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Cuatro pilares conectados: desde el dato hasta la acción.
        </motion.p>

        {/* Flujo: líneas que se dibujan + nodos */}
        <motion.div
          className="flex justify-center mb-16"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-aplat-cyan/30 h-full">
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
