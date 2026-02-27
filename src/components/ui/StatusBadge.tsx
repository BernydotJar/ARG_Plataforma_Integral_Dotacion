import { Badge } from "@fluentui/react-components";

const statusAppearance: Record<string, "filled" | "ghost" | "outline" | "tint"> = {
  Borrador: "outline",
  EnAprobacion: "tint",
  Aprobado: "filled",
  EnviadoSAP: "filled",
  Rechazado: "ghost",
  Abierto: "tint",
  Cerrado: "filled",
  PendienteAprobacion: "tint",
  Registrado: "outline",
};

export function StatusBadge({ status }: { status?: string }) {
  return <Badge appearance={statusAppearance[status || ""] || "outline"}>{status || "Sin estado"}</Badge>;
}
