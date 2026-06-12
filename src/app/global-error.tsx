"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Reemplaza el layout raíz cuando este falla: debe renderizar html/body propios
// y no depender de globals.css ni providers.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[argos] fatal error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7faff",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ textAlign: "center", padding: 24, maxWidth: 460 }}>
          <h1 style={{ color: "#021d49", fontSize: 22, marginBottom: 8 }}>
            La aplicación encontró un error
          </h1>
          <p style={{ color: "#6f7b90", fontSize: 14, marginBottom: 8 }}>
            Recarga la página para continuar. Si el problema persiste, contacta al equipo de
            soporte.
          </p>
          {error.digest ? (
            <p style={{ color: "#6f7b90", fontSize: 12, marginBottom: 16 }}>
              Referencia del error: <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#021d49",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </main>
      </body>
    </html>
  );
}
