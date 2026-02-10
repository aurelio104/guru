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
      className="relative py-24 overflow-hidden"
      aria-labelledby="services-heading"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aplat-violet/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.h2
          id="services-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Servicios
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Soluciones digitales de última generación, desplegadas en la nube.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card3D
                className={`glass glass-strong rounded-2xl p-6 mirror-shine border ${colorMap[service.color as keyof typeof colorMap]}`}
              >
                <service.icon className="w-10 h-10 mb-4" />
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
