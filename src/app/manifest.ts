import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARGOS - Plataforma Integral",
    short_name: "ARGOS",
    description: "Portal corporativo para Dotacion, Inventario, Calidad y Mantenimiento",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f9ff",
    theme_color: "#021d49",
    lang: "es-GT",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/argos-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/argos-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
