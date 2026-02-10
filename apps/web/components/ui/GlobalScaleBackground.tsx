"use client";

/**
 * Fondo dedicado para "A nivel global":
 * - Globo / órbitas (arcos animados)
 * - Nodos multi-región conectados
 * - Flujo de datos entre regiones
 * - Partículas y ambiente animado
 */

const REGIONS = [
  { x: 15, y: 42, label: "AM" },
  { x: 38, y: 28, label: "EU" },
  { x: 62, y: 28, label: "APAC" },
  { x: 85, y: 42, label: "LATAM" },
  { x: 50, y: 58, label: "CORE" },
];

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
  [0, 4], [1, 4], [2, 4], [3, 4],
  [0, 2], [1, 3],
];

export function GlobalScaleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="absolute inset-0 bg-aplat-surface/55" />

      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="global-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.6)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.4)" />
          </linearGradient>
          <linearGradient id="global-globe" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.06)" />
          </linearGradient>
          <radialGradient id="global-glow">
            <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Globo: elipse principal (órbita) */}
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="28"
          fill="none"
          stroke="rgba(34,211,238,0.12)"
          strokeWidth="0.35"
          strokeDasharray="4 6"
          style={{ animation: "global-globe-drift 14s ease-in-out infinite" }}
        />
        {/* Segunda órbita */}
        <ellipse
          cx="50"
          cy="50"
          rx="35"
          ry="22"
          fill="none"
          stroke="rgba(167,139,250,0.1)"
          strokeWidth="0.25"
          strokeDasharray="3 8"
          style={{ animation: "global-globe-drift 18s ease-in-out infinite 1s" }}
        />
        {/* Arcos tipo latitud (curvas horizontales) */}
        <path
          d="M 12 50 Q 50 38 88 50"
          fill="none"
          stroke="rgba(34,211,238,0.08)"
          strokeWidth="0.2"
          strokeDasharray="2 5"
          style={{ animation: "cyber-flow 20s linear infinite" }}
        />
        <path
          d="M 18 62 Q 50 72 82 62"
          fill="none"
          stroke="rgba(34,211,238,0.06)"
          strokeWidth="0.2"
          strokeDasharray="2 6"
          style={{ animation: "cyber-flow 22s linear infinite 2s" }}
        />

        {/* Conexiones entre regiones (base) */}
        <g stroke="rgba(34,211,238,0.1)" strokeWidth="0.2" fill="none">
          {CONNECTIONS.map(([a, b], i) => (
            <line
              key={`b-${i}`}
              x1={REGIONS[a].x}
              y1={REGIONS[a].y}
              x2={REGIONS[b].x}
              y2={REGIONS[b].y}
            />
          ))}
        </g>

        {/* Flujo de datos entre regiones */}
        <g stroke="url(#global-line)" strokeWidth="0.3" fill="none" strokeLinecap="round" strokeDasharray="1.5 4">
          {CONNECTIONS.map(([a, b], i) => (
            <line
              key={`f-${i}`}
              x1={REGIONS[a].x}
              y1={REGIONS[a].y}
              x2={REGIONS[b].x}
              y2={REGIONS[b].y}
              style={{
                animation: "cyber-flow 8s linear infinite",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </g>

        {/* Nodos región con pulso */}
        {REGIONS.map((r, i) => (
          <g key={r.label} style={{ animation: "global-region-pulse 3.5s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}>
            <circle
              cx={r.x}
              cy={r.y}
              r="2.8"
              fill="rgba(8,8,18,0.9)"
              stroke="rgba(34,211,238,0.5)"
              strokeWidth="0.35"
            />
            <circle cx={r.x} cy={r.y} r="0.9" fill="rgba(34,211,238,0.9)" />
          </g>
        ))}

        {/* Glow central (CORE) */}
        <circle cx="50" cy="58" r="8" fill="url(#global-glow)" className="opacity-80" style={{ animation: "howitworks-core-pulse 5s ease-in-out infinite" }} />
      </svg>

      {/* Partículas flotantes (datos globales) */}
      {[
        { left: "22%", top: "35%", d: 0 },
        { left: "48%", top: "22%", d: 0.4 },
        { left: "78%", top: "38%", d: 0.2 },
        { left: "18%", top: "58%", d: 0.6 },
        { left: "82%", top: "55%", d: 0.3 },
        { left: "52%", top: "68%", d: 0.5 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-aplat-cyan/60"
          style={{
            left: p.left,
            top: p.top,
            animation: "services-float 8s ease-in-out infinite",
            animationDelay: `${p.d}s`,
            boxShadow: "0 0 10px rgba(34,211,238,0.5)",
          }}
        />
      ))}

      {/* Líneas horizonte (tiempo real / datos) */}
      <div className="absolute left-0 right-0 h-px opacity-20" style={{ top: "48%" }}>
        <svg viewBox="0 0 1200 2" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(34,211,238,0.5)" strokeWidth="1" strokeDasharray="24 40" style={{ animation: "cyber-flow 10s linear infinite" }} />
        </svg>
      </div>
      <div className="absolute left-0 right-0 h-px opacity-15" style={{ top: "52%" }}>
        <svg viewBox="0 0 1200 2" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(167,139,250,0.4)" strokeWidth="1" strokeDasharray="18 35" style={{ animation: "cyber-flow 12s linear infinite 0.8s" }} />
        </svg>
      </div>

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px), linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)",
          backgroundSize: "clamp(20px, 3vw, 40px) clamp(20px, 3vw, 40px)",
        }}
      />

      {/* Orbes de ambiente */}
      <div className="absolute top-1/4 right-1/4 w-[35vmax] h-[35vmax] max-w-[480px] max-h-[480px] rounded-full bg-aplat-cyan/7 blur-[18vmin] animate-neon-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-[30vmax] h-[30vmax] max-w-[400px] max-h-[400px] rounded-full bg-aplat-violet/6 blur-[16vmin]" />
    </div>
  );
}
