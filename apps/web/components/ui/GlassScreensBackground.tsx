"use client";

/**
 * Pantallas transparentes (glass) que muestran contenido abstracto de “proceso”: grids, barras, datos.
 */

export function GlassScreensBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Pantalla 1: grid + barras (tipo dashboard) */}
      <div
        className="absolute w-[280px] h-[160px] rounded-xl glass glass-strong border border-white/10"
        style={{ top: "18%", left: "8%", opacity: 0.5 }}
      >
        <div className="p-3 h-full flex flex-col">
          <div className="text-[10px] text-guru-cyan/70 font-mono mb-2 uppercase tracking-wider">
            Proceso
          </div>
          <div className="flex-1 grid grid-cols-4 gap-1">
            {[72, 45, 88, 63].map((h, i) => (
              <div
                key={i}
                className="bg-guru-cyan/20 rounded-sm self-end transition-all duration-1000"
                style={{ height: `${h}%`, minHeight: 4 }}
              />
            ))}
          </div>
          <div className="mt-1 h-px bg-white/10" />
          <div className="mt-1 flex gap-2">
            <span className="text-[9px] text-guru-muted font-mono">0.94</span>
            <span className="text-[9px] text-guru-cyan/80 font-mono">✓</span>
          </div>
        </div>
      </div>

      {/* Pantalla 2: líneas tipo código / datos */}
      <div
        className="absolute w-[240px] h-[120px] rounded-xl glass glass-strong border border-white/10"
        style={{ top: "55%", right: "12%", opacity: 0.45 }}
      >
        <div className="p-3 h-full font-mono text-[10px] text-guru-muted/90 space-y-1">
          <div className="text-guru-cyan/60">{"> context.load()"}</div>
          <div className="pl-2 text-guru-violet/60">{"→ 1.2ms"}</div>
          <div className="text-guru-cyan/60">{"> model.predict()"}</div>
          <div className="pl-2 text-guru-violet/60">{"→ 0.8ms"}</div>
          <div className="text-guru-emerald/60">{"✓ output"}</div>
        </div>
      </div>

      {/* Pantalla 3: métricas / nodos activos */}
      <div
        className="absolute w-[200px] h-[100px] rounded-xl glass glass-strong border border-white/10"
        style={{ bottom: "22%", left: "18%", opacity: 0.4 }}
      >
        <div className="p-3 h-full flex flex-col justify-center">
          <div className="text-[9px] text-guru-muted uppercase tracking-wider mb-2">
            Red
          </div>
          <div className="flex gap-2 items-end">
            {[3, 5, 4, 6, 5].map((v, i) => (
              <div
                key={i}
                className="w-4 rounded-sm bg-gradient-to-t from-guru-cyan/30 to-guru-cyan/10"
                style={{ height: `${v * 12}px` }}
              />
            ))}
          </div>
          <div className="mt-2 text-[9px] font-mono text-guru-cyan/70">
            128 → 64 → 32
          </div>
        </div>
      </div>
    </div>
  );
}
