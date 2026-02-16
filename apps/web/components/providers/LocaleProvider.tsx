"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

type LocaleContextValue = { locale: Locale; t: (key: string) => string };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: (key: string) => translations[locale][key] ?? key,
    }),
    [locale]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
