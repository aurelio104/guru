"use client";

/**
 * Fondo exclusivo para la sección Ciberseguridad:
 * - Escudo de protección central con efecto glass
 * - Animación de encendido y pulso que bloquea intrusiones
 * - Partículas de "intrusión" que impactan contra el escudo
 * - Grid hexagonal, circuito y vidrios
 */

/* Direcciones desde el centro en unidades de viewport (responsive) */
const INTRUSION_PARTICLES = [
  { delay: 0, tx: "28vw", ty: "-10vh" },
  { delay: 0.8, tx: "22vw", ty: "22vh" },
  { delay: 1.6, tx: "-26vw", ty: "8vh" },
  { delay: 2.4, tx: "-20vw", ty: "-20vh" },
  { delay: 0.4, tx: "26vw", ty: "12vh" },
  { delay: 1.2, tx: "-24vw", ty: "20vh" },
  { delay: 2, tx: "18vw", ty: "-22vh" },
  { delay: 2.8, tx: "-28vw", ty: "-6vh" },
  { delay: 0.6, tx: "20vw", ty: "-16vh" },
  { delay: 1.4, tx: "-18vw", ty: "24vh" },
];

/* Misma figura que el escudo pequeño del centro, escalada al viewBox 100x100 */
const SHIELD_PATH = "M50 2 L82 18 L82 58 Q82 82 50 98 Q18 82 18 58 L18 18 Z";

export function CybersecurityBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base más oscura para marcar la sección */}
      <div className="absolute inset-0 bg-aplat-surface/80" />

      {/* Escudo en el fondo: 100% responsive, líneas desde centro, logo seguridad */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[min(150vmin,95vw)] h-auto max-h-[min(120vmin,90vh)] opacity-[0.2]"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: "100%", aspectRatio: "1" }}
        >
          <defs>
            <linearGradient id="shield-glass-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
              <stop offset="50%" stopColor="rgba(167,139,250,0.08)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.12)" />
            </linearGradient>
            <linearGradient id="shield-shine-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="shield-border-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path d={SHIELD_PATH} fill="url(#shield-glass-bg)" />
          <path d={SHIELD_PATH} fill="url(#shield-shine-bg)" />
          {/* Líneas desde el centro (rayos del escudo) */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const r = 42;
            const x = 50 + r * Math.cos(rad);
            const y = 50 - r * Math.sin(rad);
            return (
              <line
                key={deg}
                x1="50"
                y1="50"
                x2={String(x)}
                y2={String(y)}
                stroke="rgba(34,211,238,0.15)"
                strokeWidth="0.35"
                strokeLinecap="round"
              />
            );
          })}
          {/* Logo seguridad en el centro: escudo pequeño */}
          <path
            d="M50 38 L58 42 L58 52 Q58 58 50 62 Q42 58 42 52 L42 42 Z"
            fill="none"
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <path
            d="M50 46 L50 54 M47 50 L53 50"
            fill="none"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
          <path
            d={SHIELD_PATH}
            fill="none"
            stroke="url(#shield-border-bg)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="340"
            strokeDashoffset="340"
            style={{
              animation: "shield-draw 2.5s ease-out forwards, shield-border-pulse 2.5s ease-in-out 2.5s infinite",
            }}
          />
          <path
            d={SHIELD_PATH}
            fill="none"
            stroke="rgba(34,211,238,0.3)"
            strokeWidth="0.4"
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

      {/* Radar tipo PPI: anillos de distancia + haz que barre */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 100 100"
          className="w-[min(85vmin,75vw)] h-[min(85vmin,75vw)] max-w-full opacity-[0.18]"
          style={{ aspectRatio: "1" }}
        >
          <defs>
            <radialGradient id="radar-beam" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(34,211,238,0)" />
              <stop offset="75%" stopColor="rgba(34,211,238,0)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.45)" />
            </radialGradient>
          </defs>
          {/* Anillos de distancia (concentric circles) */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.35" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.35" />
          <circle cx="50" cy="50" r="11" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="0.3" />
          {/* Cruz de ejes (N/S/E/W) */}
          <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(34,211,238,0.08)" strokeWidth="0.25" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(34,211,238,0.08)" strokeWidth="0.25" />
          {/* Haz que barre (sector fino, centro en 50,50) */}
          <g transform="translate(50, 50)">
            <g style={{ transformOrigin: "0 0", animation: "cyber-sweep 8s linear infinite" }}>
              <path
                d="M0 0 L0 -42 L3.7 -41.8 L0 0 Z"
                fill="url(#radar-beam)"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Orbe sutil: responsive con vmax */}
      <div className="absolute bottom-0 right-0 w-[50vmax] h-[50vmax] max-w-[600px] max-h-[600px] bg-aplat-violet/10 rounded-full blur-[20vmin]" />

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
