"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Shield,
  ArrowLeft,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
    if (!token) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    if (!API_URL) {
      setUser({ email: "admin", role: "master" });
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) setUser(data.user);
        else router.replace("/login?redirect=/dashboard");
      })
      .catch(() => router.replace("/login?redirect=/dashboard"));
  }, [mounted, router]);

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("aplat_token");
    router.replace("/login");
  }

  if (!mounted || (!user && typeof window !== "undefined" && !localStorage.getItem("aplat_token"))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aplat-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-aplat-cyan/40 border-t-aplat-cyan rounded-full animate-spin" />
          <p className="text-aplat-muted text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-aplat-deep bg-grid-perspective">
      <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-aplat-muted hover:text-aplat-text transition-colors p-1"
              title="Volver al sitio"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-aplat-text font-semibold">
              <LayoutDashboard className="w-5 h-5 text-aplat-cyan" />
              APlat Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-aplat-muted text-sm">
              <Shield className="w-4 h-4 text-aplat-emerald/80" />
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-aplat-muted hover:text-red-400 border border-white/10 px-3 py-2 text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
