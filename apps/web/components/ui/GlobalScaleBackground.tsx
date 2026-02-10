"use client";

/**
 * Fondo dedicado para "A nivel global":
 * - Globo / esfera con paralelos y meridianos
 * - Nodos multi-región conectados (despliegue global)
 * - Líneas de flujo entre regiones
 * - Partículas / señales animadas
 */

/* Posiciones de “regiones” en un viewBox 0 0 100 100 (porcentual) */
const REGIONS = [
  { x: 28, y: 42, label: "1" },
  { x: 72, y: 38, label: "2" },
  { x: 50, y: 65, label: "3" },
  { x: 18, y: 58, label: "4" },
  { x: 82, y: 55, label: "5" },
  { x: 50, y: 28, label: "6" },
];

const EDGES = [
  [0, 1], [1, 2], [2, 0], [2, 3], [2, 4], [3, 4], [0, 5], [1, 5], [3, 5], [4, 5],
];

export function GlobalScaleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="absolute inset-0 bg-aplat-surface/50" />

      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="global-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.4)" />
          </linearGradient>
          <radialGradient id="global-sphere">
            <stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
            <stop offset="60%" stopColor="rgba(34,211,238,0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="global-node" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.6)" />
          </linearGradient>
        </defs>

        {/* Globo: círculo base con “paralelos” y “meridianos” */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(34,211,238,0.06)"
          strokeWidth="0.25"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="14"
          fill="none"
          stroke="rgba(34,211,238,0.07)"
          strokeWidth="0.2"
          strokeDasharray="2 3"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="14"
          ry="38"
          fill="none"
          stroke="rgba(34,211,238,0.06)"
          strokeWidth="0.2"
          strokeDasharray="2 3"
        />
        <circle cx="50" cy="50" r="38" fill="url(#global-sphere)" />

        {/* Órbita animada (flujo de datos global) */}
        <g transform="translate(50, 50)" style={{ transformOrigin: "0 0", animation: "howitworks-ring-rotate 30s linear infinite" }}>
          <ellipse
            cx={0}
            cy={0}
            rx="42"
            ry="16"
            fill="none"
            stroke="rgba(34,211,238,0.2)"
            strokeWidth="0.3"
            strokeDasharray="2 5"
          />
        </g>

        {/* Conexiones entre regiones (base) */}
        <g stroke="rgba(34,211,238,0.1)" strokeWidth="0.2" fill="none">
          {EDGES.map(([a, b], i) => (
            <line
              key={`lb-${i}`}
              x1={REGIONS[a].x}
              y1={REGIONS[a].y}
              x2={REGIONS[b].x}
              y2={REGIONS[b].y}
            />
          ))}
        </g>

        {/* Flujo animado en conexiones */}
        <g stroke="url(#global-line)" strokeWidth="0.35" fill="none" strokeLinecap="round" strokeDasharray="1.5 4">
          {EDGES.map(([a, b], i) => (
            <line
              key={`lf-${i}`}
              x1={REGIONS[a].x}
              y1={REGIONS[a].y}
              x2={REGIONS[b].x}
              y2={REGIONS[b].y}
              style={{
                animation: "cyber-flow 8s linear infinite",
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </g>

        {/* Nodos multi-región */}
        {REGIONS.map((r, i) => (
          <g key={r.label} style={{ animation: "global-node-pulse 3s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}>
            <circle
              cx={r.x}
              cy={r.y}
              r="2.2"
              fill="rgba(8,8,18,0.9)"
              stroke="rgba(34,211,238,0.45)"
              strokeWidth="0.35"
            />
            <circle cx={r.x} cy={r.y} r="0.9" fill="url(#global-node)" />
          </g>
        ))}
      </svg>

      {/* Partículas / señales (tiempo real, datos vivos) */}
      {[
        { left: "22%", top: "38%", d: 0 },
        { left: "78%", top: "34%", d: 0.4 },
        { left: "48%", top: "58%", d: 0.2 },
        { left: "52%", top: "28%", d: 0.6 },
        { left: "14%", top: "52%", d: 0.3 },
        { left: "86%", top: "48%", d: 0.5 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-aplat-cyan/60"
          style={{
            left: p.left,
            top: p.top,
            animation: "services-float 6s ease-in-out infinite",
            animationDelay: `${p.d}s`,
            boxShadow: "0 0 8px rgba(34,211,238,0.4)",
          }}
        />
      ))}

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px), linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)",
          backgroundSize: "clamp(20px, 3vw, 40px) clamp(20px, 3vw, 40px)",
        }}
      />
    </div>
  );
}
