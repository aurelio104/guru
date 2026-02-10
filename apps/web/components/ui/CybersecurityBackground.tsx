"use client";

/**
 * Fondo exclusivo para la sección Ciberseguridad:
 * - Escudo de protección central con efecto glass
 * - Animación de encendido y pulso que bloquea intrusiones
 * - Partículas de "intrusión" que impactan contra el escudo
 * - Grid hexagonal, circuito y vidrios
 */

/* Direcciones en px desde el centro (donde está el escudo) */
const INTRUSION_PARTICLES = [
  { delay: 0, tx: "280px", ty: "-80px" },
  { delay: 0.8, tx: "220px", ty: "200px" },
  { delay: 1.6, tx: "-260px", ty: "60px" },
  { delay: 2.4, tx: "-200px", ty: "-180px" },
  { delay: 0.4, tx: "260px", ty: "100px" },
  { delay: 1.2, tx: "-240px", ty: "180px" },
  { delay: 2, tx: "180px", ty: "-200px" },
  { delay: 2.8, tx: "-280px", ty: "-50px" },
  { delay: 0.6, tx: "200px", ty: "-140px" },
  { delay: 1.4, tx: "-180px", ty: "220px" },
];

const SHIELD_PATH = "M50 8 C78 8 92 22 92 42 C92 58 78 75 50 92 C22 75 8 58 8 42 C8 22 22 8 50 8 Z";

export function CybersecurityBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base más oscura para marcar la sección */}
      <div className="absolute inset-0 bg-aplat-surface/80" />

      {/* Grid hexagonal bien visible */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.18] text-aplat-cyan"
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
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid-cyber)" />
      </svg>

      {/* Escudo de fondo (tamaño contenido) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[min(77vw,476px)] h-auto max-h-[min(60vh,476px)] opacity-40"
        >
          <defs>
            <linearGradient id="shield-glass-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
              <stop offset="50%" stopColor="rgba(167,139,250,0.12)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
            </linearGradient>
            <linearGradient id="shield-shine-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="shield-border-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path d={SHIELD_PATH} fill="url(#shield-glass-bg)" />
          <path d={SHIELD_PATH} fill="url(#shield-shine-bg)" />
          <path
            d={SHIELD_PATH}
            fill="none"
            stroke="url(#shield-border-bg)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="320"
            strokeDashoffset="320"
            style={{
              animation: "shield-draw 2.5s ease-out forwards, shield-border-pulse 2.5s ease-in-out 2.5s infinite",
            }}
          />
          <path
            d={SHIELD_PATH}
            fill="none"
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="0.5"
            style={{ animation: "shield-glow-inner 3s ease-in-out infinite" }}
          />
        </svg>
      </div>

      {/* Partículas de "intrusión" que se acercan y son bloqueadas por el escudo */}
      <div className="absolute inset-0 flex items-center justify-center">
        {INTRUSION_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-red-400/80"
            style={{
              ["--tx" as string]: p.tx,
              ["--ty" as string]: p.ty,
              animation: `intrusion-approach 4s ease-in ${p.delay}s infinite`,
              boxShadow: "0 0 12px rgba(248,113,113,0.6)",
            }}
          />
        ))}
      </div>

      {/* Segunda oleada (más pequeñas, tono ámbar) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {INTRUSION_PARTICLES.slice(0, 6).map((p, i) => (
          <div
            key={`v2-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/70"
            style={{
              ["--tx" as string]: p.tx,
              ["--ty" as string]: p.ty,
              animation: `intrusion-approach 5s ease-in ${p.delay + 0.5}s infinite`,
              boxShadow: "0 0 8px rgba(251,191,36,0.5)",
            }}
          />
        ))}
      </div>

      {/* Circuit lines con flujo */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 800 600"
      >
        <defs>
          <linearGradient id="cyber-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
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
          stroke="url(#cyber-line-grad)"
          strokeWidth="0.8"
          strokeDasharray="8 24"
          strokeLinecap="round"
          style={{ animation: "cyber-flow 7s linear infinite 1s" }}
        />
      </svg>

      {/* Radar sweep visible */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[min(100vw,1100px)] h-[min(75vh,600px)] opacity-[0.12]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(34,211,238,0.35) 50deg, transparent 100deg)",
            animation: "cyber-sweep 14s linear infinite",
          }}
        />
      </div>

      {/* Orbes de ambiente */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-aplat-cyan/12 rounded-full blur-[180px] animate-neon-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-aplat-violet/10 rounded-full blur-[150px]" />

      {/* Scanline tipo monitor seguro */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.06) 2px, rgba(34,211,238,0.06) 4px)",
        }}
      />
    </div>
  );
}
