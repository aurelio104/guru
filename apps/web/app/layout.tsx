import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { LocaleProvider } from "@/components/providers/LocaleProvider";

export const metadata: Metadata = {
  title: "GURU Platform · Servicios digitales de última generación",
  description:
    "Plataforma inteligente: análisis, contexto, aprendizaje. Desarrollamos soluciones digitales con tecnología de vanguardia.",
  metadataBase: new URL("https://aplat.vercel.app"),
  openGraph: {
    title: "GURU Platform",
    description: "Plataforma inteligente: análisis, contexto, aprendizaje.",
    siteName: "GURU",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GURU",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png", sizes: "512x512" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.png", type: "image/png", sizes: "512x512" }, { url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030306",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") === "en" ? "en" : "es") as "es" | "en";
  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-aplat-deep text-aplat-text font-sans bg-grid-perspective">
        <LocaleProvider locale={locale}>
          <VisitTracker />
          <div className="relative min-h-screen">{children}</div>
          <InstallPrompt />
        </LocaleProvider>
      </body>
    </html>
  );
}
