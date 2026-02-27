"use client";

import {
  Button,
  Card,
  Dropdown,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import { ClipboardTask24Regular, DismissCircle24Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { pedidos as pedidosSeed } from "@/lib/mock-data";

const statusOptions = ["Todos", "Borrador", "EnAprobacion", "Aprobado", "EnviadoSAP", "Rechazado"];
const TABLE_COLUMN_COUNT = 6;

const normalizeText = (value: string): string => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function PedidosPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return pedidosSeed.filter((pedido) => {
      const matchesStatus = status === "Todos" || pedido.estado === status;
      if (!matchesStatus) return false;

      if (!normalizedQuery) return true;
      return [pedido.codigo, pedido.empleadoNombre, pedido.areaNombre]
        .some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }, [query, status]);

  const hasActiveFilters = Boolean(query) || status !== "Todos";

  const clearFilters = () => {
    setQuery("");
    setStatus("Todos");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Dotación / Pedidos"
        description="Gestiona solicitudes de dotación, aprobaciones y envío SAP"
        actionHref="/pedidos/nuevo"
        actionLabel="Nuevo pedido"
      />

      <Card>
        <div className="filter-row">
          <Input
            aria-label="Buscar pedidos por código, empleado o área"
            value={query}
            onChange={(_, data) => setQuery(data.value)}
            placeholder="Buscar por código, empleado o área"
          />
          <Dropdown
            aria-label="Filtrar pedidos por estado"
            value={status}
            selectedOptions={[status]}
            onOptionSelect={(_, data) => setStatus(String(data.optionValue))}
          >
            {statusOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
          <Button appearance="secondary" onClick={clearFilters}>
            Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Empleado</TableHeaderCell>
              <TableHeaderCell>Área</TableHeaderCell>
              <TableHeaderCell>Prioridad</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Acción</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>{pedido.codigo}</TableCell>
                <TableCell>{pedido.empleadoNombre}</TableCell>
                <TableCell>{pedido.areaNombre}</TableCell>
                <TableCell>{pedido.prioridad}</TableCell>
                <TableCell>
                  <StatusBadge status={pedido.estado} />
                </TableCell>
                <TableCell>
                  <Button as="a" href="#" appearance="subtle">
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMN_COUNT} className="table-empty-cell">
                  <EmptyState
                    compact
                    icon={hasActiveFilters ? <DismissCircle24Regular fontSize={30} /> : <ClipboardTask24Regular fontSize={30} />}
                    title={hasActiveFilters ? "Sin resultados" : "No hay pedidos aún"}
                    description={hasActiveFilters
                      ? "Prueba con otros filtros o limpia la búsqueda."
                      : "Crea el primer pedido de dotación para esta sede."}
                    action={hasActiveFilters ? (
                      <Button appearance="secondary" onClick={clearFilters}>
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button as="a" href="/pedidos/nuevo" appearance="primary">
                        Nuevo pedido
                      </Button>
                    )}
                  />
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
