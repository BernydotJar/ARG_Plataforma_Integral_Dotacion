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
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type InspeccionCreateResponse = {
  data: {
    id: string;
  };
};

const resultados = [
  { value: "Conforme", label: "Conforme" },
  { value: "NoConforme", label: "No conforme" },
] as const;

type ResultadoValue = (typeof resultados)[number]["value"];

export default function NuevaInspeccionPage() {
  const router = useRouter();
  const [inspector, setInspector] = useState("");
  const [lote, setLote] = useState("");
  const [resultado, setResultado] = useState<ResultadoValue>("Conforme");
  const [observacion, setObservacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedResultadoLabel = useMemo(
    () => resultados.find((option) => option.value === resultado)?.label || resultado,
    [resultado],
  );

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = await apiFetch<InspeccionCreateResponse>("/api/calidad", {
        method: "POST",
        body: JSON.stringify({
          inspector,
          lote,
          resultado,
          observacion,
        }),
      });

      router.push(`/calidad/${payload.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear inspección");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Nueva inspección de calidad"
        description="Registra hallazgos, checklist y resultado del lote"
      />

      <Card className="form-grid two-col">
        <Field label="Inspector" required>
          <Input value={inspector} onChange={(_, data) => setInspector(data.value)} />
        </Field>
        <Field label="Lote" required>
          <Input value={lote} onChange={(_, data) => setLote(data.value)} />
        </Field>
        <Field label="Resultado" required>
          <Dropdown
            value={selectedResultadoLabel}
            selectedOptions={[resultado]}
            onOptionSelect={(_, data) => setResultado(String(data.optionValue) as ResultadoValue)}
          >
            {resultados.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Observación">
          <Textarea value={observacion} onChange={(_, data) => setObservacion(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="secondary" onClick={() => router.push("/calidad")}>
            Cancelar
          </Button>
          <Button appearance="primary" disabled={saving || !inspector || !lote} onClick={submit}>
            {saving ? <Spinner size="tiny" /> : "Guardar inspección"}
          </Button>
        </div>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
