"use client";

import {
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Skeleton,
  SkeletonItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  useToastController,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import { Box24Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { MovimientoInventario } from "@/lib/dataverse/types";

type MovimientoListResponse = {
  data: MovimientoInventario[];
};

type MovimientoCreateResponse = {
  data: MovimientoInventario;
};

const tipos = ["Ingreso", "Salida", "Ajuste"] as const;

export default function MovimientosPage() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [list, setList] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<(typeof tipos)[number]>("Ingreso");
  const [itemNombre, setItemNombre] = useState("");
  const [bodegaNombre, setBodegaNombre] = useState("Bodega Principal");
  const [ubicacionNombre, setUbicacionNombre] = useState("Pasillo A1");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<MovimientoListResponse>("/api/inventario/movimientos");
      setList(payload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = await apiFetch<MovimientoCreateResponse>("/api/inventario/movimientos", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          itemNombre,
          bodegaNombre,
          ubicacionNombre,
          cantidad: Number(cantidad),
          motivo,
        }),
      });

      setList((current) => [payload.data, ...current]);
      setItemNombre("");
      setCantidad("1");
      setMotivo("");

      dispatchToast(
        <Toast>
          <ToastTitle>Movimiento registrado</ToastTitle>
          <ToastBody>Se registró correctamente el movimiento.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo registrar movimiento");
    } finally {
      setSaving(false);
    }
  };

  const sendAdjustmentApproval = async (movimientoId: string) => {
    try {
      await apiFetch("/api/flows/aprobacion/ajuste", {
        method: "POST",
        body: JSON.stringify({ movimientoId }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Ajuste enviado a aprobación</ToastTitle>
          <ToastBody>Se disparó el flujo de aprobación correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo enviar el ajuste");
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Movimientos de inventario"
        description="Registra ingresos/salidas/ajustes y controla el estado de aprobación"
      />

      <Card className="form-grid two-col">
        <Field label="Tipo" required>
          <Dropdown value={tipo} selectedOptions={[tipo]} onOptionSelect={(_, data) => setTipo(String(data.optionValue) as (typeof tipos)[number])}>
            {tipos.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Ítem" required>
          <Input value={itemNombre} onChange={(_, data) => setItemNombre(data.value)} />
        </Field>
        <Field label="Bodega" required>
          <Input value={bodegaNombre} onChange={(_, data) => setBodegaNombre(data.value)} />
        </Field>
        <Field label="Ubicación" required>
          <Input value={ubicacionNombre} onChange={(_, data) => setUbicacionNombre(data.value)} />
        </Field>
        <Field label="Cantidad" required>
          <Input type="number" value={cantidad} onChange={(_, data) => setCantidad(data.value)} />
        </Field>
        <Field label="Motivo">
          <Input value={motivo} onChange={(_, data) => setMotivo(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="primary" onClick={submit} disabled={saving || !itemNombre}>
            {saving ? <Spinner size="tiny" /> : "Registrar movimiento"}
          </Button>
        </div>
      </Card>

      {error ? (
        <Card>
          <Text weight="semibold">No se pudieron cargar movimientos</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void load()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonItem key={`movement-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Ítem</TableHeaderCell>
                <TableHeaderCell>Cantidad</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Acción</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>{movimiento.tipo}</TableCell>
                  <TableCell>{movimiento.itemNombre}</TableCell>
                  <TableCell>{movimiento.cantidad}</TableCell>
                  <TableCell>
                    <StatusBadge status={movimiento.estado} />
                  </TableCell>
                  <TableCell>{new Date(movimiento.fecha).toLocaleString("es-CO")}</TableCell>
                  <TableCell>
                    {movimiento.tipo === "Ajuste" && movimiento.estado === "PendienteAprobacion" ? (
                      <Button appearance="subtle" onClick={() => sendAdjustmentApproval(movimiento.id)}>
                        Enviar aprobación
                      </Button>
                    ) : (
                      <Text size={200}>-</Text>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="table-empty-cell">
                    <EmptyState
                      compact
                      icon={<Box24Regular fontSize={30} />}
                      title="No hay movimientos aún"
                      description="Registra ingresos, salidas o ajustes para ver actividad aquí."
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
