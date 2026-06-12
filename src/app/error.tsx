"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[argos] unhandled error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6, 24px)",
        background: "var(--neutral-50, #f7faff)",
      }}
    >
      <section
        style={{
          maxWidth: 460,
          width: "100%",
          background: "var(--surface, #ffffff)",
          borderRadius: 16,
          boxShadow: "var(--shadow-soft, 0 8px 24px rgba(2, 29, 73, 0.08))",
          padding: "var(--space-8, 32px)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 40, margin: 0 }} aria-hidden>
          ⚠️
        </p>
        <h1 style={{ color: "var(--argos-blue-950, #021d49)", fontSize: 22, margin: "12px 0 8px" }}>
          Algo salió mal
        </h1>
        <p style={{ color: "var(--neutral-500, #6f7b90)", fontSize: 14, margin: "0 0 8px" }}>
          Ocurrió un error inesperado. Puedes intentar de nuevo; si el problema persiste, contacta
          al equipo de soporte.
        </p>
        {error.digest ? (
          <p style={{ color: "var(--neutral-500, #6f7b90)", fontSize: 12, margin: "0 0 16px" }}>
            Referencia del error: <code>{error.digest}</code>
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "var(--argos-blue-950, #021d49)",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <Link
            href="/"
            style={{
              color: "var(--argos-blue-950, #021d49)",
              border: "1px solid var(--neutral-300, #c9d4e6)",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
