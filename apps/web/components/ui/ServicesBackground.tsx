"use client";

/**
 * Fondo dedicado para la sección Servicios:
 * - Nube animada (despliegue en la nube)
 * - Nodos conectados con pulso (plataformas, integraciones, APIs)
 * - Mini ventanas/cards flotantes (plataformas web)
 * - Líneas de flujo animadas (automatización, datos)
 * - Barras tipo dashboard con pulso (métricas)
 * - Partículas de “datos” en movimiento
 */

export function ServicesBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {/* Base */}
      <div className="absolute inset-0 bg-guru-surface/50" />

      {/* Nube: capas superiores con animación suave */}
      <svg
        className="absolute top-0 left-0 w-full opacity-100"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMin slice"
        style={{
          height: "min(35vh, 280px)",
          animation: "services-cloud-drift 12s ease-in-out infinite",
        }}
      >
        <defs>
          <linearGradient id="cloud-layer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0 120 Q300 80 600 100 Q900 60 1200 90 L1200 200 L0 200 Z"
          fill="url(#cloud-layer)"
        />
        <path
          d="M0 140 Q400 100 800 130 Q1100 90 1200 110 L1200 200 L0 200 Z"
          fill="rgba(167,139,250,0.08)"
        />
      </svg>

      {/* Mini ventanas / cards flotantes (plataformas web) */}
      {[
        { x: "8%", y: "22%", w: 48, h: 32, d: 0 },
        { x: "78%", y: "18%", w: 40, h: 28, d: 0.5 },
        { x: "15%", y: "72%", w: 44, h: 30, d: 1 },
        { x: "72%", y: "68%", w: 36, h: 24, d: 1.5 },
        { x: "45%", y: "35%", w: 32, h: 22, d: 0.8 },
      ].map((card, i) => (
        <div
          key={i}
          className="absolute rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
          style={{
            left: card.x,
            top: card.y,
            width: card.w,
            height: card.h,
            animation: "services-float 8s ease-in-out infinite",
            animationDelay: `${card.d}s`,
          }}
        />
      ))}

      {/* Nodos y conexiones (plataformas, integraciones, APIs) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="line-serv" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.45)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        {/* Más conexiones */}
        <path d="M100 200 L280 200 L280 300" fill="none" stroke="url(#line-serv)" strokeWidth="0.8" strokeDasharray="6 12" style={{ animation: "cyber-flow 8s linear infinite" }} />
        <path d="M400 150 L400 280 L520 280" fill="none" stroke="url(#line-serv)" strokeWidth="0.8" strokeDasharray="6 12" style={{ animation: "cyber-flow 7s linear infinite 0.5s" }} />
        <path d="M700 250 L520 250 L520 380" fill="none" stroke="rgba(167,139,250,0.25)" strokeWidth="0.6" strokeDasharray="4 10" style={{ animation: "cyber-flow 9s linear infinite 1s" }} />
        <path d="M250 450 L250 350 L400 350" fill="none" stroke="url(#line-serv)" strokeWidth="0.6" strokeDasharray="4 10" style={{ animation: "cyber-flow 8.5s linear infinite" }} />
        <path d="M520 280 L520 450" fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="0.5" strokeDasharray="4 8" style={{ animation: "cyber-flow 10s linear infinite 0.3s" }} />
        <path d="M100 200 L100 80 L400 80" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" strokeDasharray="3 6" style={{ animation: "cyber-flow 14s linear infinite" }} />
        {/* Nodos con pulso (stagger) */}
        {[
          [100, 200], [280, 300], [400, 150], [520, 280], [700, 250], [250, 450], [400, 350], [520, 450], [400, 80],
        ].map(([cx, cy], i) => (
          <g key={i} style={{ animation: "services-node-pulse 3s ease-in-out infinite", animationDelay: `${i * 0.25}s` }}>
            <circle cx={cx} cy={cy} r="14" fill="rgba(8,8,15,0.92)" stroke="rgba(34,211,238,0.3)" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r="4" fill="rgba(34,211,238,0.6)" />
          </g>
        ))}
      </svg>

      {/* Partículas de “datos” en movimiento (puntos que flotan) */}
      {[
        { left: "12%", top: "28%", d: 0 },
        { left: "35%", top: "45%", d: 0.4 },
        { left: "58%", top: "32%", d: 0.8 },
        { left: "82%", top: "55%", d: 0.2 },
        { left: "25%", top: "62%", d: 0.6 },
        { left: "68%", top: "72%", d: 0.3 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-guru-cyan/60"
          style={{
            left: p.left,
            top: p.top,
            animation: "services-float 6s ease-in-out infinite",
            animationDelay: `${p.d}s`,
            boxShadow: "0 0 8px rgba(34,211,238,0.4)",
          }}
        />
      ))}

      {/* Barras tipo dashboard (métricas) con pulso */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] opacity-100"
        style={{ animation: "services-bar-pulse 4s ease-in-out infinite" }}
      >
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
              stroke="rgba(34,211,238,0.4)"
              strokeWidth="0.6"
            />
          ))}
        </svg>
      </div>

      {/* Líneas de datos / automatización (varias, animadas) */}
      <div className="absolute left-0 right-0 h-px opacity-25" style={{ top: "52%" }}>
        <svg viewBox="0 0 1200 2" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(34,211,238,0.45)" strokeWidth="1" strokeDasharray="20 30" style={{ animation: "cyber-flow 12s linear infinite" }} />
        </svg>
      </div>
      <div className="absolute left-0 right-0 h-px opacity-15" style={{ top: "58%" }}>
        <svg viewBox="0 0 1200 2" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(167,139,250,0.4)" strokeWidth="1" strokeDasharray="15 25" style={{ animation: "cyber-flow 14s linear infinite 1s" }} />
        </svg>
      </div>

      {/* Iconos abstractos: “plug” / API (conexiones) */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        {[[120, 380], [580, 120], [680, 480]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y})`} style={{ animation: "services-node-pulse 4s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}>
            <circle cx="0" cy="0" r="12" fill="none" stroke="rgba(167,139,250,0.25)" strokeWidth="0.6" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="rgba(167,139,250,0.4)" strokeWidth="0.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(167,139,250,0.4)" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* Orbes de ambiente */}
      <div className="absolute top-0 right-0 w-[45vmax] h-[45vmax] max-w-[600px] max-h-[600px] bg-guru-violet/8 rounded-full blur-[20vmin] animate-neon-pulse" />
      <div className="absolute bottom-0 left-0 w-[35vmax] h-[35vmax] max-w-[500px] max-h-[500px] bg-guru-cyan/6 rounded-full blur-[18vmin]" />
    </div>
  );
}
