"use client";

import { motion } from "framer-motion";
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
      className="relative py-24 overflow-hidden"
      aria-labelledby="services-heading"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aplat-violet/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="services-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Servicios
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Soluciones digitales de última generación, desplegadas en la nube.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              className={`glass glass-strong rounded-2xl p-6 mirror-shine border transition-all duration-300 ${colorMap[service.color as keyof typeof colorMap]}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <service.icon className="w-10 h-10 mb-4" />
              <h3 className="text-lg font-semibold text-aplat-text mb-2">
                {service.title}
              </h3>
              <p className="text-aplat-muted text-sm leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
