"use client";

import {
  Button,
  Card,
  Dropdown,
  Input,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { PedidoDotacion } from "@/lib/dataverse/types";

type PedidoListResponse = {
  data: PedidoDotacion[];
};

const statusOptions = ["Todos", "Borrador", "EnAprobacion", "Aprobado", "EnviadoSAP", "Rechazado"];

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<PedidoListResponse>(requestUrl);
        setPedidos(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar pedidos");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [requestUrl]);

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
            value={query}
            onChange={(_, data) => setQuery(data.value)}
            placeholder="Buscar por código, empleado o área"
          />
          <Dropdown value={status} selectedOptions={[status]} onOptionSelect={(_, data) => setStatus(String(data.optionValue))}>
            {statusOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
          <Button appearance="secondary" onClick={() => {
            setQuery("");
            setStatus("Todos");
          }}>
            Limpiar
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="centered-state">
          <Spinner label="Cargando pedidos..." />
        </div>
      ) : null}

      {error ? (
        <Card>
          <Text className="error-text">{error}</Text>
        </Card>
      ) : null}

      {!loading ? (
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
                    <Link href={`/pedidos/${pedido.id}`}>Ver detalle</Link>
                  </TableCell>
                </TableRow>
              ))}
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No hay pedidos para los filtros seleccionados.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
