"use client";

/**
 * Fondo dedicado para la sección Servicios:
 * - Nube (capas suaves arriba)
 * - Nodos conectados (plataformas, integraciones, APIs)
 * - Líneas de flujo (automatización, datos)
 * - Grid tipo dashboard (métricas)
 * Refleja: plataformas web, integraciones, automatización, nube.
 */

export function ServicesBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base */}
      <div className="absolute inset-0 bg-aplat-surface/50" />

      {/* Nube: capas suaves superiores (despliegue en la nube) */}
      <svg
        className="absolute top-0 left-0 w-full opacity-20"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMin slice"
        style={{ height: "min(35vh, 280px)" }}
      >
        <defs>
          <linearGradient id="cloud-layer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0 120 Q300 80 600 100 Q900 60 1200 90 L1200 200 L0 200 Z"
          fill="url(#cloud-layer)"
        />
        <path
          d="M0 140 Q400 100 800 130 Q1100 90 1200 110 L1200 200 L0 200 Z"
          fill="rgba(167,139,250,0.06)"
        />
      </svg>

      {/* Nodos y conexiones (plataformas, integraciones, APIs) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="line-serv" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.4)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        {/* Conexiones */}
        <path d="M100 200 L280 200 L280 300" fill="none" stroke="url(#line-serv)" strokeWidth="0.8" strokeDasharray="6 12" style={{ animation: "cyber-flow 8s linear infinite" }} />
        <path d="M400 150 L400 280 L520 280" fill="none" stroke="url(#line-serv)" strokeWidth="0.8" strokeDasharray="6 12" style={{ animation: "cyber-flow 7s linear infinite 0.5s" }} />
        <path d="M700 250 L520 250 L520 380" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="0.6" strokeDasharray="4 10" style={{ animation: "cyber-flow 9s linear infinite 1s" }} />
        <path d="M250 450 L250 350 L400 350" fill="none" stroke="url(#line-serv)" strokeWidth="0.6" strokeDasharray="4 10" style={{ animation: "cyber-flow 8.5s linear infinite" }} />
        {/* Nodos (servicios) */}
        {[
          [100, 200], [280, 300], [400, 150], [520, 280], [700, 250], [250, 450], [400, 350], [520, 450],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="14" fill="rgba(8,8,15,0.9)" stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r="4" fill="rgba(34,211,238,0.5)" />
          </g>
        ))}
      </svg>

      {/* Barras tipo dashboard (métricas, tiempo real) */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] opacity-15">
        <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          {[20, 45, 70, 95, 130, 165, 200, 235, 270, 305, 340, 375].map((h, i) => (
            <rect
              key={i}
              x={20 + i * 32}
              y={120 - h}
              width="14"
              height={h}
              rx="2"
              fill="none"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="0.6"
            />
          ))}
        </svg>
      </div>

      {/* Línea de “datos” / automatización (horizontal sutil) */}
      <div
        className="absolute left-0 right-0 h-px opacity-20"
        style={{ top: "55%" }}
      >
        <svg viewBox="0 0 1200 2" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(34,211,238,0.4)" strokeWidth="1" strokeDasharray="20 30" style={{ animation: "cyber-flow 12s linear infinite" }} />
        </svg>
      </div>

      {/* Orbes de ambiente */}
      <div className="absolute top-0 right-0 w-[45vmax] h-[45vmax] max-w-[600px] max-h-[600px] bg-aplat-violet/8 rounded-full blur-[20vmin] animate-neon-pulse" />
      <div className="absolute bottom-0 left-0 w-[35vmax] h-[35vmax] max-w-[500px] max-h-[500px] bg-aplat-cyan/6 rounded-full blur-[18vmin]" />
    </div>
  );
}
