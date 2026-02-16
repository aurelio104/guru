"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Shield, FileText, ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function ProductoPage() {
  const { t } = useLocale();
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
            {t("producto.title")}
          </h1>
          <p className="text-lg text-aplat-muted max-w-2xl mx-auto">
            {t("producto.subtitle")}
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            { icon: MapPin, nameKey: "producto.item.presence", descKey: "producto.item.presence.desc" },
            { icon: Shield, nameKey: "producto.item.ciberseguridad", descKey: "producto.item.ciberseguridad.desc" },
            { icon: FileText, nameKey: "producto.item.reportes", descKey: "producto.item.reportes.desc" },
            { icon: ShoppingCart, nameKey: "producto.item.commerce", descKey: "producto.item.commerce.desc" },
          ].map((item) => (
            <div
              key={item.nameKey}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <item.icon className="w-8 h-8 text-aplat-cyan mb-3" />
              <h2 className="text-lg font-semibold text-aplat-text mb-1">{t(item.nameKey)}</h2>
              <p className="text-sm text-aplat-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-aplat-cyan/30 bg-aplat-cyan/5 p-8 mb-12"
        >
          <h2 className="text-xl font-semibold text-aplat-text mb-4">{t("producto.paquetes.title")}</h2>
          <ul className="space-y-2 text-aplat-muted mb-6">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-aplat-emerald" />
              {t("producto.paquetes.item1")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-aplat-emerald" />
              {t("producto.paquetes.item2")}
            </li>
          </ul>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan text-aplat-deep font-semibold px-5 py-2.5 hover:bg-aplat-cyan/90 transition-colors"
          >
            {t("producto.cta")}
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
            {t("producto.contact.cta")}
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:bg-white/5 px-5 py-2.5 text-aplat-text text-sm font-medium transition-colors"
          >
            {t("nav.contactar")}
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
