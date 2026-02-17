"use client";

/**
 * Fondo dedicado para Portafolio – identidad "obras / entregas":
 * - Ventanas/cards fantasma flotantes (proyectos)
 * - Acento violeta (distinto a cyan neuronal y emerald global)
 * - Sin redes neuronales ni globo; sensación de "galería de proyectos"
 */

const WINDOWS = [
  { x: "8%", y: "15%", w: 22, h: 14 },
  { x: "72%", y: "12%", w: 20, h: 12 },
  { x: "15%", y: "68%", w: 18, h: 11 },
  { x: "68%", y: "72%", w: 24, h: 14 },
  { x: "42%", y: "38%", w: 16, h: 10 },
  { x: "78%", y: "45%", w: 14, h: 9 },
  { x: "12%", y: "42%", w: 15, h: 10 },
];

export function PortfolioBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="absolute inset-0 bg-guru-surface/50" />

      {/* Ventanas/cards fantasma (proyectos) */}
      {WINDOWS.map((win, i) => (
        <div
          key={i}
          className="absolute rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
          style={{
            left: win.x,
            top: win.y,
            width: `${win.w}%`,
            aspectRatio: "16/10",
            maxWidth: 280,
            maxHeight: 180,
            animation: "portfolio-window-float 10s ease-in-out infinite",
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Líneas sutiles tipo "conexión entre proyectos" (violeta) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="port-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(167,139,250,0)" />
            <stop offset="50%" stopColor="rgba(167,139,250,0.25)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
          </linearGradient>
        </defs>
        <path d="M 60 80 L 180 80 L 180 140" fill="none" stroke="url(#port-line)" strokeWidth="0.6" strokeDasharray="4 8" style={{ animation: "cyber-flow 14s linear infinite" }} />
        <path d="M 320 70 L 200 70 L 200 160" fill="none" stroke="url(#port-line)" strokeWidth="0.5" strokeDasharray="3 10" style={{ animation: "cyber-flow 12s linear infinite 1s" }} />
        <path d="M 100 220 L 100 160 L 200 160" fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="0.4" strokeDasharray="2 6" style={{ animation: "cyber-flow 16s linear infinite 0.5s" }} />
      </svg>

      {/* Brillo sutil central (violeta) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmax] h-[60vmax] max-w-[900px] max-h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(167,139,250,0.06) 0%, transparent 65%)",
          animation: "portfolio-shine 8s ease-in-out infinite",
        }}
      />

      {/* Grid muy sutil (violeta) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,0.04)_1px,transparent_1px), linear-gradient(90deg,rgba(167,139,250,0.04)_1px,transparent_1px)",
          backgroundSize: "clamp(28px, 4vw, 44px) clamp(28px, 4vw, 44px)",
        }}
      />

      {/* Orbes violeta (no cyan) */}
      <div className="absolute top-0 right-0 w-[45vmax] h-[45vmax] max-w-[550px] max-h-[550px] rounded-full bg-guru-violet/7 blur-[20vmin]" />
      <div className="absolute bottom-0 left-0 w-[38vmax] h-[38vmax] max-w-[480px] max-h-[480px] rounded-full bg-guru-violet/5 blur-[18vmin]" />
    </div>
  );
}
