"use client";

import {
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { Box24Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { movimientos as movimientosSeed } from "@/lib/mock-data";
import type { MovimientoInventario } from "@/lib/types/app";

const tipos = ["Ingreso", "Salida", "Ajuste"] as const;

export default function MovimientosPage() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [list, setList] = useState<MovimientoInventario[]>(movimientosSeed);
  const [tipo, setTipo] = useState<(typeof tipos)[number]>("Ingreso");
  const [itemNombre, setItemNombre] = useState("");
  const [bodegaNombre, setBodegaNombre] = useState("Bodega Principal");
  const [ubicacionNombre, setUbicacionNombre] = useState("Pasillo A1");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");

  const ordered = useMemo(
    () => [...list].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    [list],
  );

  const submit = () => {
    if (!itemNombre.trim()) return;

    const newMovement: MovimientoInventario = {
      id: `MOV-${Date.now()}`,
      tipo,
      itemNombre,
      cantidad: Number(cantidad),
      bodegaNombre,
      ubicacionNombre,
      motivo,
      estado: tipo === "Ajuste" ? "PendienteAprobacion" : "Registrado",
      fecha: new Date().toISOString(),
    };

    setList((current) => [newMovement, ...current]);
    setItemNombre("");
    setCantidad("1");
    setMotivo("");

    dispatchToast(
      <Toast>
        <ToastTitle>Movimiento registrado</ToastTitle>
        <ToastBody>Simulación piloto: movimiento creado correctamente.</ToastBody>
      </Toast>,
      { intent: "success" },
    );
  };

  const sendAdjustmentApproval = (movimientoId: string) => {
    setList((current) =>
      current.map((item) =>
        item.id === movimientoId ? { ...item, estado: "EnAprobacion" } : item,
      ),
    );

    dispatchToast(
      <Toast>
        <ToastTitle>Ajuste enviado a aprobación</ToastTitle>
        <ToastBody>Simulación piloto: estado actualizado a EnAprobación.</ToastBody>
      </Toast>,
      { intent: "success" },
    );
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
          <Input type="number" min={1} max={999} value={cantidad} onChange={(_, data) => setCantidad(data.value)} />
        </Field>
        <Field label="Motivo">
          <Input value={motivo} onChange={(_, data) => setMotivo(data.value)} />
        </Field>

        <div className="actions-row">
          <Button appearance="primary" onClick={submit} disabled={!itemNombre}>
            Registrar movimiento
          </Button>
        </div>
      </Card>

      <Card>
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
            {ordered.map((movimiento) => (
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
            {ordered.length === 0 ? (
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
      </Card>
    </div>
  );
}
