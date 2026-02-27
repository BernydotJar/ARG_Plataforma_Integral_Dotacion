"use client";

import {
  Badge,
  Button,
  Card,
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
import { Box24Regular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

import type { Inventario } from "@/lib/dataverse/types";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

type StockResponse = {
  data: Inventario[];
};

const TABLE_COLUMN_COUNT = 5;

export default function InventarioPage() {
  const router = useRouter();
  const [stock, setStock] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStock = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<StockResponse>("/api/inventario/stock");
      setStock(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  const totalStock = stock.reduce((acc, entry) => acc + entry.stockActual, 0);

  const onModuleKeyDown =
    (href: string) =>
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      router.push(href);
    };

  return (
    <div className="page-container">
      <PageHeader
        title="Inventario"
        description="Control de stock, movimientos y ajustes por sede"
      />

      <div className="card-grid two-col">
        <Card
          className="module-card dashboard-card-link"
          role="link"
          tabIndex={0}
          onClick={() => router.push("/inventario/movimientos")}
          onKeyDown={onModuleKeyDown("/inventario/movimientos")}
        >
          <Text weight="semibold">Movimientos de inventario</Text>
          <Text className="muted-text">Registra ingresos, salidas y ajustes.</Text>
        </Card>
        <Card
          className="module-card dashboard-card-link"
          role="link"
          tabIndex={0}
          onClick={() => router.push("/inventario/ajuste")}
          onKeyDown={onModuleKeyDown("/inventario/ajuste")}
        >
          <Text weight="semibold">Ajuste de inventario</Text>
          <Text className="muted-text">Crea un ajuste y envíalo a aprobación.</Text>
        </Card>
      </div>

      {error ? (
        <Card>
          <Text weight="semibold">No se pudo cargar inventario</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void loadStock()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card>
        <div className="module-card-title-row">
          <Text weight="semibold">Stock actual</Text>
          <Badge appearance="filled">Total unidades: {totalStock}</Badge>
        </div>

        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonItem key={`stock-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
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
              {stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMN_COUNT} className="table-empty-cell">
                    <EmptyState
                      compact
                      icon={<Box24Regular fontSize={30} />}
                      title="Sin inventario disponible"
                      description="Registra movimientos para empezar a construir el stock."
                      action={(
                        <Button as="a" href="/inventario/movimientos" appearance="primary">
                          Registrar movimiento
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
