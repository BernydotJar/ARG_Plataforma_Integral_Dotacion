"use client";

import {
  Card,
  Input,
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
import type { TicketMantenimiento } from "@/lib/dataverse/types";

type TicketListResponse = {
  data: TicketMantenimiento[];
};

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<TicketListResponse>(endpoint);
        setList(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar tickets");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [endpoint]);

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
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, equipo o descripción"
        />
      </Card>

      {loading ? <Spinner label="Cargando tickets..." /> : null}
      {error ? <Text className="error-text">{error}</Text> : null}

      {!loading ? (
        <Card>
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
                    <Link href={`/mantenimiento/${ticket.id}`}>Ver detalle</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
