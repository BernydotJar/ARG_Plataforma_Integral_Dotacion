import { Badge } from "@fluentui/react-components";

const statusStyleMap: Record<
  string,
  {
    appearance: "filled" | "ghost" | "outline" | "tint";
    color: "brand" | "danger" | "important" | "informative" | "subtle" | "success" | "warning";
  }
> = {
  Borrador: { appearance: "outline", color: "informative" },
  EnAprobacion: { appearance: "tint", color: "warning" },
  Aprobado: { appearance: "filled", color: "success" },
  EnviadoSAP: { appearance: "filled", color: "brand" },
  Rechazado: { appearance: "filled", color: "danger" },
  Abierto: { appearance: "tint", color: "warning" },
  Abierta: { appearance: "tint", color: "warning" },
  EnProceso: { appearance: "tint", color: "important" },
  Cerrado: { appearance: "filled", color: "success" },
  Cerrada: { appearance: "filled", color: "success" },
  PendienteAprobacion: { appearance: "tint", color: "warning" },
  Registrado: { appearance: "outline", color: "informative" },
  Conforme: { appearance: "filled", color: "success" },
  NoConforme: { appearance: "filled", color: "danger" },
};

export function StatusBadge({ status }: { status?: string }) {
  const style = statusStyleMap[status || ""] || { appearance: "outline", color: "informative" };
  return (
    <Badge appearance={style.appearance} color={style.color}>
      {status || "Sin estado"}
    </Badge>
  );
}
