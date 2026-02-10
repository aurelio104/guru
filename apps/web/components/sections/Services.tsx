"use client";

import { motion } from "framer-motion";
import { Card3D } from "@/components/ui/Card3D";
import {
  Globe,
  Plane,
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  Plug,
  Search,
} from "lucide-react";

const SERVICES = [
  {
    icon: Globe,
    title: "Plataformas web y apps a medida",
    desc: "Sitios corporativos, landing pages, PWAs e intranets con roles y permisos.",
    color: "cyan",
  },
  {
    icon: Plane,
    title: "Venta y reservas online",
    desc: "Motores de búsqueda y reserva con GDS (KIU, Amadeus) y pasarelas de pago.",
    color: "violet",
  },
  {
    icon: LayoutDashboard,
    title: "Centros de mando y dashboards",
    desc: "Métricas, gráficos y alertas en tiempo real (incl. WhatsApp).",
    color: "emerald",
  },
  {
    icon: ShieldCheck,
    title: "Control de acceso y recepción",
    desc: "Registro con OCR de cédulas, carnets QR e historial para oficinas.",
    color: "cyan",
  },
  {
    icon: FileSpreadsheet,
    title: "Automatización de datos y reportes",
    desc: "Carga de Excel, extracción inteligente y asistente con IA.",
    color: "violet",
  },
  {
    icon: Plug,
    title: "Integraciones y APIs",
    desc: "APIs REST e integración con GDS, Hikvision, WhatsApp, bancos.",
    color: "emerald",
  },
  {
    icon: Search,
    title: "Consultoría y auditoría",
    desc: "Seguridad, pentest, DNS y documentación técnica.",
    color: "cyan",
  },
];

const colorMap = {
  cyan: "text-aplat-cyan border-aplat-cyan/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]",
  violet: "text-aplat-violet border-aplat-violet/30 hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]",
  emerald: "text-aplat-emerald border-aplat-emerald/30 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]",
};

export function Services() {
  return (
    <section
      id="servicios"
      className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden min-h-0"
      aria-labelledby="services-heading"
    >
      {/* Fondo: mismo esquema (responsive, z-0) */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-aplat-surface/40" />
        <div className="absolute top-0 right-0 w-[45vmax] h-[45vmax] max-w-[600px] max-h-[600px] bg-aplat-violet/8 rounded-full blur-[20vmin] animate-neon-pulse" />
        <div className="absolute bottom-0 left-0 w-[35vmax] h-[35vmax] max-w-[500px] max-h-[500px] bg-aplat-cyan/5 rounded-full blur-[18vmin]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px), linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)",
            backgroundSize: "clamp(24px, 4vw, 48px) clamp(24px, 4vw, 48px)",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl w-full">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-cyan/25 bg-aplat-cyan/5 px-4 py-1.5 text-xs font-semibold text-aplat-cyan uppercase tracking-widest">
            Servicios
          </span>
        </motion.div>
        <motion.h2
          id="services-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 sm:mb-5 text-gradient-cyan max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Soluciones a medida
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Plataformas web, integraciones y automatización desplegadas en la nube.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D
                className={`glass glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mirror-shine border transition-all duration-300 hover:border-white/20 min-w-0 ${colorMap[service.color as keyof typeof colorMap]}`}
              >
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <service.icon className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold text-aplat-text mb-2">
                  {service.title}
                </h3>
                <p className="text-aplat-muted text-sm leading-relaxed">
                  {service.desc}
                </p>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
