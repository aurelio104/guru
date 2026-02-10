"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const PROJECTS = [
  {
    name: "Plataforma Albatros",
    tagline: "Intranet + venta de vuelos",
    stack: "Next.js · Amadeus · KIU · Hikvision",
    result: "Reservas en tiempo real",
  },
  {
    name: "Omac",
    tagline: "Centro de mando inteligente",
    stack: "Next.js · WebAuthn · WhatsApp",
    result: "Operaciones unificadas",
  },
  {
    name: "RT Reportes",
    tagline: "PWA multiempresa",
    stack: "Fastify · React · Excel IA",
    result: "Reportes desde Excel en minutos",
  },
  {
    name: "Control de acceso",
    tagline: "Recepción digital",
    stack: "OCR · QR · React",
    result: "Visitas con carnets digitales",
  },
];

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
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-violet"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Portafolio
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Proyectos en producción que demuestran nuestra capacidad.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROJECTS.map((project, i) => (
            <motion.article
              key={project.name}
              className="glass glass-strong rounded-2xl p-6 mirror-shine border border-white/10 hover:border-aplat-violet/30 transition-all group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{
                boxShadow: "0 0 40px rgba(167, 139, 250, 0.1)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-aplat-text group-hover:text-aplat-violet transition-colors">
                  {project.name}
                </h3>
                <ExternalLink className="w-5 h-5 text-aplat-muted group-hover:text-aplat-violet transition-colors" />
              </div>
              <p className="text-aplat-muted text-sm mb-2">{project.tagline}</p>
              <p className="text-aplat-cyan/80 text-xs font-mono mb-3">
                {project.stack}
              </p>
              <p className="text-aplat-emerald/90 text-sm font-medium">
                {project.result}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
