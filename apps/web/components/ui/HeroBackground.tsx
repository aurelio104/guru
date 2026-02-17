"use client";

import { NeuralNetworkBackground } from "@/components/ui/NeuralNetworkBackground";
import { GlassScreensBackground } from "@/components/ui/GlassScreensBackground";
import { FuturistBackground } from "@/components/ui/FuturistBackground";

/**
 * Fondo futurista para el Hero: imagen sutil opcional + textura + mesh + red neuronal + pantallas.
 * Opcional: añade public/backgrounds/hero-bg.jpg para imagen de fondo.
 */

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-guru-deep" />

      {/* Imagen de fondo sutil + textura futurista (última generación) */}
      <FuturistBackground
        imageSrc="/backgrounds/hero-bg.jpg"
        imageOpacity={0.05}
        variant="hero"
      />

      {/* Mesh animado (gradientes que se mueven) */}
      <div className="absolute inset-0 bg-mesh animate-mesh" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 30% 20%, rgba(34, 211, 238, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse 80% 100% at 70% 60%, rgba(167, 139, 250, 0.14) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 50% 90%, rgba(34, 211, 238, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid con perspectiva y pulso sutil */}
      <div
        className="absolute inset-0 bg-grid-perspective animate-grid-pulse"
        style={{ transform: "perspective(500px) rotateX(60deg) scale(1.5)", transformOrigin: "50% 0%" }}
      />

      {/* Red neuronal: nodos y conexiones con “datos” fluyendo (inteligencia artificial) */}
      <NeuralNetworkBackground />

      {/* Pantallas transparentes mostrando proceso / métricas */}
      <GlassScreensBackground />

      {/* Orbes de luz */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-guru-cyan/12 rounded-full blur-[180px] animate-neon-pulse" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-guru-violet/10 rounded-full blur-[140px]" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-guru-cyan/8 rounded-full blur-[120px]" />
    </div>
  );
}
