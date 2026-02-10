"use client";

/**
 * Fondo tipo red neuronal: nodos conectados con “datos” fluyendo por las conexiones (SVG animado).
 */

const NODES = [
  { cx: "10%", cy: "20%" },
  { cx: "25%", cy: "15%" },
  { cx: "40%", cy: "25%" },
  { cx: "55%", cy: "18%" },
  { cx: "70%", cy: "22%" },
  { cx: "85%", cy: "28%" },
  { cx: "15%", cy: "45%" },
  { cx: "35%", cy: "50%" },
  { cx: "50%", cy: "42%" },
  { cx: "65%", cy: "48%" },
  { cx: "88%", cy: "44%" },
  { cx: "22%", cy: "68%" },
  { cx: "45%", cy: "72%" },
  { cx: "60%", cy: "65%" },
  { cx: "78%", cy: "70%" },
  { cx: "30%", cy: "88%" },
  { cx: "55%", cy: "92%" },
  { cx: "75%", cy: "85%" },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [1, 6], [2, 7], [3, 8], [4, 9], [5, 10],
  [6, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [7, 11], [7, 12], [8, 12], [8, 13], [9, 13], [10, 14],
  [11, 12], [12, 13], [13, 14],
  [11, 15], [12, 15], [12, 16], [13, 16], [14, 17],
  [15, 16], [16, 17],
];

function getCoord(node: { cx: string; cy: string }, size: { w: number; h: number }) {
  const x = (parseFloat(node.cx) / 100) * size.w;
  const y = (parseFloat(node.cy) / 100) * size.h;
  return { x, y };
}

export function NeuralNetworkBackground() {
  // Usamos viewBox 0 0 100 100 y luego aspect ratio para que escale bien
  const w = 100;
  const h = 100;
  const nodePositions = NODES.map((n) => ({
    x: (parseFloat(n.cx) / 100) * w,
    y: (parseFloat(n.cy) / 100) * h,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden opacity-40" aria-hidden>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="neural-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.6)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
          </linearGradient>
          <linearGradient id="neural-node-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0.5)" />
          </linearGradient>
        </defs>
        {/* Conexiones estáticas (línea base) */}
        <g stroke="rgba(34, 211, 238, 0.12)" strokeWidth="0.15" fill="none">
          {EDGES.map(([a, b], i) => (
            <line
              key={`base-${i}`}
              x1={nodePositions[a].x}
              y1={nodePositions[a].y}
              x2={nodePositions[b].x}
              y2={nodePositions[b].y}
            />
          ))}
        </g>
        {/* Flujo de datos (trazo animado a lo largo de cada conexión) */}
        <g stroke="url(#neural-line)" strokeWidth="0.25" fill="none" strokeLinecap="round">
          {EDGES.map(([a, b], i) => (
            <line
              key={`flow-${i}`}
              x1={nodePositions[a].x}
              y1={nodePositions[a].y}
              x2={nodePositions[b].x}
              y2={nodePositions[b].y}
              className="animate-neural-flow"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </g>
        {/* Nodos */}
        <g fill="url(#neural-node-glow)">
          {nodePositions.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={0.4}
              className="animate-pulse"
              style={{ opacity: 0.8 }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
