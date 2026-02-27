"use client";

import {
  Badge,
  Button,
  Card,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  useToastController,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import { CloudArrowUp24Regular, Send24Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { PedidoDetail } from "@/lib/dataverse/types";

type PedidoDetailResponse = {
  data: PedidoDetail;
};

export default function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [detail, setDetail] = useState<PedidoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [sendingSap, setSendingSap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await apiFetch<PedidoDetailResponse>(`/api/pedidos/${id}`);
      setDetail(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar el detalle");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const sendToApproval = async () => {
    if (!detail) return;

    setSendingApproval(true);
    try {
      await apiFetch("/api/flows/aprobacion/pedido", {
        method: "POST",
        body: JSON.stringify({ pedidoId: detail.pedido.id }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Pedido enviado a aprobación</ToastTitle>
          <ToastBody>La solicitud de aprobación fue disparada correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      await loadDetail();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No se pudo enviar a aprobación";
      setError(message);
    } finally {
      setSendingApproval(false);
    }
  };

  const sendToSap = async () => {
    if (!detail) return;

    setSendingSap(true);
    try {
      await apiFetch("/api/flows/sap/enviar-pedido", {
        method: "POST",
        body: JSON.stringify({ pedidoId: detail.pedido.id }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Pedido enviado a SAP</ToastTitle>
          <ToastBody>La integración SAP fue solicitada y registrada.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      await loadDetail();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No se pudo enviar a SAP";
      setError(message);
    } finally {
      setSendingSap(false);
    }
  };

  if (loading) {
    return (
      <div className="centered-state">
        <Spinner label="Cargando pedido..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card>
        <Text className="error-text">{error || "Pedido no encontrado"}</Text>
        <Link href="/pedidos">Volver a pedidos</Link>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Pedido ${detail.pedido.codigo}`}
        description={`${detail.pedido.empleadoNombre} | ${detail.pedido.areaNombre}`}
      />

      <Card>
        <div className="module-card-title-row">
          <StatusBadge status={detail.pedido.estado} />
          <Badge appearance="outline">Prioridad {detail.pedido.prioridad}</Badge>
        </div>
        <Text>{detail.pedido.observacion || "Sin observaciones"}</Text>

        <div className="actions-row">
          <Button
            appearance="primary"
            icon={<Send24Regular />}
            disabled={sendingApproval}
            onClick={sendToApproval}
          >
            {sendingApproval ? "Enviando..." : "Enviar a aprobación"}
          </Button>
          <Button
            appearance="secondary"
            icon={<CloudArrowUp24Regular />}
            disabled={sendingSap}
            onClick={sendToSap}
          >
            {sendingSap ? "Enviando..." : "Enviar a SAP"}
          </Button>
        </div>
      </Card>

      <Card>
        <Text weight="semibold">Detalle de pedido</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Ítem</TableHeaderCell>
              <TableHeaderCell>Talla</TableHeaderCell>
              <TableHeaderCell>Cantidad</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.detalles.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.itemNombre}</TableCell>
                <TableCell>{item.talla}</TableCell>
                <TableCell>{item.cantidad}</TableCell>
              </TableRow>
            ))}
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
                <TableCell>{new Date(event.fecha).toLocaleString("es-CO")}</TableCell>
                <TableCell>{event.tipo}</TableCell>
                <TableCell>{event.mensaje}</TableCell>
                <TableCell>{event.usuario}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <Text weight="semibold">Adjuntos</Text>
        <Text size={200} className="muted-text">
          MVP: cargar archivos en Dataverse Note/Attachment. Esta pantalla ya reserva el espacio funcional para la
          integración.
        </Text>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
