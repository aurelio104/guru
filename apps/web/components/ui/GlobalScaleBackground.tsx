"use client";

/**
 * Fondo "A nivel global" – identidad distinta a Cómo funciona:
 * - Globo terráqueo con latitud/longitud que rota lento
 * - Paleta emerald (no cyan/violet neuronal)
 * - Arcos tipo "rutas" entre regiones (curvos)
 * - Flujo horizontal tipo "datos viajando" (no partículas flotantes)
 * - Sin núcleo pulsante ni nodos que pulsan
 */

const REGIONS = [
  { x: 18, y: 45 },
  { x: 50, y: 28 },
  { x: 82, y: 45 },
  { x: 50, y: 62 },
];

/* Arcos curvos entre regiones (rutas globales) - path en viewBox 0 0 100 100 */
const ROUTES = [
  "M 18 45 Q 35 35 50 28", // región 0 -> 1
  "M 50 28 Q 65 35 82 45", // 1 -> 2
  "M 82 45 Q 70 55 50 62", // 2 -> 3
  "M 50 62 Q 30 55 18 45", // 3 -> 0
  "M 18 45 Q 50 50 82 45", // 0 -> 2
  "M 50 28 Q 50 45 50 62", // 1 -> 3
];

export function GlobalScaleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base con tinte emerald suave (distinto al cyan de Cómo funciona) */}
      <div className="absolute inset-0 bg-aplat-surface/55" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Líneas horizontales tipo "horizonte global" (no grid de puntos) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(52,211,153,0.03) 2px, rgba(52,211,153,0.03) 3px)",
          backgroundSize: "100% 24px",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="global-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(52,211,153,0)" />
            <stop offset="50%" stopColor="rgba(52,211,153,0.5)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0)" />
          </linearGradient>
          <linearGradient id="global-route" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(52,211,153,0.25)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.08)" />
          </linearGradient>
        </defs>

        {/* Globo: grupo que rota (círculo + meridianos + paralelos) */}
        <g transform="translate(50, 50)" style={{ animation: "global-globe-rotate 35s linear infinite", transformOrigin: "0 0" }}>
          <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.4" />
          {/* Paralelos (latitud) */}
          <ellipse cx="0" cy="0" rx="32" ry="10" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="0.25" />
          <ellipse cx="0" cy="0" rx="32" ry="18" fill="none" stroke="rgba(52,211,153,0.07)" strokeWidth="0.2" />
          <ellipse cx="0" cy="0" rx="28" ry="28" fill="none" stroke="rgba(52,211,153,0.05)" strokeWidth="0.2" />
          {/* Meridianos (longitud) - medias elipses */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * 360;
            return (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx="32"
                ry="32"
                fill="none"
                stroke="rgba(52,211,153,0.06)"
                strokeWidth="0.2"
                strokeDasharray="50 150"
                style={{ animation: "global-meridian-pass 6s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
                transform={`rotate(${angle})`}
              />
            );
          })}
        </g>

        {/* Rutas entre regiones (arcos curvos, estilo emerald) */}
        <g fill="none" stroke="url(#global-route)" strokeWidth="0.25">
          {ROUTES.map((d, i) => (
            <path
              key={i}
              d={d}
              strokeDasharray="3 6"
              style={{ animation: "cyber-flow 12s linear infinite", animationDelay: `${i * 1.2}s` }}
            />
          ))}
        </g>

        {/* Puntos de región: glow suave emerald, sin pulso fuerte */}
        {REGIONS.map((r, i) => (
          <g key={i}>
            <circle
              cx={r.x}
              cy={r.y}
              r="4"
              fill="rgba(52,211,153,0.08)"
              style={{ animation: "global-glow-soft 5s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
            />
            <circle cx={r.x} cy={r.y} r="1.2" fill="rgba(52,211,153,0.7)" stroke="rgba(52,211,153,0.3)" strokeWidth="0.3" />
          </g>
        ))}
      </svg>

      {/* Flujo horizontal: "datos viajando" (distinto a partículas flotantes) - emerald */}
      <div className="absolute inset-0 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute h-px w-[40%] rounded-full"
            style={{
              top: `${22 + i * 16}%`,
              left: 0,
              background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)",
              animation: "global-stream 14s linear infinite",
              animationDelay: `${i * 2.5}s`,
            }}
          />
        ))}
      </div>

      {/* Una segunda capa de flujo más sutil */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute h-px w-[30%] rounded-full"
          style={{
            top: `${38 + i * 18}%`,
            right: 0,
            left: "auto",
            background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.25), transparent)",
            animation: "global-stream 18s linear infinite reverse",
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}

      {/* Orbes de ambiente en emerald (no cyan/violet) */}
      <div
        className="absolute top-1/3 right-1/4 w-[40vmax] h-[40vmax] max-w-[500px] max-h-[500px] rounded-full blur-[20vmin]"
        style={{ background: "rgba(52,211,153,0.06)" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-[35vmax] h-[35vmax] max-w-[420px] max-h-[420px] rounded-full blur-[18vmin]"
        style={{ background: "rgba(52,211,153,0.05)" }}
      />
    </div>
  );
}
