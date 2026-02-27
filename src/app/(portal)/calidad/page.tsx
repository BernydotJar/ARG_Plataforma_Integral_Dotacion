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
import type { InspeccionCalidad } from "@/lib/dataverse/types";

type CalidadListResponse = {
  data: InspeccionCalidad[];
};

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<CalidadListResponse>(endpoint);
        setList(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar inspecciones");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [endpoint]);

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
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          placeholder="Buscar por código, lote o inspector"
        />
      </Card>

      {loading ? <Spinner label="Cargando inspecciones..." /> : null}
      {error ? <Text className="error-text">{error}</Text> : null}

      {!loading ? (
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
              {list.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.codigo}</TableCell>
                  <TableCell>{entry.inspector}</TableCell>
                  <TableCell>{entry.lote}</TableCell>
                  <TableCell>{entry.resultado}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.estado} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/calidad/${entry.id}`}>Ver detalle</Link>
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
