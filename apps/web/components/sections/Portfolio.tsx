"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { ExternalLink } from "lucide-react";

const GITHUB_BASE = "https://github.com/aurelio104";

/** Dominios en producción (Vercel o custom). Solo estos proyectos se muestran en el portafolio. */
const VERCEL_URLS: Record<string, string> = {
  APlat: "https://aplat.vercel.app",
  Omac: "https://omac569.com",
};

/** Logo desde el sitio en vivo cuando no está en public/portafolio (ej. copiado del repo del proyecto). */
const LOGO_EXTERNAL: Record<string, string> = {
  Omac: "https://omac569.com/logo.png",
};

function getProjectUrl(slug: string): string {
  const exact = VERCEL_URLS[slug]?.trim();
  if (exact) return exact.replace(/\/$/, "");
  const lower = VERCEL_URLS[slug.toLowerCase()]?.trim();
  if (lower) return lower.replace(/\/$/, "");
  const byKey = Object.entries(VERCEL_URLS).find(([k]) => k.toLowerCase() === slug.toLowerCase())?.[1]?.trim();
  if (byKey) return byKey.replace(/\/$/, "");
  return `${GITHUB_BASE}/${slug}`;
}

/** True si el proyecto tiene dominio en Vercel (solo mostramos esos en el portafolio). */
function hasVercelDomain(slug: string): boolean {
  const url = getProjectUrl(slug);
  return url.startsWith("https://") && !url.startsWith(GITHUB_BASE);
}

/** Repos que tienen dominio en VERCEL_URLS; solo estos se muestran. */
function getReposWithDomain(): typeof ALL_REPOS {
  return ALL_REPOS.filter((repo) => hasVercelDomain(repo.slug));
}

function ProjectLogo({
  slug,
  name,
  size = 40,
  className = "",
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [attempt, setAttempt] = useState<"png" | "svg" | "external" | "failed">("png");
  const initial = name.charAt(0).toUpperCase();
  const externalUrl = LOGO_EXTERNAL[slug] ?? LOGO_EXTERNAL[slug.toLowerCase()];

  if (attempt === "failed" || (attempt === "external" && !externalUrl)) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-white/10 text-aplat-cyan font-semibold shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {initial}
      </span>
    );
  }

  const src =
    attempt === "png"
      ? `/portafolio/${slug}.png`
      : attempt === "svg"
        ? `/portafolio/${slug}.svg`
        : externalUrl ?? "";
  return (
    <img
      src={src}
      alt={`Logo ${name}`}
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      onError={() => {
        if (attempt === "png") setAttempt("svg");
        else if (attempt === "svg" && externalUrl) setAttempt("external");
        else setAttempt("failed");
      }}
    />
  );
}

const ALL_REPOS = [
  { slug: "Omac", name: "Omac" },
  { slug: "JCavalier", name: "JCavalier" },
  { slug: "control-acceso-albatros", name: "Control de acceso" },
  { slug: "MundoIAanime", name: "MundoIAanime" },
  { slug: "maracay-deportiva", name: "Maracay Deportiva" },
  { slug: "rt-reportes", name: "RT Reportes" },
  { slug: "RayPremios", name: "RayPremios" },
  { slug: "Cuadrernos", name: "Cuadrernos" },
  { slug: "plataforma-albatros", name: "Plataforma Albatros" },
  { slug: "BAMVino", name: "BAMVino" },
  { slug: "gvx-demo", name: "gvx-demo" },
  { slug: "mi-app-guru", name: "mi-app-guru" },
  { slug: "memoria", name: "Memoria" },
  { slug: "BotArbi", name: "BotArbi" },
  { slug: "Admin", name: "Admin" },
  { slug: "APlat", name: "APlat" },
  { slug: "hack", name: "hack" },
  { slug: "albatros-presentacion", name: "Albatros Presentación" },
  { slug: "CuadernosOficial", name: "Cuadernos Oficial" },
  { slug: "WebArJC", name: "WebArJC" },
  { slug: "bantx", name: "bantx" },
  { slug: "WebArEpacio", name: "WebArEpacio" },
  { slug: "WebArGeo", name: "WebArGeo" },
  { slug: "WebArEspacio", name: "WebArEspacio" },
  { slug: "repropaper", name: "repropaper" },
  { slug: "insurance-app", name: "insurance-app" },
];

const REPO_DETAIL: Record<string, { tagline: string; stack: string; result: string }> = {
  "plataforma-albatros": {
    tagline: "Intranet + venta de vuelos",
    stack: "Next.js · Amadeus · KIU · Hikvision",
    result: "Reservas en tiempo real",
  },
  Omac: {
    tagline: "Centro de mando inteligente",
    stack: "Next.js · WebAuthn · WhatsApp",
    result: "Operaciones unificadas",
  },
  JCavalier: {
    tagline: "Panel y producto con marca",
    stack: "Next.js · React · Admin",
    result: "Gestión y experiencia de marca",
  },
  "rt-reportes": {
    tagline: "PWA multiempresa",
    stack: "Fastify · React · Excel IA",
    result: "Reportes desde Excel en minutos",
  },
  "control-acceso-albatros": {
    tagline: "Recepción digital",
    stack: "OCR · QR · React",
    result: "Visitas con carnets digitales",
  },
  MundoIAanime: {
    tagline: "IA y anime",
    stack: "React · IA",
    result: "Experiencias interactivas",
  },
  "maracay-deportiva": {
    tagline: "Contenido deportivo",
    stack: "Web · Medios",
    result: "Medio digital",
  },
  RayPremios: {
    tagline: "Sistema de premios",
    stack: "Web · Apps",
    result: "Gestión de premios",
  },
  Cuadrernos: {
    tagline: "Producto cuadernos",
    stack: "Web · Apps",
    result: "Cuadernos digitales",
  },
  BAMVino: {
    tagline: "Vertical vino",
    stack: "Web · e-commerce",
    result: "Experiencia vino",
  },
  "gvx-demo": {
    tagline: "Demo visualización",
    stack: "React · Gráficos",
    result: "Demos y prototipos",
  },
  "mi-app-guru": {
    tagline: "App Guru",
    stack: "Web · App",
    result: "Producto móvil/web",
  },
  memoria: {
    tagline: "Notas y memoria",
    stack: "Web · App",
    result: "Gestión de notas",
  },
  BotArbi: {
    tagline: "Bot automatización",
    stack: "Bot · IA",
    result: "Automatización",
  },
  Admin: {
    tagline: "Panel administrativo",
    stack: "Web · Admin",
    result: "Gestión centralizada",
  },
  APlat: {
    tagline: "Plataforma de servicios",
    stack: "Next.js · Tailwind 4 · Vercel",
    result: "Portafolio y servicios",
  },
  hack: {
    tagline: "Seguridad y pruebas",
    stack: "Pentest · Seguridad",
    result: "Consultoría seguridad",
  },
  "albatros-presentacion": {
    tagline: "Presentación institucional",
    stack: "Web · Presentación",
    result: "Marca Albatros",
  },
  CuadernosOficial: {
    tagline: "Cuadernos oficial",
    stack: "Web · Apps",
    result: "Producto oficial",
  },
  WebArJC: {
    tagline: "Web AR / JC",
    stack: "Web · AR",
    result: "Experiencias AR",
  },
  bantx: {
    tagline: "Banca / transacciones",
    stack: "Fintech · Web",
    result: "Soluciones fintech",
  },
  WebArEpacio: {
    tagline: "Web AR Espacio",
    stack: "Web · AR",
    result: "Experiencias espaciales",
  },
  WebArGeo: {
    tagline: "Web AR Geo",
    stack: "Web · Geo · AR",
    result: "Geo y AR",
  },
  WebArEspacio: {
    tagline: "Web AR Espacio",
    stack: "Web · AR",
    result: "Contenido AR",
  },
  repropaper: {
    tagline: "Impresión",
    stack: "Productos · Impresión",
    result: "Soluciones impresión",
  },
  "insurance-app": {
    tagline: "Seguros",
    stack: "Web · Seguros",
    result: "App seguros",
  },
};

function RepoLogoCarousel() {
  const withDomain = getReposWithDomain();
  const duplicated = [...withDomain, ...withDomain];
  return (
    <div className="relative w-full overflow-hidden py-6">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {duplicated.map((repo, i) => (
          <a
            key={`${repo.slug}-${i}`}
            href={getProjectUrl(repo.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass glass-strong rounded-xl px-5 py-3 border border-white/10 hover:border-aplat-cyan/30 transition-all shrink-0 group"
          >
            <ProjectLogo slug={repo.slug} name={repo.name} size={28} />
            <span className="text-sm font-medium text-aplat-text group-hover:text-aplat-cyan transition-colors">
              {repo.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Portfolio() {
  return (
    <section
      id="portafolio"
      className="relative py-24 overflow-hidden"
      aria-labelledby="portfolio-heading"
    >
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aplat-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="portfolio-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-violet transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Portafolio
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-10 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Proyectos en producción que demuestran nuestra capacidad.
        </motion.p>

        {/* Carrusel de logos / nombres */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <RepoLogoCarousel />
        </motion.div>

        {/* Grid: solo proyectos con dominio en Vercel (verificados por sync:vercel) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getReposWithDomain().length === 0 ? (
            <p className="col-span-full text-center text-aplat-muted py-8">
              No hay proyectos con dominio en producción. Ejecuta <code className="text-aplat-cyan/80">pnpm run sync:vercel</code> para cargar y verificar los dominios.
            </p>
          ) : getReposWithDomain().map((repo, i) => {
            const detail = REPO_DETAIL[repo.slug];
            return (
              <motion.div
                key={repo.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.5), ease: [0.23, 1, 0.32, 1] }}
              >
                <Card3D className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-aplat-violet/30 h-full group">
                  <a
                    href={getProjectUrl(repo.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProjectLogo slug={repo.slug} name={repo.name} size={44} className="rounded-xl" />
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-aplat-text group-hover:text-aplat-violet transition-colors truncate">
                            {repo.name}
                          </h3>
                          <p className="text-aplat-muted/80 text-xs font-mono truncate">
                            aurelio104/{repo.slug}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-aplat-muted group-hover:text-aplat-violet transition-colors shrink-0 mt-1" />
                    </div>
                    <div className="mt-2">
                      {detail && (
                        <>
                          <p className="text-aplat-muted text-sm mb-1">{detail.tagline}</p>
                          <p className="text-aplat-cyan/80 text-xs font-mono mb-1">{detail.stack}</p>
                          <p className="text-aplat-emerald/90 text-xs font-medium">{detail.result}</p>
                        </>
                      )}
                    </div>
                  </a>
                </Card3D>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

