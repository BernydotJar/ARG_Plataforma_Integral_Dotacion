"use client";

import {
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import { formatDateTimeGt } from "@/lib/format/date";
import type { TicketDetail } from "@/lib/dataverse/types";

type TicketDetailResponse = {
  data: TicketDetail;
};

const statusOptions = ["Abierto", "EnProgreso", "Resuelto", "Cerrado"];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState("Abierto");
  const [tecnicoAsignado, setTecnicoAsignado] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await apiFetch<TicketDetailResponse>(`/api/mantenimiento/tickets/${id}`);
      setDetail(payload.data);
      setEstado(payload.data.ticket.estado || "Abierto");
      setTecnicoAsignado(payload.data.ticket.tecnicoAsignado || "");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveChanges = async () => {
    if (!detail) return;

    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/api/mantenimiento/tickets/${detail.ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          estado,
          tecnicoAsignado,
        }),
      });

      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo actualizar ticket");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner label="Cargando ticket..." />;
  }

  if (!detail) {
    return (
      <Card>
        <Text className="error-text">{error || "Ticket no encontrado"}</Text>
        <Link href="/mantenimiento">Volver a mantenimiento</Link>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Ticket ${detail.ticket.codigo}`}
        description={`${detail.ticket.equipoNombre} | Prioridad ${detail.ticket.prioridad}`}
      />

      <Card>
        <div className="module-card-title-row">
          <StatusBadge status={detail.ticket.estado} />
          <Text>{formatDateTimeGt(detail.ticket.fechaReporte)}</Text>
        </div>
        <Text>{detail.ticket.descripcion}</Text>
      </Card>

      <Card className="form-grid two-col">
        <Field label="Estado">
          <Dropdown value={estado} selectedOptions={[estado]} onOptionSelect={(_, data) => setEstado(String(data.optionValue))}>
            {statusOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Técnico asignado">
          <Input value={tecnicoAsignado} onChange={(_, data) => setTecnicoAsignado(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="primary" onClick={saveChanges} disabled={saving}>
            {saving ? <Spinner size="tiny" /> : "Guardar cambios"}
          </Button>
        </div>
      </Card>

      <Card>
        <Text weight="semibold">Actividades</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Responsable</TableHeaderCell>
              <TableHeaderCell>Descripción</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.actividades.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{formatDateTimeGt(activity.fechaActividad)}</TableCell>
                <TableCell>{activity.responsable}</TableCell>
                <TableCell>{activity.descripcion}</TableCell>
              </TableRow>
            ))}
            {detail.actividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>Sin actividades registradas.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <Text weight="semibold">Timeline / Auditoría</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Mensaje</TableHeaderCell>
              <TableHeaderCell>Usuario</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.historial.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{formatDateTimeGt(event.fecha)}</TableCell>
                <TableCell>{event.tipo}</TableCell>
                <TableCell>{event.mensaje}</TableCell>
                <TableCell>{event.usuario}</TableCell>
              </TableRow>
            ))}
            {detail.historial.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>Sin eventos de auditoría.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
