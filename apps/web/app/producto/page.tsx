"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Shield, FileText, ShoppingCart, Check, ArrowRight } from "lucide-react";

export default function ProductoPage() {
  return (
    <div className="min-h-screen bg-aplat-deep text-aplat-text">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text text-sm mb-8">
          ← Volver al inicio
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-aplat-text mb-4">
            APlat Ecosistema
          </h1>
          <p className="text-lg text-aplat-muted max-w-2xl mx-auto">
            Servicios digitales listos para tu empresa: presencia, ciberseguridad, reportes, commerce y más.
            Un solo proveedor, un solo contrato, suscripción mensual clara.
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            { icon: MapPin, name: "Presence", desc: "Check-in BLE/NFC, portal WiFi, ocupación, alertas" },
            { icon: Shield, name: "Ciberseguridad", desc: "APlat Security, GDPR, incidentes, verificación firma" },
            { icon: FileText, name: "Reportes", desc: "Subida Excel, análisis, gráficos" },
            { icon: ShoppingCart, name: "Commerce", desc: "Catálogo, pedidos, notificaciones WhatsApp" },
          ].map((item, i) => (
            <div
              key={item.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <item.icon className="w-8 h-8 text-aplat-cyan mb-3" />
              <h2 className="text-lg font-semibold text-aplat-text mb-1">{item.name}</h2>
              <p className="text-sm text-aplat-muted">{item.desc}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-aplat-cyan/30 bg-aplat-cyan/5 p-8 mb-12"
        >
          <h2 className="text-xl font-semibold text-aplat-text mb-4">Paquetes y membresías</h2>
          <ul className="space-y-2 text-aplat-muted mb-6">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-aplat-emerald" />
              Servicios del ecosistema APlat: elige solo lo que necesitas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-aplat-emerald" />
              Precios a convenir; contáctanos para cotización
            </li>
          </ul>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan text-aplat-deep font-semibold px-5 py-2.5 hover:bg-aplat-cyan/90 transition-colors"
          >
            Ver servicios y armar paquete
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-aplat-muted text-sm mb-4">
            ¿Necesitas una demo o cotización a medida?
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-5 py-2.5 text-aplat-text text-sm font-medium transition-colors"
          >
            Contactar
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
