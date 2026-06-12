import Link from "next/link";

export default function NotFound() {
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
        <p
          style={{
            color: "var(--argos-blue-700, #0072c9)",
            fontSize: 48,
            fontWeight: 700,
            margin: 0,
          }}
        >
          404
        </p>
        <h1 style={{ color: "var(--argos-blue-950, #021d49)", fontSize: 22, margin: "8px 0" }}>
          Página no encontrada
        </h1>
        <p style={{ color: "var(--neutral-500, #6f7b90)", fontSize: 14, margin: "0 0 24px" }}>
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "var(--argos-blue-950, #021d49)",
            color: "#ffffff",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
