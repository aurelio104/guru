"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { PortfolioBackground } from "@/components/ui/PortfolioBackground";
import { ExternalLink, Sparkles } from "lucide-react";

/** Dominios de producción: generado/actualizado por scripts/sync-vercel-domains.mjs (Vercel API). Al cambiar dominio en Vercel y volver a ejecutar el script, GURU muestra el nuevo enlace. */
import productionUrlsData from "@/data/portfolio-production-urls.json";

const PRODUCTION_URLS: Record<string, string> = productionUrlsData as Record<string, string>;

/** Logo desde el sitio en vivo cuando no está en public/portafolio (fallback). */
const LOGO_EXTERNAL: Record<string, string> = {
  Omac: "https://omac569.com/logo.png",
};

/** Nombre para mostrar por slug (Listos se construye desde PRODUCTION_URLS). */
const SLUG_DISPLAY_NAMES: Record<string, string> = {
  GURU: "GURU",
  Omac: "Omac",
  JCavalier: "JCavalier",
  "control-acceso-albatros": "Control de acceso",
  MundoIAanime: "MundoIAanime",
  "maracay-deportiva": "Maracay Deportiva",
  "rt-reportes": "RT Reportes",
  "plataforma-albatros": "Plataforma Albatros",
  "albatros-presentacion": "Albatros Presentación",
  BAMVino: "BAMVino",
  "gvx-demo": "gvx-demo",
  memoria: "Memoria",
  CuadernosOficial: "Cuadernos Oficial",
};

/** Orden preferido para la sección Listos (los que tengan URL en PRODUCTION_URLS). */
const LISTOS_ORDER = [
  "GURU",
  "Omac",
  "JCavalier",
  "control-acceso-albatros",
  "MundoIAanime",
  "maracay-deportiva",
  "rt-reportes",
  "plataforma-albatros",
  "albatros-presentacion",
  "BAMVino",
  "gvx-demo",
  "memoria",
  "CuadernosOficial",
];

/** Listos — proyectos que tienen URL en portfolio-production-urls.json (actualizado con pnpm run sync:vercel). */
const REPOS_LISTOS: { slug: string; name: string }[] = LISTOS_ORDER.filter((slug) => {
  if (PRODUCTION_URLS[slug]) return true;
  const key = Object.keys(PRODUCTION_URLS).find((k) => k.toLowerCase() === slug.toLowerCase());
  return !!key;
}).map((slug) => ({
  slug,
  name: SLUG_DISPLAY_NAMES[slug] ?? slug,
}));

/** Proyectos destacados (cards grandes): slugs a mostrar en la parte superior. */
const FEATURED_SLUGS = ["plataforma-albatros", "Omac", "JCavalier"];

/** En desarrollo */
const REPOS_EN_DESARROLLO: { slug: string; name: string }[] = [
  { slug: "BotArbi", name: "BotArbi" },
  { slug: "Admin", name: "Admin" },
  { slug: "WebArJC", name: "WebArJC" },
  { slug: "bantx", name: "bantx" },
  { slug: "WebArEpacio", name: "WebArEpacio" },
  { slug: "WebArGeo", name: "WebArGeo" },
  { slug: "WebArEspacio", name: "WebArEspacio" },
  { slug: "repropaper", name: "repropaper" },
  { slug: "insurance-app", name: "insurance-app" },
];

/** Demos */
const REPOS_DEMOS: { slug: string; name: string }[] = [
  { slug: "gvx-demo", name: "gvx-demo" },
  { slug: "mi-app-guru", name: "mi-app-guru" },
];

/** URL de producción si existe; si no, cadena vacía (sin link). */
function getProductionUrl(slug: string): string {
  const exact = PRODUCTION_URLS[slug]?.trim();
  if (exact) return exact.replace(/\/$/, "");
  const lower = PRODUCTION_URLS[slug.toLowerCase()]?.trim();
  if (lower) return lower.replace(/\/$/, "");
  const byKey = Object.entries(PRODUCTION_URLS).find(([k]) => k.toLowerCase() === slug.toLowerCase())?.[1]?.trim();
  if (byKey) return byKey.replace(/\/$/, "");
  return "";
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
        className={`inline-flex items-center justify-center rounded-lg bg-white/10 text-guru-cyan font-semibold shrink-0 ${className}`}
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
    // eslint-disable-next-line @next/next/no-img-element -- dynamic fallback src (png/svg/external)
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
  GURU: {
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

function PortfolioGrid({
  title,
  repos,
  className = "",
}: {
  title: string;
  repos: { slug: string; name: string }[];
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
    >
      <h3 className="text-xl font-semibold text-guru-text mb-4 pl-1 border-l-2 border-guru-cyan/50">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo, i) => {
          const detail = REPO_DETAIL[repo.slug];
          const url = getProductionUrl(repo.slug);
          const cardContent = (
            <>
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <ProjectLogo slug={repo.slug} name={repo.name} size={44} className="rounded-xl" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-guru-text group-hover:text-guru-violet transition-colors truncate">
                      {repo.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {url && (
                    <span className="inline-flex rounded-full bg-guru-emerald/15 border border-guru-emerald/25 px-2 py-0.5 text-[10px] font-semibold text-guru-emerald uppercase tracking-wider">
                      En producción
                    </span>
                  )}
                  {url ? (
                    <ExternalLink className="w-4 h-4 text-guru-muted group-hover:text-guru-violet transition-colors mt-0.5" />
                  ) : (
                    <span className="w-4 h-4 mt-0.5 opacity-30" aria-hidden />
                  )}
                </div>
              </div>
              <div className="mt-2">
                {detail && (
                  <>
                    <p className="text-guru-muted text-sm mb-1">{detail.tagline}</p>
                    <p className="text-guru-cyan/80 text-xs font-mono mb-1">{detail.stack}</p>
                    <p className="text-guru-emerald/90 text-xs font-medium">{detail.result}</p>
                  </>
                )}
              </div>
            </>
          );
          return (
            <motion.div
              key={repo.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.5), ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-guru-violet/30 h-full group">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {cardContent}
                  </a>
                ) : (
                  <div className="block cursor-default">{cardContent}</div>
                )}
              </Card3D>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RepoLogoCarousel({ repos }: { repos: { slug: string; name: string }[] }) {
  const duplicated = [...repos, ...repos];
  const baseSize = 72;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [centeredIndex, setCenteredIndex] = useState<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let rafId: number;
    const updateCenter = () => {
      const vRect = viewport.getBoundingClientRect();
      const centerX = vRect.left + vRect.width / 2;
      const children = Array.from(track.children) as HTMLElement[];
      let closestIndex: number | null = null;
      let closestDist = Infinity;
      children.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(elCenterX - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      });
      setCenteredIndex((prev) => (prev === closestIndex ? prev : closestIndex));
      rafId = requestAnimationFrame(updateCenter);
    };
    rafId = requestAnimationFrame(updateCenter);
    return () => cancelAnimationFrame(rafId);
  }, [repos.length]);

  const isCentered = (i: number) => centeredIndex === i;
  const scale = (i: number) => (isCentered(i) ? 1.5 : 1);

  return (
    <div ref={viewportRef} className="relative w-full overflow-hidden py-10 sm:py-12">
      <div
        ref={trackRef}
        className="flex items-center gap-8 sm:gap-10 md:gap-12 animate-marquee whitespace-nowrap"
      >
        {duplicated.map((repo, i) => {
          const url = getProductionUrl(repo.slug);
          const s = scale(i);
          const wrapperClass =
            "inline-flex shrink-0 transition-transform duration-200 ease-out origin-center hover:opacity-90 transition-opacity";
          const logo = (
            <ProjectLogo
              slug={repo.slug}
              name={repo.name}
              size={baseSize}
              className="rounded-2xl"
            />
          );
          if (url) {
            return (
              <a
                key={`${repo.slug}-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={wrapperClass}
                style={{ transform: `scale(${s})` }}
                data-carousel-index={i}
              >
                {logo}
              </a>
            );
          }
          return (
            <span
              key={`${repo.slug}-${i}`}
              className={`${wrapperClass} opacity-70`}
              style={{ transform: `scale(${s})` }}
              data-carousel-index={i}
            >
              {logo}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Portfolio() {
  const featuredRepos = FEATURED_SLUGS.map((slug) => ({
    slug,
    name: SLUG_DISPLAY_NAMES[slug] ?? slug,
  })).filter((r) => REPOS_LISTOS.some((l) => l.slug === r.slug));

  return (
    <section
      id="portafolio"
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden min-h-0"
      aria-labelledby="portfolio-heading"
    >
      <PortfolioBackground />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Hero: lo más importante para el cliente = prueba real */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-guru-violet/25 bg-guru-violet/5 px-4 py-1.5 text-xs font-semibold text-guru-violet uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Portafolio
          </span>
        </motion.div>
        <motion.h2
          id="portfolio-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 sm:mb-5 text-gradient-violet max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Lo que construimos
        </motion.h2>
        <motion.p
          className="text-guru-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-14 sm:mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Proyectos reales en producción. Infraestructura, integraciones y experiencia de usuario que usan nuestros clientes cada día.
        </motion.p>

        {/* Destacados: 3 proyectos con card grande */}
        {featuredRepos.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-14 sm:mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {featuredRepos.map((repo, i) => {
              const detail = REPO_DETAIL[repo.slug];
              const url = getProductionUrl(repo.slug);
              const content = (
                <>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <ProjectLogo slug={repo.slug} name={repo.name} size={52} className="rounded-2xl" />
                    {url && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-guru-emerald/15 border border-guru-emerald/30 px-2.5 py-1 text-[10px] font-semibold text-guru-emerald uppercase tracking-wider">
                        En producción
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-guru-text mb-2 group-hover:text-guru-violet transition-colors">
                    {repo.name}
                  </h3>
                  {detail && (
                    <>
                      <p className="text-guru-muted text-sm mb-2">{detail.tagline}</p>
                      <p className="text-guru-violet/80 text-xs font-mono mb-2">{detail.stack}</p>
                      <p className="text-guru-emerald/90 text-sm font-medium">{detail.result}</p>
                    </>
                  )}
                  {url && (
                    <span className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-guru-violet group-hover:underline">
                      Ver sitio
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  )}
                </>
              );
              return (
                <motion.div
                  key={repo.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Card3D className="glass glass-strong rounded-2xl sm:rounded-3xl p-6 sm:p-8 mirror-shine border border-white/10 hover:border-guru-violet/30 h-full min-h-[260px] group">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
                        {content}
                      </a>
                    ) : (
                      <div className="block h-full">{content}</div>
                    )}
                  </Card3D>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Carrusel: todos los listos */}
        <motion.div
          className="mb-12 sm:mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <RepoLogoCarousel repos={REPOS_LISTOS} />
        </motion.div>

        {/* Listos */}
        <PortfolioGrid title="Todos en producción" repos={REPOS_LISTOS} className="mb-12 sm:mb-14" />

        {/* En desarrollo */}
        <PortfolioGrid title="En desarrollo" repos={REPOS_EN_DESARROLLO} className="mb-12 sm:mb-14" />

        {/* Demos */}
        <PortfolioGrid title="Demos" repos={REPOS_DEMOS} className="mb-14" />

        {/* CTA: contacto para proyecto similar */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="text-guru-muted text-lg mb-4">
            ¿Un proyecto así para tu negocio?
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center rounded-xl bg-guru-violet/20 hover:bg-guru-violet/30 text-guru-violet px-6 py-3 text-sm font-semibold border border-guru-violet/30 transition-all"
          >
            Hablemos
          </a>
        </motion.div>
      </div>
    </section>
  );
}

