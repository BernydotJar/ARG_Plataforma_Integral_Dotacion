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
} from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type TicketCreateResponse = {
  data: {
    id: string;
  };
};

const prioridades = ["Baja", "Media", "Alta"] as const;

export default function NuevoTicketPage() {
  const router = useRouter();
  const [equipoNombre, setEquipoNombre] = useState("");
  const [prioridad, setPrioridad] = useState<(typeof prioridades)[number]>("Media");
  const [descripcion, setDescripcion] = useState("");
  const [tecnicoAsignado, setTecnicoAsignado] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = await apiFetch<TicketCreateResponse>("/api/mantenimiento/tickets", {
        method: "POST",
        body: JSON.stringify({
          equipoNombre,
          prioridad,
          descripcion,
          tecnicoAsignado: tecnicoAsignado || undefined,
        }),
      });

      router.push(`/mantenimiento/${payload.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear ticket");
    } finally {
      setSaving(false);
    }
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
          <Button appearance="primary" disabled={saving || !equipoNombre || !descripcion} onClick={submit}>
            {saving ? <Spinner size="tiny" /> : "Guardar ticket"}
          </Button>
        </div>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
