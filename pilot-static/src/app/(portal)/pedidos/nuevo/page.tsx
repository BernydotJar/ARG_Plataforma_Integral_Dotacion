"use client";

import {
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Text,
  Textarea,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";

type DetalleDraft = {
  itemNombre: string;
  talla: string;
  cantidad: number;
};

const prioridadOptions = ["Baja", "Media", "Alta"];

export default function NuevoPedidoPage() {
  const router = useRouter();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [areaNombre, setAreaNombre] = useState("");
  const [observacion, setObservacion] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [detalles, setDetalles] = useState<DetalleDraft[]>([{ itemNombre: "", talla: "Única", cantidad: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const updateDetalle = (idx: number, patch: Partial<DetalleDraft>) => {
    setDetalles((current) => current.map((entry, entryIdx) => (entryIdx === idx ? { ...entry, ...patch } : entry)));
  };

  const addDetalle = () => {
    setDetalles((current) => [...current, { itemNombre: "", talla: "Única", cantidad: 1 }]);
  };

  const removeDetalle = (idx: number) => {
    setDetalles((current) => current.filter((_, entryIdx) => entryIdx !== idx));
  };

  const submit = () => {
    if (!empleadoNombre.trim() || !areaNombre.trim()) {
      setError("Empleado y área son requeridos");
      return;
    }

    if (detalles.length === 0 || detalles.some((detail) => !detail.itemNombre.trim() || detail.cantidad <= 0)) {
      setError("Debes agregar al menos un detalle válido");
      return;
    }

    setError(null);
    dispatchToast(
      <Toast>
        <ToastTitle>Pedido creado</ToastTitle>
        <ToastBody>Simulación en modo piloto: la solicitud se registró visualmente.</ToastBody>
      </Toast>,
      { intent: "success" },
    );

    router.push("/pedidos");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Nuevo pedido de dotación"
        description="Registra una solicitud y adjunta los ítems requeridos"
      />

      <Card className="form-grid two-col">
        <Field label="Empleado" required>
          <Input value={empleadoNombre} onChange={(_, data) => setEmpleadoNombre(data.value)} />
        </Field>
        <Field label="Área" required>
          <Input value={areaNombre} onChange={(_, data) => setAreaNombre(data.value)} />
        </Field>
        <Field label="Prioridad" required>
          <Dropdown value={prioridad} selectedOptions={[prioridad]} onOptionSelect={(_, data) => setPrioridad(String(data.optionValue))}>
            {prioridadOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Observación">
          <Textarea value={observacion} onChange={(_, data) => setObservacion(data.value)} />
        </Field>
      </Card>

      <Card>
        <div className="module-card-title-row">
          <Text weight="semibold">Detalle de ítems</Text>
          <Button appearance="subtle" icon={<Add24Regular />} onClick={addDetalle}>
            Agregar ítem
          </Button>
        </div>

        <div className="stack gap-12">
          {detalles.map((detalle, idx) => (
            <div key={`detalle-${idx}`} className="detail-row">
              <Field label="Ítem" required>
                <Input
                  value={detalle.itemNombre}
                  onChange={(_, data) => updateDetalle(idx, { itemNombre: data.value })}
                />
              </Field>
              <Field label="Talla">
                <Input value={detalle.talla} onChange={(_, data) => updateDetalle(idx, { talla: data.value })} />
              </Field>
              <Field label="Cantidad" required>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={String(detalle.cantidad)}
                  onChange={(_, data) => updateDetalle(idx, { cantidad: Number(data.value || 0) })}
                />
              </Field>
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                disabled={detalles.length === 1}
                onClick={() => removeDetalle(idx)}
                aria-label="Eliminar ítem"
              />
            </div>
          ))}
        </div>
      </Card>

      {error ? (
        <Text className="error-text" block>
          {error}
        </Text>
      ) : null}

      <div className="actions-row">
        <Button appearance="secondary" onClick={() => router.push("/pedidos")}>
          Cancelar
        </Button>
        <Button appearance="primary" onClick={submit}>
          Crear pedido
        </Button>
      </div>
    </div>
  );
}
