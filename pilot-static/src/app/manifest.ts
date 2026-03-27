import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const repo = "ARG_Plataforma_Integral_Dotacion";
const basePath = process.env.NODE_ENV === "production" ? `/${repo}` : "";

export default function manifest(): MetadataRoute.Manifest {
  const iconPrefix = basePath ? `${basePath}/icons` : "/icons";

  return {
    name: "ARGOS - Plataforma Integral",
    short_name: "ARGOS",
    description: "Portal corporativo para Dotacion, Inventario, Calidad y Mantenimiento",
    start_url: basePath ? `${basePath}/` : "/",
    scope: basePath ? `${basePath}/` : "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f9ff",
    theme_color: "#021d49",
    lang: "es-GT",
    categories: ["business", "productivity"],
    icons: [
      {
        src: `${iconPrefix}/argos-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${iconPrefix}/argos-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
