"use client";

import { Badge, Card, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text } from "@fluentui/react-components";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { DashboardCard, PendingItem } from "@/lib/types/app";

type DashboardResponse = {
  cards: DashboardCard[];
  pendientes: PendingItem[];
  runtimeMode: "demo" | "dataverse";
};

export default function HomePage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<DashboardResponse>("/api/dashboard");
        setData(payload);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Error al cargar dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        title="Inicio"
        description="Resumen operativo por módulos y pendientes del usuario"
      />

      {loading ? (
        <div className="centered-state">
          <Spinner label="Cargando dashboard..." />
        </div>
      ) : null}

      {error ? (
        <Card>
          <Text weight="semibold">No se pudo cargar el dashboard</Text>
          <Text>{error}</Text>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="card-grid four-col">
            {data.cards.map((card) => (
              <Link key={card.id} href={card.href} className="unstyled-link">
                <Card className="module-card">
                  <div className="module-card-title-row">
                    <Text weight="semibold">{card.title}</Text>
                    <Badge appearance="filled">{card.count}</Badge>
                  </div>
                  <Text size={300} className="muted-text">
                    {card.description}
                  </Text>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <div className="module-card-title-row">
              <Text weight="semibold">Mis pendientes</Text>
              <Badge appearance={data.runtimeMode === "demo" ? "outline" : "filled"}>
                Modo {data.runtimeMode === "demo" ? "Demo" : "Dataverse"}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Título</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendientes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>
                      <Link href={item.href}>{item.titulo}</Link>
                    </TableCell>
                    <TableCell>{item.estado}</TableCell>
                    <TableCell>{new Date(item.fecha).toLocaleString("es-CO")}</TableCell>
                  </TableRow>
                ))}
                {data.pendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>No hay pendientes</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : null}
    </div>
  );
}
