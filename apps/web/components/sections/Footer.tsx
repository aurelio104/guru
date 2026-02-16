"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";

const FOOTER_LINKS = [
  { href: "#ciberseguridad", labelKey: "nav.ciberseguridad" },
  { href: "#servicios", labelKey: "nav.servicios" },
  { href: "#como-funciona", labelKey: "nav.comoFunciona" },
  { href: "#portafolio", labelKey: "nav.portafolio" },
  { href: "#contacto", labelKey: "nav.contacto" },
];

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="relative border-t border-white/10 py-12 bg-aplat-surface/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.a
            href="/"
            className="text-xl font-bold text-aplat-text"
            whileHover={{ opacity: 0.8 }}
          >
            GURU<span className="text-aplat-cyan">.</span>
          </motion.a>
          <nav aria-label="Enlaces del pie">
            <ul className="flex flex-wrap justify-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-aplat-muted hover:text-aplat-text text-sm transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-aplat-muted text-sm">
            {t("footer.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
