"use client";

import {
  Badge,
  Card,
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
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { Inventario } from "@/lib/dataverse/types";

type StockResponse = {
  data: Inventario[];
};

export default function InventarioPage() {
  const [stock, setStock] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<StockResponse>("/api/inventario/stock");
        setStock(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar inventario");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totalStock = stock.reduce((acc, entry) => acc + entry.stockActual, 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Inventario"
        description="Control de stock, movimientos y ajustes por sede"
      />

      <div className="card-grid two-col">
        <Link className="unstyled-link" href="/inventario/movimientos">
          <Card className="module-card">
            <Text weight="semibold">Movimientos de inventario</Text>
            <Text className="muted-text">Registra ingresos, salidas y ajustes.</Text>
          </Card>
        </Link>
        <Link className="unstyled-link" href="/inventario/ajuste">
          <Card className="module-card">
            <Text weight="semibold">Ajuste de inventario</Text>
            <Text className="muted-text">Crea un ajuste y envíalo a aprobación.</Text>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="module-card-title-row">
          <Text weight="semibold">Stock actual</Text>
          <Badge appearance="filled">Total unidades: {totalStock}</Badge>
        </div>

        {loading ? <Spinner label="Cargando stock..." /> : null}
        {error ? <Text className="error-text">{error}</Text> : null}

        {!loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Ítem</TableHeaderCell>
                <TableHeaderCell>Bodega</TableHeaderCell>
                <TableHeaderCell>Ubicación</TableHeaderCell>
                <TableHeaderCell>Stock actual</TableHeaderCell>
                <TableHeaderCell>Stock mínimo</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.itemNombre}</TableCell>
                  <TableCell>{entry.bodegaNombre}</TableCell>
                  <TableCell>{entry.ubicacionNombre}</TableCell>
                  <TableCell>{entry.stockActual}</TableCell>
                  <TableCell>{entry.stockMinimo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </Card>
    </div>
  );
}
