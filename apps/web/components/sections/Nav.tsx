"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

const LINKS = [
  { href: "/producto", labelKey: "nav.producto" },
  { href: "/servicios", labelKey: "nav.paquetes" },
  { href: "#ciberseguridad", labelKey: "nav.ciberseguridad" },
  { href: "#servicios", labelKey: "nav.servicios" },
  { href: "#como-funciona", labelKey: "nav.comoFunciona" },
  { href: "#portafolio", labelKey: "nav.portafolio" },
  { href: "#contacto", labelKey: "nav.contacto" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHasToken(!!(typeof window !== "undefined" && localStorage.getItem("guru_token")));
  }, []);

  const { t } = useLocale();

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong border-b border-white/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.08)]" : ""
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/" className="text-xl font-bold text-guru-text">
          GURU<span className="text-guru-cyan">.</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-guru-muted hover:text-guru-text transition-colors text-sm font-medium"
              >
                {t(link.labelKey)}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-guru-muted hover:text-guru-text text-sm font-medium transition-colors">
            {t("nav.login")}
          </a>
          <a
            href="#contacto"
            className="inline-flex items-center rounded-xl bg-guru-cyan/20 hover:bg-guru-cyan/30 text-guru-cyan px-4 py-2 text-sm font-medium transition-all border border-guru-cyan/30"
          >
            {t("nav.contactar")}
          </a>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-guru-muted hover:text-guru-text"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menú"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="md:hidden glass-strong border-t border-white/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block text-guru-muted hover:text-guru-text py-2"
                    onClick={() => setOpen(false)}
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={hasToken ? "/dashboard" : "/login"}
                  className="block text-guru-muted hover:text-guru-text py-2"
                  onClick={() => setOpen(false)}
                >
                  {hasToken ? "Dashboard" : t("nav.login")}
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  className="inline-flex rounded-xl bg-guru-cyan/20 text-guru-cyan px-4 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.contactar")}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
