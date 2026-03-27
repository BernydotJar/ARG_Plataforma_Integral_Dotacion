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
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import {
  ArrowDownload24Regular,
  CloudArrowUp24Regular,
  Delete24Regular,
  Send24Regular,
} from "@fluentui/react-icons";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EntityAttachment, PedidoDetail } from "@/lib/dataverse/types";
import { formatDateTimeGt } from "@/lib/format/date";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type PedidoDetailResponse = {
  data: PedidoDetail;
};

type PedidoAttachmentsResponse = {
  data: EntityAttachment[];
};

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return base64;
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [detail, setDetail] = useState<PedidoDetail | null>(null);
  const [attachments, setAttachments] = useState<EntityAttachment[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [sendingSap, setSendingSap] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const loadAttachments = useCallback(async () => {
    try {
      setLoadingAttachments(true);
      const payload = await apiFetch<PedidoAttachmentsResponse>(`/api/pedidos/${id}/adjuntos`);
      setAttachments(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar los adjuntos");
    } finally {
      setLoadingAttachments(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.all([loadDetail(), loadAttachments()]);
  }, [loadAttachments, loadDetail]);

  const canSendApproval = detail?.pedido.estado === "Borrador" || detail?.pedido.estado === "Rechazado";
  const canSendSap = detail?.pedido.estado === "Aprobado";

  const sendToApproval = async () => {
    if (!detail || !canSendApproval) return;

    setError(null);
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
    if (!detail || !canSendSap) return;

    setError(null);
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

  const uploadAttachment = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > MAX_ATTACHMENT_BYTES) {
      setError("El archivo supera el máximo de 5 MB");
      return;
    }

    setError(null);
    setUploadingAttachment(true);
    try {
      const contentBase64 = await fileToBase64(selectedFile);

      await apiFetch<PedidoAttachmentsResponse>(`/api/pedidos/${id}/adjuntos`, {
        method: "POST",
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          contentBase64,
        }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Adjunto cargado</ToastTitle>
          <ToastBody>{selectedFile.name}</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Promise.all([loadDetail(), loadAttachments()]);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No se pudo cargar el adjunto";
      setError(message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    setError(null);
    setDeletingAttachmentId(attachmentId);
    try {
      await apiFetch<{ ok: boolean }>(`/api/pedidos/${id}/adjuntos/${attachmentId}`, {
        method: "DELETE",
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Adjunto eliminado</ToastTitle>
          <ToastBody>El archivo fue removido correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      await Promise.all([loadDetail(), loadAttachments()]);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No se pudo eliminar el adjunto";
      setError(message);
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const downloadAttachment = (attachment: EntityAttachment) => {
    if (!attachment.contenidoBase64) {
      setError("Este adjunto no tiene contenido descargable en este entorno.");
      return;
    }

    const link = document.createElement("a");
    link.href = `data:${attachment.mimeType};base64,${attachment.contenidoBase64}`;
    link.download = attachment.nombreArchivo;
    document.body.append(link);
    link.click();
    link.remove();
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
        <Button as="a" href="/pedidos" appearance="secondary" className="touch-action-button">
          Volver a pedidos
        </Button>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Pedido ${detail.pedido.codigo}`}
        description={`${detail.pedido.empleadoNombre} | ${detail.pedido.areaNombre}`}
      />

      {error ? (
        <Card>
          <Text className="error-text" aria-live="assertive">{error}</Text>
        </Card>
      ) : null}

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
            className="touch-action-button"
            data-tour="pedido-enviar-aprobacion"
            disabled={sendingApproval || !canSendApproval}
            onClick={sendToApproval}
          >
            {sendingApproval ? "Enviando..." : "Enviar a aprobación"}
          </Button>
          <Button
            appearance="secondary"
            icon={<CloudArrowUp24Regular />}
            className="touch-action-button"
            data-tour="pedido-enviar-sap"
            disabled={sendingSap || !canSendSap}
            onClick={sendToSap}
          >
            {sendingSap ? "Enviando..." : "Enviar a SAP"}
          </Button>
        </div>
        {!canSendApproval || !canSendSap ? (
          <Text size={200} className="muted-text">
            Flujo habilitado por estado: aprobación en {"Borrador/Rechazado"} y SAP en {"Aprobado"}.
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text weight="semibold">Detalle de pedido</Text>
        <div className="table-scroll">
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
        </div>
      </Card>

      <Card data-tour="pedido-timeline">
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
          </TableBody>
        </Table>
        </div>
      </Card>

      <Card data-tour="pedido-adjuntos">
        <Text weight="semibold">Adjuntos</Text>
        <div className="actions-row">
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <Button
            appearance="secondary"
            icon={<CloudArrowUp24Regular />}
            disabled={uploadingAttachment || !selectedFile}
            onClick={uploadAttachment}
          >
            {uploadingAttachment ? "Cargando..." : "Cargar adjunto"}
          </Button>
        </div>
        <Text size={200} className="muted-text">
          Formatos permitidos: PDF, imágenes, TXT, DOCX, XLSX. Tamaño máximo: 5 MB.
        </Text>

        {loadingAttachments ? (
          <div className="centered-state">
            <Spinner label="Cargando adjuntos..." />
          </div>
        ) : null}

        {!loadingAttachments ? (
          <div className="table-scroll">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Archivo</TableHeaderCell>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Tamaño</TableHeaderCell>
                <TableHeaderCell>Usuario</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Acciones</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell>{attachment.nombreArchivo}</TableCell>
                  <TableCell>{attachment.mimeType}</TableCell>
                  <TableCell>{formatBytes(attachment.tamanoBytes)}</TableCell>
                  <TableCell>{attachment.usuario}</TableCell>
                  <TableCell>{formatDateTimeGt(attachment.fechaCarga)}</TableCell>
                  <TableCell>
                    <div className="actions-row">
                      <Button
                        appearance="secondary"
                        className="touch-action-button"
                        icon={<ArrowDownload24Regular />}
                        onClick={() => downloadAttachment(attachment)}
                      >
                        Descargar
                      </Button>
                      <Button
                        appearance="secondary"
                        className="touch-action-button"
                        icon={<Delete24Regular />}
                        disabled={deletingAttachmentId === attachment.id}
                        onClick={() => deleteAttachment(attachment.id)}
                      >
                        {deletingAttachmentId === attachment.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {attachments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="table-empty-cell">
                    <div className="centered-state">
                      <Text size={200} className="muted-text">
                        No hay adjuntos registrados para este pedido.
                      </Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
