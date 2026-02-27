import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARGOS Pilot - Plataforma Integral",
  description: "Pilot estático en GitHub Pages para validación visual.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
