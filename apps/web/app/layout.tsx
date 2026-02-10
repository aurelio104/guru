import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APlat · Servicios digitales de última generación",
  description:
    "Plataforma inteligente: análisis, contexto, aprendizaje. Desarrollamos soluciones digitales con tecnología de vanguardia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-aplat-deep text-aplat-text font-sans bg-grid-perspective">
        <div className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
