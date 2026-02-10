"use client";

/**
 * Fondos sutiles de última generación: imagen opcional + textura futurista (SVG).
 * Si añades imágenes en public/backgrounds/ (hero-bg.jpg, section-bg.jpg), se usan con opacidad muy baja.
 */

type FuturistBackgroundProps = {
  /** Ruta de imagen en public, ej: /backgrounds/hero-bg.jpg. Opcional. */
  imageSrc?: string;
  /** Opacidad de la imagen (0.04–0.12). */
  imageOpacity?: number;
  /** Variante: más densidad de textura en hero. */
  variant?: "hero" | "section";
  /** Clases extra para el contenedor. */
  className?: string;
};

export function FuturistBackground({
  imageSrc,
  imageOpacity = 0.06,
  variant = "section",
  className = "",
}: FuturistBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Imagen de fondo (sutil, última generación) */}
      {imageSrc && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${imageSrc})`,
            opacity: imageOpacity,
          }}
        />
      )}

      {/* Textura futurista: puntos tipo data + grid sutil (siempre visible) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="futurist-dots"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="0.6" fill="rgba(34,211,238,0.5)" />
            <circle cx="22" cy="14" r="0.45" fill="rgba(167,139,250,0.4)" />
            <circle cx="14" cy="28" r="0.5" fill="rgba(34,211,238,0.35)" />
            <circle cx="34" cy="6" r="0.35" fill="rgba(167,139,250,0.25)" />
            <circle cx="8" cy="18" r="0.4" fill="rgba(34,211,238,0.3)" />
          </pattern>
          <pattern
            id="futurist-grid-subtle"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 32 L64 32 M32 0 L32 64"
              fill="none"
              stroke="rgba(34,211,238,0.06)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#futurist-dots)" />
        {variant === "hero" && (
          <rect width="100%" height="100%" fill="url(#futurist-grid-subtle)" />
        )}
      </svg>

      {/* Velo muy sutil para no competir con el contenido */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 85% 60% at 50% 50%, transparent 50%, rgba(3,3,6,0.25) 100%)",
        }}
      />
    </div>
  );
}
