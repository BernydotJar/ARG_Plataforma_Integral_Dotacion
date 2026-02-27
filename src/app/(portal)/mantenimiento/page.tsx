"use client";

import {
  Button,
  Card,
  Input,
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
import { DismissCircle24Regular, Wrench24Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { TicketMantenimiento } from "@/lib/dataverse/types";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type TicketListResponse = {
  data: TicketMantenimiento[];
};

const TABLE_COLUMN_COUNT = 6;

export default function MantenimientoPage() {
  const [list, setList] = useState<TicketMantenimiento[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    return `/api/mantenimiento/tickets${params.toString() ? `?${params.toString()}` : ""}`;
  }, [query]);

  const hasActiveFilters = Boolean(query);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<TicketListResponse>(endpoint);
      setList(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar tickets");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  return (
    <div className="page-container">
      <PageHeader
        title="Mantenimiento"
        description="Tickets correctivos, actividades y seguimiento técnico"
        actionHref="/mantenimiento/nuevo"
        actionLabel="Nuevo ticket"
      />

      <Card>
        <Input
          aria-label="Buscar tickets de mantenimiento"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, equipo o descripción"
        />
      </Card>

      {error ? (
        <Card>
          <Text weight="semibold">No se pudieron cargar tickets</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void loadTickets()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonItem key={`ticket-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Código</TableHeaderCell>
                <TableHeaderCell>Equipo</TableHeaderCell>
                <TableHeaderCell>Prioridad</TableHeaderCell>
                <TableHeaderCell>Técnico</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Acción</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.codigo}</TableCell>
                  <TableCell>{ticket.equipoNombre}</TableCell>
                  <TableCell>{ticket.prioridad}</TableCell>
                  <TableCell>{ticket.tecnicoAsignado || "Sin asignar"}</TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.estado} />
                  </TableCell>
                  <TableCell>
                    <Button as="a" href={`/mantenimiento/${ticket.id}`} appearance="subtle">
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMN_COUNT} className="table-empty-cell">
                    <EmptyState
                      compact
                      icon={hasActiveFilters ? <DismissCircle24Regular fontSize={30} /> : <Wrench24Regular fontSize={30} />}
                      title={hasActiveFilters ? "Sin resultados" : "No hay tickets aún"}
                      description={hasActiveFilters
                        ? "Ajusta el término de búsqueda o límpialo."
                        : "Crea el primer ticket de mantenimiento para esta sede."}
                      action={hasActiveFilters ? (
                        <Button appearance="secondary" onClick={() => setQuery("")}>
                          Limpiar búsqueda
                        </Button>
                      ) : (
                        <Button as="a" href="/mantenimiento/nuevo" appearance="primary">
                          Nuevo ticket
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
