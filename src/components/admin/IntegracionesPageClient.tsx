"use client";

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
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
import { ArrowSync24Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTimeGt } from "@/lib/format/date";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { SsffSyncOverview, SsffSyncRun } from "@/lib/integrations/ssff";

type OverviewResponse = {
  data: SsffSyncOverview;
};

type TriggerResponse = {
  data: {
    accepted: boolean;
    runId: string;
    status: string;
    message: string;
  };
};

const toBadgeAppearance = (status: SsffSyncRun["status"]): "filled" | "outline" | "tint" => {
  if (status === "Success") return "filled";
  if (status === "Running") return "tint";
  return "outline";
};

const toStatusLabel = (status: SsffSyncRun["status"]): string => {
  if (status === "Success") return "Exitosa";
  if (status === "Running") return "En ejecución";
  if (status === "Failed") return "Fallida";
  return "En espera";
};

const formatDate = (value?: string): string => {
  if (!value) return "-";
  return formatDateTimeGt(value);
};

export function IntegracionesPageClient() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [overview, setOverview] = useState<SsffSyncOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [sinceDate, setSinceDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<OverviewResponse>("/api/integraciones/ssff/estado");
      setOverview(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar estado de integraciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleTrigger = async () => {
    setTriggering(true);
    setError(null);

    try {
      const payload = await apiFetch<TriggerResponse>("/api/integraciones/ssff/sync", {
        method: "POST",
        body: JSON.stringify({
          mode: "manual",
          ...(sinceDate
            ? { sinceDate: new Date(`${sinceDate}T00:00:00.000Z`).toISOString() }
            : {}),
        }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Sincronización SSFF iniciada</ToastTitle>
          <ToastBody>{payload.data.message}</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      await loadOverview();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No se pudo iniciar sincronización";
      setError(message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Integraciones"
        description="Monitoreo y ejecución manual de sincronización con SuccessFactors (SSFF)"
      />

      <Card data-tour="integraciones-estado">
        <div className="module-card-title-row">
          <Text weight="semibold">Estado SSFF</Text>
          <Badge appearance="outline">Backend API</Badge>
        </div>

        <div className="badge-wrap" data-tour="integraciones-placeholders">
          <Badge appearance="outline">SFTP SuccessFactors</Badge>
          <Badge appearance="outline">SAP</Badge>
          <Badge appearance="outline">Power Automate</Badge>
        </div>

        {loading ? <Spinner label="Consultando integración SSFF..." /> : null}

        {!loading && overview ? (
          <>
            <div className="badge-wrap">
              <Badge appearance="tint">Estado actual: {toStatusLabel(overview.currentStatus)}</Badge>
              <Badge appearance="outline">Última ejecución: {formatDate(overview.lastExecutionAt)}</Badge>
              <Badge appearance="outline">Última exitosa: {formatDate(overview.lastSuccessfulAt)}</Badge>
              <Badge appearance="outline">Próxima programada: {formatDate(overview.nextScheduledAt)}</Badge>
            </div>

            <div className="actions-row">
              <Field label="Reprocesar desde fecha (opcional)">
                <Input type="date" value={sinceDate} onChange={(_, data) => setSinceDate(data.value)} />
              </Field>
              <Button
                appearance="primary"
                icon={<ArrowSync24Regular />}
                disabled={triggering}
                onClick={handleTrigger}
              >
                {triggering ? "Iniciando..." : "Sincronizar ahora"}
              </Button>
              <Button appearance="secondary" onClick={() => void loadOverview()}>
                Actualizar estado
              </Button>
            </div>

            <div className="table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>ID corrida</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Inicio</TableHeaderCell>
                    <TableHeaderCell>Fin</TableHeaderCell>
                    <TableHeaderCell>Altas/Bajas/Cambios</TableHeaderCell>
                    <TableHeaderCell>Errores</TableHeaderCell>
                    <TableHeaderCell>Origen</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{run.id}</TableCell>
                      <TableCell>
                        <Badge appearance={toBadgeAppearance(run.status)}>{toStatusLabel(run.status)}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(run.startedAt)}</TableCell>
                      <TableCell>{formatDate(run.finishedAt)}</TableCell>
                      <TableCell>{`${run.altas}/${run.bajas}/${run.cambios}`}</TableCell>
                      <TableCell>{run.errores}</TableCell>
                      <TableCell>{run.source}</TableCell>
                    </TableRow>
                  ))}

                  {overview.recentRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="table-empty-cell">
                        <EmptyState
                          compact
                          icon={<ArrowSync24Regular fontSize={28} />}
                          title="Sin ejecuciones recientes"
                          description="Cuando el job SSFF se ejecute, sus corridas aparecerán aquí."
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}

        {error ? <Text className="error-text">{error}</Text> : null}
      </Card>
    </div>
  );
}
