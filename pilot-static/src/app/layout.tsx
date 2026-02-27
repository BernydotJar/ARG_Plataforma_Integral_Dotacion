import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ARGOS - Plataforma Integral",
  description: "Portal corporativo para Dotación, Inventario, Calidad y Mantenimiento",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
