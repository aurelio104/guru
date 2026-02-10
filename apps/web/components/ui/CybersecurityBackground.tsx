"use client";

/**
 * Fondo exclusivo para la sección Ciberseguridad:
 * - Grid hexagonal (honeycomb / escudo)
 * - Líneas tipo circuito con flujo animado
 * - Arco tipo radar/sweep
 * - Scanline muy sutil
 */

export function CybersecurityBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base oscura */}
      <div className="absolute inset-0 bg-aplat-surface/60" />

      {/* Grid hexagonal: patrón tipo panal / escudo */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hex-grid-cyber"
            width="56"
            height="48.5"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.2)"
          >
            <path
              d="M28 0L56 14v29L28 48.5L0 43V14L28 0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              className="text-aplat-cyan"
            />
            <path
              d="M0 14l28-14v34.5M56 14L28 0v34.5M28 48.5L0 43V14M28 48.5l28-5.5V14"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.25"
              className="text-aplat-cyan"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid-cyber)" />
      </svg>

      {/* Circuit lines: conexiones tipo PCB con flujo */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 800 600"
      >
        <defs>
          <linearGradient id="cyber-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.4)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <linearGradient id="cyber-line-violet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(167,139,250,0)" />
            <stop offset="50%" stopColor="rgba(167,139,250,0.35)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
          </linearGradient>
        </defs>
        {/* Líneas horizontales y verticales tipo circuito */}
        <path
          d="M0 120 L200 120 L200 280 L400 280 L400 120 L800 120"
          fill="none"
          stroke="url(#cyber-line-grad)"
          strokeWidth="0.8"
          strokeDasharray="8 24"
          strokeLinecap="round"
          style={{ animation: "cyber-flow 6s linear infinite" }}
        />
        <path
          d="M0 380 L320 380 L320 480 L600 480 L600 380 L800 380"
          fill="none"
          stroke="url(#cyber-line-violet)"
          strokeWidth="0.8"
          strokeDasharray="8 24"
          strokeLinecap="round"
          style={{ animation: "cyber-flow 7s linear infinite 1s" }}
        />
        <path
          d="M100 0 L100 200 L500 200 L500 600"
          fill="none"
          stroke="rgba(34,211,238,0.08)"
          strokeWidth="0.6"
          strokeDasharray="4 12"
          style={{ animation: "cyber-flow 8s linear infinite 0.5s" }}
        />
      </svg>

      {/* Arco tipo radar / sweep central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[min(100vw,1200px)] h-[min(80vh,700px)] opacity-[0.06]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(34,211,238,0.15) 60deg, transparent 120deg)",
            animation: "cyber-sweep 12s linear infinite",
          }}
        />
      </div>

      {/* Orbes de ambiente */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-aplat-cyan/6 rounded-full blur-[180px] animate-neon-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-aplat-violet/5 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-aplat-cyan/4 rounded-full blur-[120px]" />

      {/* Scanline muy sutil */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />
    </div>
  );
}
