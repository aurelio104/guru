import type { Metadata, Viewport } from "next";
import "./globals.css";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

export const metadata: Metadata = {
  title: "APlat · Servicios digitales de última generación",
  description:
    "Plataforma inteligente: análisis, contexto, aprendizaje. Desarrollamos soluciones digitales con tecnología de vanguardia.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "APlat",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030306",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-aplat-deep text-aplat-text font-sans bg-grid-perspective">
        <VisitTracker />
        <div className="relative min-h-screen">
          {children}
        </div>
        <InstallPrompt />
      </body>
    </html>
  );
}
