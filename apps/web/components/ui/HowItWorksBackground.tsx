"use client";

/**
 * Fondo dedicado para "Cómo funciona" / Inteligencia:
 * - Núcleo central pulsante (cerebro/datos)
 * - Anillos rotatorios y flujo de datos
 * - Red neuronal densa con conexiones animadas
 * - Cuatro pilares (01–04) con glow
 * - Sinapsis / partículas que parpadean
 */

const PILLARS = [
  { x: 18, y: 48, num: "01" },
  { x: 38, y: 38, num: "02" },
  { x: 62, y: 38, num: "03" },
  { x: 82, y: 48, num: "04" },
];

const CORE_X = 50;
const CORE_Y = 48;

/* Conexiones núcleo ↔ pilares + entre pilares */
const EDGES = [
  [CORE_X, CORE_Y, 18, 48],
  [CORE_X, CORE_Y, 38, 38],
  [CORE_X, CORE_Y, 62, 38],
  [CORE_X, CORE_Y, 82, 48],
  [18, 48, 38, 38],
  [38, 38, 62, 38],
  [62, 38, 82, 48],
];

/* Nodos extra para red más densa (inteligencia) */
const EXTRA_NODES = [
  [22, 28], [42, 22], [58, 22], [78, 28],
  [12, 58], [28, 62], [72, 62], [88, 58],
  [50, 18], [30, 55], [70, 55],
];

/* Sinapsis: posiciones para parpadeo */
const SYNAPSE = [
  [28, 42], [45, 32], [55, 32], [72, 42],
  [35, 50], [65, 50], [50, 42], [50, 55],
  [25, 35], [75, 35],
];

export function HowItWorksBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base oscura */}
      <div className="absolute inset-0 bg-aplat-surface/60" />

      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hiw-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.6)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.7)" />
          </linearGradient>
          <linearGradient id="hiw-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.7)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.5)" />
          </linearGradient>
          <radialGradient id="hiw-glow">
            <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="70%" stopColor="rgba(34,211,238,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="hiw-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Glow detrás del núcleo */}
        <circle
          cx={CORE_X}
          cy={CORE_Y}
          r="12"
          fill="url(#hiw-glow)"
          className="opacity-80"
          style={{ animation: "howitworks-core-pulse 4s ease-in-out infinite" }}
        />

        {/* Anillos rotatorios alrededor del núcleo */}
        <g transform={`translate(${CORE_X},${CORE_Y})`} style={{ transformOrigin: "0 0", animation: "howitworks-ring-rotate 18s linear infinite" }}>
          <ellipse
            cx={0}
            cy={0}
            rx="8"
            ry="6"
            fill="none"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="0.4"
            strokeDasharray="2 4"
          />
        </g>
        <g transform={`translate(${CORE_X},${CORE_Y})`} style={{ transformOrigin: "0 0", animation: "howitworks-ring-rotate 24s linear infinite reverse" }}>
          <ellipse
            cx={0}
            cy={0}
            rx="11"
            ry="7"
            fill="none"
            stroke="rgba(167,139,250,0.25)"
            strokeWidth="0.3"
            strokeDasharray="1.5 5"
          />
        </g>

        {/* Núcleo central (cerebro/datos) */}
        <circle
          cx={CORE_X}
          cy={CORE_Y}
          r="4"
          fill="url(#hiw-core)"
          filter="url(#hiw-blur)"
          style={{ animation: "howitworks-core-pulse 4s ease-in-out infinite" }}
        />
        <circle
          cx={CORE_X}
          cy={CORE_Y}
          r="2.5"
          fill="rgba(34,211,238,0.95)"
          style={{ animation: "howitworks-core-pulse 4s ease-in-out infinite" }}
        />

        {/* Conexiones base (líneas estáticas) */}
        <g stroke="rgba(34,211,238,0.12)" strokeWidth="0.2" fill="none">
          {EDGES.map(([x1, y1, x2, y2], i) => (
            <line key={`b-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
          {EXTRA_NODES.slice(0, 6).map(([x, y], i) => {
            const next = EXTRA_NODES[(i + 1) % 6];
            return <line key={`ex-${i}`} x1={x} y1={y} x2={next[0]} y2={next[1]} />;
          })}
        </g>

        {/* Flujo de datos por las conexiones principales */}
        <g stroke="url(#hiw-line)" strokeWidth="0.35" fill="none" strokeLinecap="round" strokeDasharray="1.5 3">
          {EDGES.map(([x1, y1, x2, y2], i) => (
            <line
              key={`f-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              style={{
                animation: "cyber-flow 6s linear infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </g>

        {/* Nodos extra (red) */}
        {EXTRA_NODES.map(([x, y], i) => (
          <g key={`n-${i}`} style={{ animation: "howitworks-synapse 3s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}>
            <circle cx={x} cy={y} r="0.5" fill="rgba(34,211,238,0.6)" />
          </g>
        ))}

        {/* Sinapsis (parpadeos) */}
        {SYNAPSE.map(([x, y], i) => (
          <circle
            key={`s-${i}`}
            cx={x}
            cy={y}
            r="0.4"
            fill="rgba(167,139,250,0.9)"
            className="opacity-60"
            style={{
              animation: "howitworks-synapse 2.5s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}

        {/* Cuatro pilares: círculos con glow y número */}
        {PILLARS.map(({ x, y, num }, i) => (
          <g key={num}>
            <circle
              cx={x}
              cy={y}
              r="3.5"
              fill="rgba(8,8,18,0.85)"
              stroke="rgba(34,211,238,0.5)"
              strokeWidth="0.35"
              style={{
                animation: "services-node-pulse 3s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
                filter: "drop-shadow(0 0 6px rgba(34,211,238,0.4))",
              }}
            />
            <text
              x={x}
              y={y + 0.5}
              textAnchor="middle"
              fill="rgba(34,211,238,0.95)"
              fontSize="1.8"
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
            >
              {num}
            </text>
          </g>
        ))}
      </svg>

      {/* Partículas flotantes (datos) */}
      {[
        { left: "14%", top: "32%", d: 0 },
        { left: "48%", top: "22%", d: 0.5 },
        { left: "86%", top: "35%", d: 0.2 },
        { left: "22%", top: "58%", d: 0.7 },
        { left: "76%", top: "62%", d: 0.3 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-aplat-cyan/70"
          style={{
            left: p.left,
            top: p.top,
            animation: "services-float 7s ease-in-out infinite",
            animationDelay: `${p.d}s`,
            boxShadow: "0 0 12px rgba(34,211,238,0.6)",
          }}
        />
      ))}

      {/* Grid sutil de fondo */}
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
