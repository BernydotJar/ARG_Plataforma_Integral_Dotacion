import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";
import { PwaRegister } from "@/components/pwa/PwaRegister";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const repoBasePath = process.env.NODE_ENV === "production" ? "/ARG_Plataforma_Integral_Dotacion" : "";

export const metadata: Metadata = {
  title: "ARGOS - Plataforma Integral",
  description: "Portal corporativo para Dotación, Inventario, Calidad y Mantenimiento",
  manifest: `${repoBasePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARGOS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${repoBasePath}/icons/argos-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${repoBasePath}/icons/argos-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${repoBasePath}/icons/argos-192.png`, sizes: "192x192", type: "image/png" }],
    shortcut: [`${repoBasePath}/icons/argos-192.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#021d49",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <AppProviders>
          <PwaRegister basePath={repoBasePath} />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
