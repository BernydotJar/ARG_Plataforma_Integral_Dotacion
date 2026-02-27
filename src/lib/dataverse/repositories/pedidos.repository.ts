import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { getDataverseClient } from "@/lib/dataverse/client";
import { createMockId, getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type { PedidoDetail, PedidoDotacion, PedidoDotacionDetalle } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  generateCode,
  getRequestedSede,
  rowToHistorial,
  rowToPedido,
  rowToPedidoDetalle,
  scopeMatchesFilters,
} from "./common";
import {
  QUERY_TOP_DEFAULT,
  QUERY_TOP_DETAIL,
  QUERY_TOP_HISTORY,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  IPedidoRepository,
  ListFilters,
  PedidoCreateInput,
  PedidoUpdateInput,
} from "./types";

const demoPedidoRepository: IPedidoRepository = {
  async list(user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]> {
    const db = getMockDb();

    const scoped = db.pedidos.filter((pedido) => scopeMatchesFilters(pedido, user, filters));
    return applyTextSearch(scoped, filters?.query, (pedido) => [pedido.codigo, pedido.empleadoNombre, pedido.areaNombre])
      .sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  },

  async create(user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion> {
    const db = getMockDb();
    const now = new Date().toISOString();
    const sedeId = getRequestedSede(user, input.sedeId);
    const totalItems = input.detalles.reduce((acc, detail) => acc + detail.cantidad, 0);

    const pedido: PedidoDotacion = {
      id: createMockId("ped"),
      sedeId,
      codigo: generateCode("PD"),
      empleadoNombre: input.empleadoNombre,
      areaNombre: input.areaNombre,
      observacion: input.observacion,
      totalItems,
      prioridad: input.prioridad,
      estado: "Borrador",
      createdOn: now,
      modifiedOn: now,
    };

    const detalles: PedidoDotacionDetalle[] = input.detalles.map((detail) => ({
      id: createMockId("pdd"),
      sedeId,
      pedidoId: pedido.id,
      itemNombre: detail.itemNombre,
      talla: detail.talla,
      cantidad: detail.cantidad,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    }));

    db.pedidos.unshift(pedido);
    db.pedidoDetalles.unshift(...detalles);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "PedidoDotacion",
      entidadId: pedido.id,
      tipo: "Creación",
      mensaje: "Pedido creado desde portal ARGOS",
      metadata: { totalItems },
    });

    return pedido;
  },

  async getDetail(user: AppUser, id: string): Promise<PedidoDetail | null> {
    const db = getMockDb();
    const pedido = db.pedidos.find((entry) => entry.id === id);
    if (!pedido || !scopeMatchesFilters(pedido, user)) return null;

    return {
      pedido,
      detalles: db.pedidoDetalles.filter((entry) => entry.pedidoId === id),
      historial: db.historial
        .filter((entry) => entry.entidad === "PedidoDotacion" && entry.entidadId === id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    };
  },

  async update(user: AppUser, id: string, input: PedidoUpdateInput): Promise<PedidoDotacion | null> {
    const db = getMockDb();
    const index = db.pedidos.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    const current = db.pedidos[index];
    if (!scopeMatchesFilters(current, user)) return null;

    const updated: PedidoDotacion = {
      ...current,
      observacion: input.observacion ?? current.observacion,
      prioridad: input.prioridad ?? current.prioridad,
      estado: input.estado ?? current.estado,
      modifiedOn: new Date().toISOString(),
    };

    db.pedidos[index] = updated;

    await logHistorialEvent({
      user,
      sedeId: updated.sedeId,
      entidad: "PedidoDotacion",
      entidadId: updated.id,
      tipo: "Actualización",
      mensaje: "Pedido actualizado",
      metadata: { ...input },
    });

    return updated;
  },

  async delete(user: AppUser, id: string): Promise<boolean> {
    const db = getMockDb();
    const target = db.pedidos.find((entry) => entry.id === id);
    if (!target || !scopeMatchesFilters(target, user)) return false;

    db.pedidos = db.pedidos.filter((entry) => entry.id !== id);
    db.pedidoDetalles = db.pedidoDetalles.filter((entry) => entry.pedidoId !== id);

    await logHistorialEvent({
      user,
      sedeId: target.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      tipo: "Eliminación",
      mensaje: "Pedido eliminado",
    });

    return true;
  },
};

const dataversePedidoRepository: IPedidoRepository = {
  async list(user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.PedidoDotacion, {
      orderBy: "createdon desc",
      top: QUERY_TOP_DEFAULT,
    });

    const scoped = rows.map(rowToPedido).filter((pedido) => scopeMatchesFilters(pedido, user, filters));
    return applyTextSearch(scoped, filters?.query, (pedido) => [pedido.codigo, pedido.empleadoNombre, pedido.areaNombre]);
  },

  async create(user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);
    const totalItems = input.detalles.reduce((acc, detail) => acc + detail.cantidad, 0);

    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.PedidoDotacion, {
      crf1_codigo: generateCode("PD"),
      crf1_empleadonombre: input.empleadoNombre,
      crf1_areanombre: input.areaNombre,
      crf1_observacion: input.observacion,
      crf1_totalitems: totalItems,
      crf1_prioridad: input.prioridad,
      crf1_estado: "Borrador",
      crf1_sedeid: sedeId,
    });

    const pedido = rowToPedido(created);

    for (const detail of input.detalles) {
      await client.create(dataverseEntitySet.PedidoDotacionDetalle, {
        crf1_pedidoid: pedido.id,
        crf1_itemnombre: detail.itemNombre,
        crf1_talla: detail.talla,
        crf1_cantidad: detail.cantidad,
        crf1_sedeid: sedeId,
      });
    }

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "PedidoDotacion",
      entidadId: pedido.id,
      tipo: "Creación",
      mensaje: "Pedido creado desde portal ARGOS",
      metadata: { totalItems },
    });

    return pedido;
  },

  async getDetail(user: AppUser, id: string): Promise<PedidoDetail | null> {
    const client = getDataverseClient();
    const pedidoRow = await client.get<Record<string, unknown>>(dataverseEntitySet.PedidoDotacion, id);
    const pedido = rowToPedido(pedidoRow);
    if (!scopeMatchesFilters(pedido, user)) return null;

    const detallesRows = await client.list<Record<string, unknown>>(dataverseEntitySet.PedidoDotacionDetalle, {
      filter: `crf1_pedidoid eq ${id}`,
      top: QUERY_TOP_DETAIL,
    });

    const historialRows = await client.list<Record<string, unknown>>(dataverseEntitySet.HistorialEvento, {
      filter: `crf1_entidad eq 'PedidoDotacion' and crf1_entidadid eq '${id}'`,
      top: QUERY_TOP_HISTORY,
      orderBy: "createdon desc",
    });

    return {
      pedido,
      detalles: detallesRows.map((row) => rowToPedidoDetalle(row, pedido.sedeId, id)),
      historial: historialRows.map((row) =>
        rowToHistorial(row, {
          sedeId: pedido.sedeId,
          entidad: "PedidoDotacion",
          entidadId: id,
        }),
      ),
    };
  },

  async update(user: AppUser, id: string, input: PedidoUpdateInput): Promise<PedidoDotacion | null> {
    const existing = await this.getDetail(user, id);
    if (!existing) return null;

    const client = getDataverseClient();
    await client.update(dataverseEntitySet.PedidoDotacion, id, {
      ...(input.observacion !== undefined ? { crf1_observacion: input.observacion } : {}),
      ...(input.prioridad !== undefined ? { crf1_prioridad: input.prioridad } : {}),
      ...(input.estado !== undefined ? { crf1_estado: input.estado } : {}),
    });

    await logHistorialEvent({
      user,
      sedeId: existing.pedido.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      tipo: "Actualización",
      mensaje: "Pedido actualizado",
      metadata: { ...input },
    });

    return (await this.getDetail(user, id))?.pedido || null;
  },

  async delete(user: AppUser, id: string): Promise<boolean> {
    const existing = await this.getDetail(user, id);
    if (!existing) return false;

    const client = getDataverseClient();
    await client.delete(dataverseEntitySet.PedidoDotacion, id);

    await logHistorialEvent({
      user,
      sedeId: existing.pedido.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      tipo: "Eliminación",
      mensaje: "Pedido eliminado",
    });

    return true;
  },
};

const resolvePedidoRepository = (): IPedidoRepository =>
  isDemoMode() ? demoPedidoRepository : dataversePedidoRepository;

export const listPedidos = async (user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]> =>
  resolvePedidoRepository().list(user, filters);

export const createPedido = async (user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion> =>
  resolvePedidoRepository().create(user, input);

export const getPedidoDetail = async (user: AppUser, id: string): Promise<PedidoDetail | null> =>
  resolvePedidoRepository().getDetail(user, id);

export const updatePedido = async (
  user: AppUser,
  id: string,
  input: PedidoUpdateInput,
): Promise<PedidoDotacion | null> => resolvePedidoRepository().update(user, id, input);

export const deletePedido = async (user: AppUser, id: string): Promise<boolean> =>
  resolvePedidoRepository().delete(user, id);

export const setPedidoStatus = async (
  user: AppUser,
  id: string,
  status: NonNullable<PedidoDotacion["estado"]>,
  eventType: string,
  message: string,
): Promise<PedidoDotacion | null> => {
  const pedido = await updatePedido(user, id, { estado: status });
  if (!pedido) return null;

  await logHistorialEvent({
    user,
    sedeId: pedido.sedeId,
    entidad: "PedidoDotacion",
    entidadId: pedido.id,
    tipo: eventType,
    mensaje: message,
  });

  return pedido;
};
