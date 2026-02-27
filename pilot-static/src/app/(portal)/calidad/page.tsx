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
import { CheckmarkCircle24Regular, DismissCircle24Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inspecciones } from "@/lib/mock-data";

const TABLE_COLUMN_COUNT = 6;

const normalizeText = (value: string): string => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function CalidadPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return inspecciones;

    return inspecciones.filter((entry) => [entry.codigo, entry.inspector, entry.lote]
      .some((field) => normalizeText(field).includes(normalizedQuery)));
  }, [query]);

  const hasActiveFilters = Boolean(query);

  return (
    <div className="page-container">
      <PageHeader
        title="Calidad"
        description="Inspecciones, checklist y defectos de control"
        actionHref="/calidad/nuevo"
        actionLabel="Nueva inspección"
      />

      <Card>
        <Input
          aria-label="Buscar inspecciones de calidad"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, lote o inspector"
        />
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Inspector</TableHeaderCell>
              <TableHeaderCell>Lote</TableHeaderCell>
              <TableHeaderCell>Resultado</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Acción</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.codigo}</TableCell>
                <TableCell>{entry.inspector}</TableCell>
                <TableCell>{entry.lote}</TableCell>
                <TableCell>
                  <StatusBadge status={entry.resultado} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={entry.estado} />
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
                    icon={hasActiveFilters ? <DismissCircle24Regular fontSize={30} /> : <CheckmarkCircle24Regular fontSize={30} />}
                    title={hasActiveFilters ? "Sin resultados" : "No hay inspecciones aún"}
                    description={hasActiveFilters
                      ? "Prueba otro término de búsqueda."
                      : "Registra la primera inspección para comenzar el control de calidad."}
                    action={hasActiveFilters ? (
                      <Button appearance="secondary" onClick={() => setQuery("")}>
                        Limpiar búsqueda
                      </Button>
                    ) : (
                      <Button as="a" href="/calidad/nuevo" appearance="primary">
                        Nueva inspección
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
