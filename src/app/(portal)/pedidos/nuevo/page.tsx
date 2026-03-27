"use client";

import {
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Text,
  Textarea,
  useToastController,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type PedidoCreateResponse = {
  data: {
    id: string;
  };
};

type DetalleDraft = {
  itemNombre: string;
  talla: string;
  cantidad: number;
};

const prioridadOptions = ["Baja", "Media", "Alta"];
const MIN_CANTIDAD = 1;
const MAX_CANTIDAD = 500;

const parseCantidad = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
};

export default function NuevoPedidoPage() {
  const router = useRouter();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [areaNombre, setAreaNombre] = useState("");
  const [observacion, setObservacion] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [detalles, setDetalles] = useState<DetalleDraft[]>([{ itemNombre: "", talla: "Única", cantidad: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidCantidad = useMemo(
    () => detalles.some((detail) => detail.cantidad < MIN_CANTIDAD || detail.cantidad > MAX_CANTIDAD),
    [detalles],
  );

  const updateDetalle = (idx: number, patch: Partial<DetalleDraft>) => {
    setDetalles((current) => current.map((entry, entryIdx) => (entryIdx === idx ? { ...entry, ...patch } : entry)));
  };

  const addDetalle = () => {
    setDetalles((current) => [...current, { itemNombre: "", talla: "Única", cantidad: 1 }]);
  };

  const removeDetalle = (idx: number) => {
    setDetalles((current) => current.filter((_, entryIdx) => entryIdx !== idx));
  };

  const validate = () => {
    if (!empleadoNombre.trim() || !areaNombre.trim()) {
      setError("Empleado y área son requeridos");
      return false;
    }

    if (detalles.length === 0 || detalles.some((detail) => !detail.itemNombre.trim())) {
      setError("Debes agregar al menos un detalle válido");
      return false;
    }

    if (hasInvalidCantidad) {
      setError(`La cantidad por ítem debe estar entre ${MIN_CANTIDAD} y ${MAX_CANTIDAD}`);
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiFetch<PedidoCreateResponse>("/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          empleadoNombre,
          areaNombre,
          observacion,
          prioridad,
          detalles,
        }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Pedido creado</ToastTitle>
          <ToastBody>La solicitud fue registrada correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      router.push(`/pedidos/${response.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear el pedido");
    } finally {
      setSaving(false);
    }
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
          {detalles.map((detalle, idx) => {
            const cantidadInvalida = detalle.cantidad < MIN_CANTIDAD || detalle.cantidad > MAX_CANTIDAD;

            return (
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
                <Field
                  label="Cantidad"
                  required
                  validationState={cantidadInvalida ? "error" : "none"}
                  validationMessage={cantidadInvalida ? `Debe estar entre ${MIN_CANTIDAD} y ${MAX_CANTIDAD}` : undefined}
                >
                  <Input
                    type="number"
                    min={MIN_CANTIDAD}
                    max={MAX_CANTIDAD}
                    step={1}
                    value={String(detalle.cantidad)}
                    onChange={(_, data) => updateDetalle(idx, { cantidad: parseCantidad(data.value) })}
                  />
                </Field>
                <Button
                  className="touch-icon-button"
                  appearance="subtle"
                  icon={<Delete24Regular />}
                  disabled={detalles.length === 1}
                  onClick={() => removeDetalle(idx)}
                  aria-label="Eliminar ítem"
                />
              </div>
            );
          })}
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
        <Button appearance="primary" onClick={submit} disabled={saving || hasInvalidCantidad}>
          {saving ? <Spinner size="tiny" /> : "Crear pedido"}
        </Button>
      </div>
    </div>
  );
}
