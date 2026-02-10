"use client";

import { motion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden perspective-3d scanlines"
      aria-label="Presentación APlat"
    >
      <HeroBackground />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto preserve-3d">
        <motion.div
          className="inline-flex items-center gap-2 glass glass-strong rounded-full px-4 py-2 mb-8 text-sm text-aplat-muted smooth-transition border-aplat-cyan/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <Sparkles className="w-4 h-4 text-aplat-cyan" />
          <span>Servicios digitales de última generación</span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
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
          transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          Plataforma inteligente que combina análisis, contexto y aprendizaje
          continuo para entregar soluciones que escalan.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.a
            href="#servicios"
            className="inline-flex items-center gap-2 rounded-xl glass-neon px-6 py-3 text-aplat-text font-medium smooth-transition shadow-depth hover:-translate-y-0.5"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Ver servicios
            <ArrowRight className="w-4 h-4" />
          </motion.a>
          <motion.a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-xl glass glass-strong px-6 py-3 text-aplat-muted font-medium smooth-transition hover:text-aplat-text hover:border-white/20"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Cómo funciona
          </motion.a>
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
