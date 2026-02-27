"use client";

import {
  Badge,
  Card,
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
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { InspeccionDetail } from "@/lib/dataverse/types";

type DetailResponse = {
  data: InspeccionDetail;
};

export default function InspeccionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<InspeccionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<DetailResponse>(`/api/calidad/${id}`);
        setDetail(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar la inspección");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return <Spinner label="Cargando inspección..." />;
  }

  if (!detail) {
    return (
      <Card>
        <Text className="error-text">{error || "Inspección no encontrada"}</Text>
        <Link href="/calidad">Volver a calidad</Link>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Inspección ${detail.inspeccion.codigo}`}
        description={`Lote ${detail.inspeccion.lote} | Inspector ${detail.inspeccion.inspector}`}
      />

      <Card>
        <div className="module-card-title-row">
          <Badge appearance="filled">Resultado {detail.inspeccion.resultado}</Badge>
          <StatusBadge status={detail.inspeccion.estado} />
        </div>
        <Text>{detail.inspeccion.observacion || "Sin observaciones"}</Text>
      </Card>

      <Card>
        <Text weight="semibold">Checklist</Text>
        {detail.checklist.length === 0 ? (
          <Text size={200} className="muted-text">
            Aún no hay checklist registrado para esta inspección.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Criterio</TableHeaderCell>
                <TableHeaderCell>Cumple</TableHeaderCell>
                <TableHeaderCell>Observación</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.checklist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.criterioChecklistId}</TableCell>
                  <TableCell>{entry.cumple ? "Sí" : "No"}</TableCell>
                  <TableCell>{entry.observacion || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <Text weight="semibold">Defectos</Text>
        {detail.defectos.length === 0 ? (
          <Text size={200} className="muted-text">
            No se han registrado defectos para esta inspección.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Severidad</TableHeaderCell>
                <TableHeaderCell>Descripción</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.defectos.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.tipoDefectoId}</TableCell>
                  <TableCell>{entry.severidadId}</TableCell>
                  <TableCell>{entry.descripcion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
                <TableCell>{new Date(event.fecha).toLocaleString("es-CO")}</TableCell>
                <TableCell>{event.tipo}</TableCell>
                <TableCell>{event.mensaje}</TableCell>
                <TableCell>{event.usuario}</TableCell>
              </TableRow>
            ))}
            {detail.historial.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>Sin eventos registrados.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
