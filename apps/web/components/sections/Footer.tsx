"use client";

import { motion } from "framer-motion";

const FOOTER_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#portafolio", label: "Portafolio" },
  { href: "#contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 py-12 bg-aplat-surface/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.a
            href="#"
            className="text-xl font-bold text-aplat-text"
            whileHover={{ opacity: 0.8 }}
          >
            APlat<span className="text-aplat-cyan">.</span>
          </motion.a>
          <nav aria-label="Enlaces del pie">
            <ul className="flex flex-wrap justify-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-aplat-muted hover:text-aplat-text text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-aplat-muted text-sm">
            Servicios digitales de última generación · TypeScript · Node 24 ·
            Tailwind 4 · Vercel & Koyeb
          </p>
        </div>
      </div>
    </footer>
  );
}
