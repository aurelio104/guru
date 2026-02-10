"use client";

import { motion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      aria-label="Presentación APlat"
    >
      {/* Fondos: gradientes y orbes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-aplat-cyan/10 rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-aplat-violet/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-aplat-emerald/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid sutil */}
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
        aria-hidden
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-aplat-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-4 h-4 text-aplat-cyan" />
          <span>Servicios digitales de última generación</span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="text-aplat-text">APlat.</span>
          <br />
          <span className="text-gradient-cyan">
            <TypingAnimation
              phrases={[
                "Inteligencia.",
                "Análisis.",
                "Contexto.",
                "Aprendizaje.",
              ]}
              className="text-gradient-cyan"
            />
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-aplat-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Plataforma inteligente que combina análisis, contexto y aprendizaje
          continuo para entregar soluciones que escalan.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-6 py-3 text-aplat-text font-medium transition-all hover:border-aplat-cyan/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          >
            Ver servicios
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-aplat-muted hover:text-aplat-text font-medium transition-all"
          >
            Cómo funciona
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-1 h-2 rounded-full bg-aplat-cyan/80" />
        </motion.div>
      </motion.div>
    </section>
  );
}
