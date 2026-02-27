import { Inter } from "next/font/google";
import type { Metadata } from "next";

import { AppProviders } from "../components/providers/AppProviders";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ARGOS - Plataforma Integral",
  description: "Pilot estático alineado al portal main/dev.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
