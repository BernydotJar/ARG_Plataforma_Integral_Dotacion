"use client";

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { ArrowSync24Regular, PlugConnected24Regular } from "@fluentui/react-icons";

import { PageHeader } from "@/components/ui/PageHeader";

const syncRuns = [
  {
    id: "SSFF-2026-0009",
    integration: "SFTP SuccessFactors",
    status: "Exitosa",
    startedAt: "2026-03-18 08:15",
    source: "Job Programado",
  },
  {
    id: "SAP-2026-0012",
    integration: "SAP",
    status: "Pendiente",
    startedAt: "2026-03-18 09:02",
    source: "Trigger Manual",
  },
];

export default function IntegracionesPilotPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Integraciones"
        description="Configuración y monitoreo de conectores corporativos"
      />

      <Card data-tour="integraciones-placeholders">
        <div className="module-card-title-row">
          <Text weight="semibold">Conectores habilitados para piloto</Text>
          <Badge appearance="tint" color="informative">
            Arquitectura definida
          </Badge>
        </div>

        <div className="badge-wrap">
          <Badge appearance="outline" icon={<PlugConnected24Regular />}>SFTP SuccessFactors</Badge>
          <Badge appearance="outline" icon={<PlugConnected24Regular />}>SAP</Badge>
          <Badge appearance="outline">Power Automate</Badge>
        </div>

        <Text className="muted-text">
          Esta vista valida que el portal ya contempla el ecosistema de integración de ARGOS y su operación por flujos.
        </Text>
      </Card>

      <Card data-tour="integraciones-estado">
        <div className="actions-row">
          <Field label="Reprocesar desde fecha (opcional)">
            <Input type="date" />
          </Field>
          <Button appearance="primary" className="touch-action-button" icon={<ArrowSync24Regular />}>
            Simular sincronización
          </Button>
        </div>

        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID corrida</TableHeaderCell>
                <TableHeaderCell>Integración</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Inicio</TableHeaderCell>
                <TableHeaderCell>Origen</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.id}</TableCell>
                  <TableCell>{run.integration}</TableCell>
                  <TableCell>{run.status}</TableCell>
                  <TableCell>{run.startedAt}</TableCell>
                  <TableCell>{run.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
