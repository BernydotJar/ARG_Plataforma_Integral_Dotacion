"use client";

import {
  Button,
  Card,
  Field,
  Input,
  Text,
  Textarea,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MovimientoInventario } from "@/lib/types/app";

export default function AjusteInventarioPage() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [itemNombre, setItemNombre] = useState("");
  const [bodegaNombre, setBodegaNombre] = useState("Bodega Principal");
  const [ubicacionNombre, setUbicacionNombre] = useState("Pasillo A1");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [lastAjuste, setLastAjuste] = useState<MovimientoInventario | null>(null);

  const createAjuste = () => {
    if (!itemNombre || !motivo) return;

    const ajuste: MovimientoInventario = {
      id: `AJ-${Date.now()}`,
      tipo: "Ajuste",
      itemNombre,
      bodegaNombre,
      ubicacionNombre,
      cantidad: Number(cantidad),
      motivo,
      estado: "PendienteAprobacion",
      fecha: new Date().toISOString(),
    };

    setLastAjuste(ajuste);
    dispatchToast(
      <Toast>
        <ToastTitle>Ajuste registrado</ToastTitle>
        <ToastBody>El ajuste quedó pendiente de aprobación (modo piloto).</ToastBody>
      </Toast>,
      { intent: "success" },
    );
  };

  const sendApproval = () => {
    if (!lastAjuste) return;

    setLastAjuste({
      ...lastAjuste,
      estado: "EnAprobacion",
    });

    dispatchToast(
      <Toast>
        <ToastTitle>Ajuste enviado a aprobación</ToastTitle>
        <ToastBody>Simulación piloto de flujo ejecutada correctamente.</ToastBody>
      </Toast>,
      { intent: "success" },
    );
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
          <Input type="number" min={1} max={999} value={cantidad} onChange={(_, data) => setCantidad(data.value)} />
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
          <Button appearance="primary" onClick={createAjuste} disabled={!itemNombre || !motivo}>
            Registrar ajuste
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
          <Button appearance="secondary" onClick={sendApproval}>
            Enviar a aprobación
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
