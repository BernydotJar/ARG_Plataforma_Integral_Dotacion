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

const resultados = ["Conforme", "NoConforme"] as const;

export default function NuevaInspeccionPage() {
  const router = useRouter();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [inspector, setInspector] = useState("");
  const [lote, setLote] = useState("");
  const [resultado, setResultado] = useState<(typeof resultados)[number]>("Conforme");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!inspector || !lote) {
      setError("Inspector y lote son requeridos");
      return;
    }

    setError(null);
    dispatchToast(
      <Toast>
        <ToastTitle>Inspección creada</ToastTitle>
        <ToastBody>Simulación piloto: inspección registrada correctamente.</ToastBody>
      </Toast>,
      { intent: "success" },
    );

    router.push("/calidad");
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
          <Dropdown value={resultado} selectedOptions={[resultado]} onOptionSelect={(_, data) => setResultado(String(data.optionValue) as (typeof resultados)[number])}>
            {resultados.map((option) => (
              <Option key={option} value={option}>
                {option}
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
          <Button appearance="primary" disabled={!inspector || !lote} onClick={submit}>
            Guardar inspección
          </Button>
        </div>
      </Card>

      {error ? <Text className="error-text">{error}</Text> : null}
    </div>
  );
}
