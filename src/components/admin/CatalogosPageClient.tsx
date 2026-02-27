"use client";

import { Card, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text } from "@fluentui/react-components";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type CatalogosResponse = {
  data: Record<string, Array<{ id: string; nombre?: string; codigo?: string }>>;
};

export function CatalogosPageClient() {
  const [data, setData] = useState<CatalogosResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<CatalogosResponse>("/api/admin/catalogos");
        setData(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar catálogos");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        title="Administración de catálogos"
        description="Configuración base de sedes, áreas, ítems y maestros"
      />

      {loading ? <Spinner label="Cargando catálogos..." /> : null}
      {error ? <Text className="error-text">{error}</Text> : null}

      {data ? (
        Object.entries(data).map(([key, entries]) => (
          <Card key={key}>
            <Text weight="semibold">{key}</Text>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Nombre / Código</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 8).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.id}</TableCell>
                    <TableCell>{entry.nombre || entry.codigo || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))
      ) : null}
    </div>
  );
}
