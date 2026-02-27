"use client";

import {
  Button,
  Card,
  Dropdown,
  Input,
  Option,
  Skeleton,
  SkeletonItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { ClipboardTask24Regular, DismissCircle24Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PedidoDotacion } from "@/lib/dataverse/types";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PedidoListResponse = {
  data: PedidoDotacion[];
};

const statusOptions = ["Todos", "Borrador", "EnAprobacion", "Aprobado", "EnviadoSAP", "Rechazado"];
const TABLE_COLUMN_COUNT = 6;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDotacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status && status !== "Todos") params.set("status", status);

    const encoded = params.toString();
    return `/api/pedidos${encoded ? `?${encoded}` : ""}`;
  }, [query, status]);

  const hasActiveFilters = Boolean(query) || status !== "Todos";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<PedidoListResponse>(requestUrl);
      setPedidos(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [requestUrl]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

      {error ? (
        <Card>
          <Text weight="semibold">No se pudieron cargar los pedidos</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void loadData()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonItem key={`pedido-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
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
              {pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>{pedido.codigo}</TableCell>
                  <TableCell>{pedido.empleadoNombre}</TableCell>
                  <TableCell>{pedido.areaNombre}</TableCell>
                  <TableCell>{pedido.prioridad}</TableCell>
                  <TableCell>
                    <StatusBadge status={pedido.estado} />
                  </TableCell>
                  <TableCell>
                    <Button as="a" href={`/pedidos/${pedido.id}`} appearance="subtle">
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pedidos.length === 0 ? (
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
        )}
      </Card>
    </div>
  );
}
