"use client";

import {
  Button,
  Card,
  Field,
  Input,
  Spinner,
  Text,
  Textarea,
  useToastController,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import { useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { MovimientoInventario } from "@/lib/dataverse/types";

type AjusteResponse = {
  data: MovimientoInventario;
};

export default function AjusteInventarioPage() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [itemNombre, setItemNombre] = useState("");
  const [bodegaNombre, setBodegaNombre] = useState("Bodega Principal");
  const [ubicacionNombre, setUbicacionNombre] = useState("Pasillo A1");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAjuste, setLastAjuste] = useState<MovimientoInventario | null>(null);
  const [sendingApproval, setSendingApproval] = useState(false);

  const createAjuste = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = await apiFetch<AjusteResponse>("/api/inventario/ajuste", {
        method: "POST",
        body: JSON.stringify({
          itemNombre,
          bodegaNombre,
          ubicacionNombre,
          cantidad: Number(cantidad),
          motivo,
        }),
      });

      setLastAjuste(payload.data);
      dispatchToast(
        <Toast>
          <ToastTitle>Ajuste registrado</ToastTitle>
          <ToastBody>El ajuste quedó pendiente de aprobación.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear el ajuste");
    } finally {
      setSaving(false);
    }
  };

  const sendApproval = async () => {
    if (!lastAjuste) return;

    setSendingApproval(true);
    setError(null);

    try {
      await apiFetch("/api/flows/aprobacion/ajuste", {
        method: "POST",
        body: JSON.stringify({ movimientoId: lastAjuste.id }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Ajuste enviado a aprobación</ToastTitle>
          <ToastBody>Flow de aprobación ejecutado correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      setLastAjuste({
        ...lastAjuste,
        estado: "EnAprobacion",
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo enviar a aprobación");
    } finally {
      setSendingApproval(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Ajuste de inventario"
        description="Crea ajustes puntuales y dispara el flujo de aprobación"
      />

      <Card className="form-grid two-col">
        <Field label="Ítem" required>
          <Input value={itemNombre} onChange={(_, data) => setItemNombre(data.value)} />
        </Field>
        <Field label="Cantidad" required>
          <Input type="number" value={cantidad} onChange={(_, data) => setCantidad(data.value)} />
        </Field>
        <Field label="Bodega" required>
          <Input value={bodegaNombre} onChange={(_, data) => setBodegaNombre(data.value)} />
        </Field>
        <Field label="Ubicación" required>
          <Input value={ubicacionNombre} onChange={(_, data) => setUbicacionNombre(data.value)} />
        </Field>
        <Field label="Motivo" required>
          <Textarea value={motivo} onChange={(_, data) => setMotivo(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="primary" onClick={createAjuste} disabled={saving || !itemNombre || !motivo}>
            {saving ? <Spinner size="tiny" /> : "Registrar ajuste"}
          </Button>
        </div>
      </Card>

      {lastAjuste ? (
        <Card>
          <Text weight="semibold">Último ajuste</Text>
          <Text>
            {lastAjuste.itemNombre} | Cantidad {lastAjuste.cantidad}
          </Text>
          <StatusBadge status={lastAjuste.estado} />
          <Button appearance="secondary" onClick={sendApproval} disabled={sendingApproval}>
            {sendingApproval ? "Enviando..." : "Enviar a aprobación"}
          </Button>
        </Card>
      ) : null}

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
