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
  User,
  MapPin,
  Package,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Calendar,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { DashboardUserProvider, useDashboardUser } from "@/contexts/DashboardUserContext";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser, refetch } = useDashboardUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
    if (!token) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    if (!API_URL) {
      setUser({ email: "admin", role: "master" });
      return;
    }
    refetch().then((ok) => {
      if (!ok) router.replace("/login?redirect=/dashboard");
    });
  }, [mounted, router, setUser, refetch]);

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("guru_token");
    setUser(null);
    router.replace("/login");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-guru-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-guru-cyan/40 border-t-guru-cyan rounded-full animate-spin" />
          <p className="text-guru-muted text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (token && user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-guru-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-guru-cyan/40 border-t-guru-cyan rounded-full animate-spin" />
          <p className="text-guru-muted text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isClient = user.role === "client";
  const requirePasswordChange = !!(user as { requirePasswordChange?: boolean }).requirePasswordChange;

  if (isClient && requirePasswordChange) {
    return (
      <div className="min-h-screen bg-guru-deep bg-grid-perspective">
        <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
          <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between max-w-7xl">
            <Link href="/dashboard" className="flex items-center gap-2 text-guru-text font-semibold">
              <LayoutDashboard className="w-5 h-5 text-guru-cyan" />
              Mi panel
            </Link>
            <span className="text-guru-muted text-sm">{user?.email}</span>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
          <ChangePasswordForm />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-guru-deep bg-grid-perspective">
      <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-guru-muted hover:text-guru-text transition-colors p-1"
              title="Volver al sitio"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-guru-text font-semibold">
              <LayoutDashboard className="w-5 h-5 text-guru-cyan" />
              {isClient ? "Mi panel" : "GURU Dashboard"}
            </Link>
            {!isClient && (
              <>
                <Link
                  href="/dashboard/presence"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Presence
                </Link>
                <Link
                  href="/dashboard/assets"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Activos
                </Link>
                <Link
                  href="/dashboard/security"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Security
                </Link>
                <Link
                  href="/dashboard/gdpr"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  GDPR
                </Link>
                <Link
                  href="/dashboard/incidents"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Incidentes
                </Link>
                <Link
                  href="/dashboard/slots"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Slots
                </Link>
                <Link
                  href="/dashboard/reports"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Reportes
                </Link>
                <Link
                  href="/dashboard/commerce"
                  className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Commerce
                </Link>
              </>
            )}
            {isClient && (
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-guru-muted hover:text-guru-text text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                Perfil
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-guru-muted text-sm">
              <Shield className="w-4 h-4 text-guru-emerald/80" />
              {user.email}
              {isClient && <span className="text-guru-cyan/80">(cliente)</span>}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-guru-muted hover:text-red-400 border border-white/10 px-3 py-2 text-sm font-medium transition-all"
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardUserProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardUserProvider>
  );
}
