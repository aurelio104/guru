"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    id: "1",
    title: "Inteligencia",
    desc: "Procesamos datos y contexto para decisiones precisas.",
    icon: "◇",
  },
  {
    id: "2",
    title: "Análisis",
    desc: "Extraemos patrones y métricas en tiempo real.",
    icon: "◈",
  },
  {
    id: "3",
    title: "Contexto",
    desc: "Cada dato se entiende dentro de tu ecosistema.",
    icon: "⬡",
  },
  {
    id: "4",
    title: "Aprendizaje",
    desc: "El sistema mejora con cada interacción.",
    icon: "⬢",
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
      {/* Fondo con gradiente sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-aplat-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-aplat-violet/5 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="how-it-works-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Cómo funciona
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Cuatro pilares que se conectan para entregar resultados de última generación.
        </motion.p>

        {/* Animación de estructura (líneas que se dibujan) */}
        <motion.div
          className="flex justify-center mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <svg
            viewBox="0 0 500 320"
            className="w-full max-w-md h-auto text-aplat-cyan/60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {STRUCTURE_LINES.map((line, i) => (
              <motion.path
                key={i}
                d={line.path}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.2,
                  delay: line.delay + 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
            {STEPS.map((step, i) => {
              const x = 60 + i * 120;
              const y = i % 2 === 0 ? 40 : 160;
              return (
                <motion.g key={step.id}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill="rgba(10,10,18,0.9)"
                    stroke="currentColor"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.5 + i * 0.2,
                    }}
                  />
                  <motion.text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    className="fill-current text-sm font-mono"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.2 }}
                  >
                    {step.icon}
                  </motion.text>
                </motion.g>
              );
            })}
          </svg>
        </motion.div>

        {/* Grid de pasos con glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(34, 211, 238, 0.3)",
                boxShadow: "0 0 40px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div className="text-3xl mb-3 text-aplat-cyan">{step.icon}</div>
              <h3 className="text-xl font-semibold text-aplat-text mb-2">
                {step.title}
              </h3>
              <p className="text-aplat-muted text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
