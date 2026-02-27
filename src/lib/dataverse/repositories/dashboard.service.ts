import "server-only";

import type { AppUser, PendingItem } from "@/lib/types/app";

import { PENDING_ITEMS_LIMIT } from "./constants";
import { listInspecciones } from "./calidad.repository";
import { listMovimientos } from "./inventario.repository";
import { listTickets } from "./mantenimiento.repository";
import { listPedidos } from "./pedidos.repository";
import type { DashboardData } from "./types";

export const getDashboardData = async (user: AppUser): Promise<DashboardData> => {
  const [pedidos, movimientos, tickets, inspecciones] = await Promise.all([
    listPedidos(user),
    listMovimientos(user),
    listTickets(user),
    listInspecciones(user),
  ]);

  const pendientes: PendingItem[] = [
    ...pedidos
      .filter((pedido) => pedido.estado === "EnAprobacion")
      .slice(0, 3)
      .map((pedido) => ({
        id: pedido.id,
        tipo: "Pedido" as const,
        titulo: `${pedido.codigo} - ${pedido.empleadoNombre}`,
        estado: pedido.estado || "",
        fecha: pedido.createdOn,
        href: `/pedidos/${pedido.id}`,
      })),
    ...movimientos
      .filter((movimiento) => movimiento.estado === "PendienteAprobacion")
      .slice(0, 2)
      .map((movimiento) => ({
        id: movimiento.id,
        tipo: "AjusteInventario" as const,
        titulo: `${movimiento.itemNombre} (${movimiento.tipo})`,
        estado: movimiento.estado || "",
        fecha: movimiento.fecha,
        href: "/inventario/movimientos",
      })),
    ...tickets
      .filter((ticket) => ticket.estado === "Abierto")
      .slice(0, 2)
      .map((ticket) => ({
        id: ticket.id,
        tipo: "Ticket" as const,
        titulo: `${ticket.codigo} - ${ticket.equipoNombre}`,
        estado: ticket.estado || "",
        fecha: ticket.fechaReporte,
        href: `/mantenimiento/${ticket.id}`,
      })),
    ...inspecciones
      .filter((inspeccion) => inspeccion.estado === "Abierta")
      .slice(0, 2)
      .map((inspeccion) => ({
        id: inspeccion.id,
        tipo: "Calidad" as const,
        titulo: `${inspeccion.codigo} - ${inspeccion.lote}`,
        estado: inspeccion.estado || "",
        fecha: inspeccion.fechaInspeccion,
        href: `/calidad/${inspeccion.id}`,
      })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, PENDING_ITEMS_LIMIT);

  return {
    cards: [
      {
        id: "pedidos",
        title: "Dotación / Pedidos",
        description: "Solicitudes de dotación y aprobaciones",
        href: "/pedidos",
        count: pedidos.length,
      },
      {
        id: "inventario",
        title: "Inventario",
        description: "Movimientos, ajustes y stock",
        href: "/inventario",
        count: movimientos.length,
      },
      {
        id: "calidad",
        title: "Calidad",
        description: "Inspecciones y defectos",
        href: "/calidad",
        count: inspecciones.length,
      },
      {
        id: "mantenimiento",
        title: "Mantenimiento",
        description: "Tickets correctivos y preventivos",
        href: "/mantenimiento",
        count: tickets.length,
      },
    ],
    pendientes,
  };
};
