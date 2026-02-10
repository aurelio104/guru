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
      {/* Fondo sutil: orbes + grid muy suave */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aplat-violet/8 rounded-full blur-[150px] animate-neon-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aplat-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />
      </div>

      <div className="relative container mx-auto px-6 max-w-6xl">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-aplat-cyan/20 bg-aplat-cyan/5 px-4 py-1.5 text-xs font-medium text-aplat-cyan uppercase tracking-wider">
            Servicios
          </span>
        </motion.div>
        <motion.h2
          id="services-heading"
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-cyan transition-reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          Soluciones a medida
        </motion.h2>
        <motion.p
          className="text-aplat-muted text-center text-lg max-w-2xl mx-auto mb-16 transition-reveal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Plataformas web, integraciones y automatización desplegadas en la nube.
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
                className={`glass glass-strong rounded-2xl p-6 mirror-shine border transition-all duration-300 hover:border-white/20 ${colorMap[service.color as keyof typeof colorMap]}`}
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
