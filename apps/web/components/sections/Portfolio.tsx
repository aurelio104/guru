"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import { ExternalLink, Github } from "lucide-react";

const GITHUB_BASE = "https://github.com/aurelio104";

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
  const duplicated = [...ALL_REPOS, ...ALL_REPOS];
  return (
    <div className="relative w-full overflow-hidden py-6">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {duplicated.map((repo, i) => (
          <a
            key={`${repo.slug}-${i}`}
            href={`${GITHUB_BASE}/${repo.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass glass-strong rounded-xl px-5 py-3 border border-white/10 hover:border-aplat-cyan/30 transition-all shrink-0 group"
          >
            <Github className="w-5 h-5 text-aplat-muted group-hover:text-aplat-cyan transition-colors" />
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

        {/* Grid de proyectos con detalle y 3D */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_REPOS.map((repo, i) => {
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
                    href={`${GITHUB_BASE}/${repo.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-aplat-text group-hover:text-aplat-violet transition-colors">
                        {repo.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-aplat-muted group-hover:text-aplat-violet transition-colors shrink-0" />
                    </div>
                    <p className="text-aplat-muted/80 text-xs font-mono mb-2">
                      aurelio104/{repo.slug}
                    </p>
                    {detail && (
                      <>
                        <p className="text-aplat-muted text-sm mb-1">{detail.tagline}</p>
                        <p className="text-aplat-cyan/80 text-xs font-mono mb-1">{detail.stack}</p>
                        <p className="text-aplat-emerald/90 text-xs font-medium">{detail.result}</p>
                      </>
                    )}
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
