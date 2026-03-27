"use client";

import {
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import { DismissCircle24Regular, Wrench24Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { tickets } from "@/lib/mock-data";

const TABLE_COLUMN_COUNT = 6;

const normalizeText = (value: string): string => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function MantenimientoPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return tickets;

    return tickets.filter((ticket) =>
      [ticket.codigo, ticket.equipoNombre]
        .some((field) => normalizeText(field).includes(normalizedQuery)),
    );
  }, [query]);

  const hasActiveFilters = Boolean(query);

  return (
    <div className="page-container">
      <PageHeader
        title="Mantenimiento"
        description="Tickets correctivos, actividades y seguimiento técnico"
        actionHref="/mantenimiento/nuevo"
        actionLabel="Nuevo ticket"
      />

      <Card data-tour="mantenimiento-busqueda">
        <Input
          aria-label="Buscar tickets de mantenimiento"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, equipo o descripción"
        />
      </Card>

      <Card data-tour="mantenimiento-tabla">
        <div className="table-scroll">
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
            {filtered.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.codigo}</TableCell>
                <TableCell>{ticket.equipoNombre}</TableCell>
                <TableCell>{ticket.prioridad}</TableCell>
                <TableCell>{ticket.tecnicoAsignado || "Sin asignar"}</TableCell>
                <TableCell>
                  <StatusBadge status={ticket.estado} />
                </TableCell>
                <TableCell>
                  <Button as="a" href="#" appearance="secondary" className="touch-action-button">
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
        </div>
      </Card>
    </div>
  );
}
