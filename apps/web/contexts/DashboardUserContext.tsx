"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type DashboardUser = {
  email?: string;
  role?: string;
  sub?: string;
  requirePasswordChange?: boolean;
} | null;

const DashboardUserContext = createContext<{
  user: DashboardUser;
  setUser: (u: DashboardUser) => void;
  refetch: () => Promise<boolean>;
}>({ user: null, setUser: () => {}, refetch: () => Promise.resolve(false) });

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

export function DashboardUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DashboardUser>(null);

  const refetch = useCallback(async (): Promise<boolean> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
    if (!token || !API_URL) return false;
    try {
      const r = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (data.ok && data.user) {
        setUser(data.user);
        return true;
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  return (
    <DashboardUserContext.Provider value={{ user, setUser, refetch }}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}
