import { Badge } from "@fluentui/react-components";

type BadgeStyle = {
  appearance: "filled" | "ghost" | "outline" | "tint";
  color: "brand" | "danger" | "important" | "informative" | "subtle" | "success" | "warning";
  label?: string;
};

const statusStyleMap: Record<string, BadgeStyle> = {
  Borrador: { appearance: "outline", color: "informative" },
  EnAprobacion: { appearance: "tint", color: "warning", label: "En aprobación" },
  Aprobado: { appearance: "filled", color: "success" },
  EnviadoSAP: { appearance: "filled", color: "brand", label: "Enviado SAP" },
  Rechazado: { appearance: "filled", color: "danger" },

  Registrado: { appearance: "outline", color: "informative" },
  PendienteAprobacion: { appearance: "tint", color: "warning", label: "Pendiente aprobación" },

  Abierto: { appearance: "tint", color: "warning" },
  EnProceso: { appearance: "tint", color: "important", label: "En proceso" },
  EnProgreso: { appearance: "tint", color: "important", label: "En progreso" },
  Resuelto: { appearance: "filled", color: "success" },
  Cerrado: { appearance: "filled", color: "success" },

  Abierta: { appearance: "tint", color: "warning" },
  Cerrada: { appearance: "filled", color: "success" },

  NoConforme: { appearance: "filled", color: "danger", label: "No conforme" },
};

export function StatusBadge({ status }: { status?: string }) {
  const style = statusStyleMap[status || ""] || { appearance: "outline", color: "informative" };
  const displayLabel = style.label || status || "Sin estado";

  return (
    <Badge appearance={style.appearance} color={style.color}>
      {displayLabel}
    </Badge>
  );
}
