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
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TicketDetail } from "@/lib/dataverse/types";
import { formatDateTimeGt } from "@/lib/format/date";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

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

  const hasChanges = useMemo(() => {
    if (!detail) return false;
    return estado !== detail.ticket.estado || tecnicoAsignado !== (detail.ticket.tecnicoAsignado || "");
  }, [detail, estado, tecnicoAsignado]);

  const saveChanges = async () => {
    if (!detail || !hasChanges) return;

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
    return (
      <div className="centered-state">
        <Spinner label="Cargando ticket..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card>
        <Text className="error-text">{error || "Ticket no encontrado"}</Text>
        <Button as="a" href="/mantenimiento" appearance="secondary" className="touch-action-button">
          Volver a mantenimiento
        </Button>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Ticket ${detail.ticket.codigo}`}
        description={`${detail.ticket.equipoNombre} | Prioridad ${detail.ticket.prioridad}`}
      />

      {error ? (
        <Card>
          <Text className="error-text" aria-live="assertive">{error}</Text>
        </Card>
      ) : null}

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
          <Button appearance="primary" onClick={saveChanges} disabled={saving || !hasChanges}>
            {saving ? <Spinner size="tiny" /> : "Guardar cambios"}
          </Button>
          {!hasChanges ? (
            <Text size={200} className="muted-text">Sin cambios pendientes.</Text>
          ) : null}
        </div>
      </Card>

      <Card>
        <Text weight="semibold">Actividades</Text>
        <div className="table-scroll">
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
        </div>
      </Card>

      <Card>
        <Text weight="semibold">Timeline / Auditoría</Text>
        <div className="table-scroll">
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
        </div>
      </Card>
    </div>
  );
}
