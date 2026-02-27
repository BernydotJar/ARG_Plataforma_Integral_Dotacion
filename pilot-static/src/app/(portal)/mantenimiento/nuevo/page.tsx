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
import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { PageHeader } from "@/components/ui/PageHeader";

const prioridades = ["Baja", "Media", "Alta"] as const;

export default function NuevoTicketPage() {
  const router = useRouter();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [equipoNombre, setEquipoNombre] = useState("");
  const [prioridad, setPrioridad] = useState<(typeof prioridades)[number]>("Media");
  const [descripcion, setDescripcion] = useState("");
  const [tecnicoAsignado, setTecnicoAsignado] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!equipoNombre || !descripcion) {
      setError("Equipo y descripción son requeridos");
      return;
    }

    setError(null);
    dispatchToast(
      <Toast>
        <ToastTitle>Ticket creado</ToastTitle>
        <ToastBody>Simulación piloto: ticket de mantenimiento registrado.</ToastBody>
      </Toast>,
      { intent: "success" },
    );

    router.push("/mantenimiento");
  };

  return (
    <div className="page-container">
      <PageHeader title="Nuevo ticket" description="Registro de mantenimiento correctivo/preventivo" />

      <Card className="form-grid two-col">
        <Field label="Equipo" required>
          <Input value={equipoNombre} onChange={(_, data) => setEquipoNombre(data.value)} />
        </Field>
        <Field label="Prioridad" required>
          <Dropdown value={prioridad} selectedOptions={[prioridad]} onOptionSelect={(_, data) => setPrioridad(String(data.optionValue) as (typeof prioridades)[number])}>
            {prioridades.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Técnico asignado">
          <Input value={tecnicoAsignado} onChange={(_, data) => setTecnicoAsignado(data.value)} />
        </Field>
        <Field label="Descripción" required>
          <Textarea value={descripcion} onChange={(_, data) => setDescripcion(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="secondary" onClick={() => router.push("/mantenimiento")}>Cancelar</Button>
          <Button appearance="primary" disabled={!equipoNombre || !descripcion} onClick={submit}>
            Guardar ticket
          </Button>
        </div>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
