"use client";

/**
 * Fondo futurista para el Hero: mesh animado + grid + orbes.
 * Opcional: añade public/videos/hero-bg.mp4 y un <video> aquí para fondo en video.
 */

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-aplat-deep" />

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

      {/* Orbes de luz animados (Framer en el Hero los puede añadir por encima) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-aplat-cyan/12 rounded-full blur-[180px] animate-neon-pulse" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-aplat-violet/10 rounded-full blur-[140px]" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-aplat-cyan/8 rounded-full blur-[120px]" />
    </div>
  );
}
