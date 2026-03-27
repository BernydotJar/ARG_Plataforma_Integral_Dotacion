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
import { CheckmarkCircle24Regular, DismissCircle24Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { InspeccionCalidad } from "@/lib/dataverse/types";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type CalidadListResponse = {
  data: InspeccionCalidad[];
};

const TABLE_COLUMN_COUNT = 6;

const formatResultado = (resultado: InspeccionCalidad["resultado"]): string =>
  resultado === "NoConforme" ? "No conforme" : "Conforme";

export default function CalidadPage() {
  const [list, setList] = useState<InspeccionCalidad[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const search = params.toString();
    return `/api/calidad${search ? `?${search}` : ""}`;
  }, [query]);

  const hasActiveFilters = Boolean(query);

  const loadInspections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<CalidadListResponse>(endpoint);
      setList(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar inspecciones");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadInspections();
  }, [loadInspections]);

  return (
    <div className="page-container">
      <PageHeader
        title="Calidad"
        description="Inspecciones, checklist y defectos de control"
        actionHref="/calidad/nuevo"
        actionLabel="Nueva inspección"
      />

      <Card data-tour="calidad-busqueda">
        <Input
          aria-label="Buscar inspecciones de calidad"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, lote o inspector"
        />
      </Card>

      {error ? (
        <Card>
          <Text weight="semibold">No se pudieron cargar inspecciones</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void loadInspections()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card data-tour="calidad-tabla">
        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonItem key={`quality-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
          <div className="table-scroll">
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
              {list.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.codigo}</TableCell>
                  <TableCell>{entry.inspector}</TableCell>
                  <TableCell>{entry.lote}</TableCell>
                  <TableCell>{formatResultado(entry.resultado)}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.estado} />
                  </TableCell>
                  <TableCell>
                    <Button as="a" href={`/calidad/${entry.id}`} appearance="secondary" className="touch-action-button">
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
        </div>
        )}
      </Card>
    </div>
  );
}
