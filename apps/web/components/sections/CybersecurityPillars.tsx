"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Shield, FileCheck, MonitorCheck, Lock } from "lucide-react";
import { CybersecurityBackground } from "@/components/ui/CybersecurityBackground";

type Pillar = {
  id: string;
  name: string;
  logo: string | null;
  tagline: string;
  description: string;
  stack: string;
  icon: LucideIcon;
  color: string;
};

const PILLARS: Pillar[] = [
  {
    id: "auditoria-ciberseguridad",
    name: "Auditoría Ciberseguridad",
    logo: "/portafolio/auditoria-ciberseguridad.png",
    tagline: "Pentest avanzado con IA",
    description:
      "Auditorías de seguridad con enfoque OWASP Top 10 y OWASP LLM 2025: spoofing, técnicas avanzadas e informes por dominio. Resumen ejecutivo, informe técnico y propuesta de valor para el cliente.",
    stack: "Node, TypeScript, análisis automatizado, export PDF/ZIP",
    icon: FileCheck,
    color: "cyan",
  },
  {
    id: "ciber",
    name: "Ciber",
    logo: "/portafolio/ciber.png",
    tagline: "Monitoreo en tiempo real",
    description:
      "Sistema de monitoreo de ciberseguridad para el Programa P-CS (manual MG-P-CS-004). Cumplimiento OACI, integración Fortinet y detección de amenazas. Backend Node/Express, frontend React/Vite, cliente Windows CiberWin.",
    stack: "Node, Express, Socket.IO, React, Vite, Fortinet",
    icon: MonitorCheck,
    color: "violet",
  },
  {
    id: "hack",
    name: "Hack",
    logo: null,
    tagline: "Framework de seguridad y confidencialidad",
    description:
      "Framework de seguridad (Alianzas Gancelot & Albatros): políticas, secretos, monitoreo, respuesta a incidentes y compliance. Módulos de red, Fortinet, honeypot, DDoS, forense y cyber-defense.",
    stack: "Node, TypeScript, Fortinet, policies, incident-response",
    icon: Lock,
    color: "emerald",
  },
];

const colorMap: Record<string, string> = {
  cyan:
    "border-aplat-cyan/30 bg-aplat-cyan/5 hover:border-aplat-cyan/40 hover:shadow-[0_0_50px_-5px_rgba(34,211,238,0.2)]",
  violet:
    "border-aplat-violet/30 bg-aplat-violet/5 hover:border-aplat-violet/40 hover:shadow-[0_0_50px_-5px_rgba(167,139,250,0.2)]",
  emerald:
    "border-aplat-emerald/30 bg-aplat-emerald/5 hover:border-aplat-emerald/40 hover:shadow-[0_0_50px_-5px_rgba(52,211,153,0.2)]",
};

export function CybersecurityPillars() {
  return (
    <section
      id="ciberseguridad"
      className="relative py-24 md:py-32 overflow-hidden"
      aria-labelledby="cybersecurity-heading"
    >
      <CybersecurityBackground />

      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        {/* Badge + título principal */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-aplat-cyan/30 bg-aplat-cyan/10 px-4 py-2 text-xs font-semibold text-aplat-cyan uppercase tracking-widest">
            <Shield className="w-4 h-4" />
            Prioridad estratégica
          </span>
        </motion.div>
        <motion.h2
          id="cybersecurity-heading"
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-5 text-gradient-cyan max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Ciberseguridad como prioridad
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Tres pilares que definen nuestro compromiso con la protección, el cumplimiento normativo y la respuesta ante amenazas.
        </motion.p>
        <motion.p
          className="text-aplat-muted/80 text-center text-sm max-w-xl mx-auto mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Sistemas independientes · No desplegados públicamente
        </motion.p>

        {/* Tres pilares: cards destacadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PILLARS.map((pillar, i) => (
            <motion.article
              key={pillar.id}
              className={`rounded-3xl border p-8 md:p-10 transition-all duration-300 ${colorMap[pillar.color]}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {pillar.logo ? (
                      <Image
                        src={pillar.logo}
                        alt={`Logo ${pillar.name}`}
                        width={80}
                        height={80}
                        className="object-contain p-2"
                      />
                    ) : (
                      <pillar.icon className="w-10 h-10 text-aplat-emerald/80" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-aplat-text mb-1">
                      {pillar.name}
                    </h3>
                    <p className="text-aplat-cyan/90 text-sm font-medium uppercase tracking-wider">
                      {pillar.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-aplat-muted leading-relaxed mb-6 flex-1">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-aplat-muted">
                    <pillar.icon className="w-3.5 h-3.5 text-aplat-cyan/80" />
                    {pillar.stack}
                  </span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-400/90">
                    Sistema independiente
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
