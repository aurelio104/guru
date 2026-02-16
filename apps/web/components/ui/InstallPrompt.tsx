"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "aplat-pwa-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && !installed && deferredPrompt && (
        <motion.div
          role="dialog"
          aria-label="Instalar aplicación"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="glass glass-strong rounded-2xl border border-white/10 shadow-xl p-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- static icon */}
            <img src="/icon.svg" alt="" className="w-12 h-12 shrink-0" width={48} height={48} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-aplat-text">Instalar GURU</p>
              <p className="text-xs text-aplat-muted">Abrir como app y usar sin depender del navegador.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan px-4 py-2 text-sm font-semibold border border-aplat-cyan/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                Instalar
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-2 text-aplat-muted hover:text-aplat-text rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
