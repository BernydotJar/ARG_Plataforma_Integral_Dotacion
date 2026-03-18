import "server-only";

import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import { createMockAttachment, createMockId, getMockDb } from "@/lib/dataverse/mock-store";
import type {
  EntityAttachment,
  PedidoDetail,
  PedidoDotacion,
  PedidoDotacionDetalle,
} from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  generateCode,
  getRequestedSede,
  scopeMatchesFilters,
} from "./common";
import { logHistorialEvent } from "./integration.repository";
import type {
  IPedidoRepository,
  ListFilters,
  PedidoAttachmentCreateInput,
  PedidoCreateInput,
  PedidoUpdateInput,
} from "./types";

const unwrap = <T>(payload: T | { data: T }): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toQueryString = (filters?: ListFilters): string => {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.sedeId) params.set("sedeId", filters.sedeId);
  const query = params.toString();
  return query ? `?${query}` : "";
};

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

  async listAttachments(user: AppUser, id: string): Promise<EntityAttachment[]> {
    const db = getMockDb();
    const pedido = db.pedidos.find((entry) => entry.id === id);
    if (!pedido || !scopeMatchesFilters(pedido, user)) return [];

    return db.attachments
      .filter((entry) => entry.entidad === "PedidoDotacion" && entry.entidadId === id)
      .filter((entry) => scopeMatchesFilters(entry, user))
      .sort((a, b) => b.fechaCarga.localeCompare(a.fechaCarga));
  },

  async createAttachment(user: AppUser, id: string, input: PedidoAttachmentCreateInput): Promise<EntityAttachment> {
    const db = getMockDb();
    const pedido = db.pedidos.find((entry) => entry.id === id);
    if (!pedido || !scopeMatchesFilters(pedido, user)) {
      throw new Error("Pedido no encontrado o sin acceso para adjuntar");
    }

    const attachment = createMockAttachment({
      sedeId: pedido.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      nombreArchivo: input.fileName,
      mimeType: input.mimeType,
      tamanoBytes: Buffer.from(input.contentBase64, "base64").byteLength,
      usuario: user.name,
      contenidoBase64: input.contentBase64,
      estado: "Activo",
    });

    db.attachments.unshift(attachment);

    await logHistorialEvent({
      user,
      sedeId: pedido.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      tipo: "Adjunto",
      mensaje: `Archivo adjunto cargado: ${input.fileName}`,
      metadata: { mimeType: input.mimeType, bytes: attachment.tamanoBytes },
    });

    return attachment;
  },

  async deleteAttachment(user: AppUser, id: string, attachmentId: string): Promise<boolean> {
    const db = getMockDb();
    const pedido = db.pedidos.find((entry) => entry.id === id);
    if (!pedido || !scopeMatchesFilters(pedido, user)) return false;

    const index = db.attachments.findIndex(
      (entry) => entry.id === attachmentId && entry.entidad === "PedidoDotacion" && entry.entidadId === id,
    );
    if (index === -1) return false;

    const [removed] = db.attachments.splice(index, 1);

    await logHistorialEvent({
      user,
      sedeId: pedido.sedeId,
      entidad: "PedidoDotacion",
      entidadId: id,
      tipo: "Adjunto",
      mensaje: `Archivo adjunto eliminado: ${removed.nombreArchivo}`,
      metadata: { attachmentId },
    });

    return true;
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
    db.attachments = db.attachments.filter(
      (entry) => !(entry.entidad === "PedidoDotacion" && entry.entidadId === id),
    );

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

const apiPedidoRepository: IPedidoRepository = {
  async list(user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]> {
    const payload = await backendApiFetch<PedidoDotacion[] | { data: PedidoDotacion[] }>(`/pedidos${toQueryString(filters)}`);
    const data = unwrap(payload);
    return data.filter((entry) => scopeMatchesFilters(entry, user, filters));
  },

  async create(_user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion> {
    const payload = await backendApiFetch<PedidoDotacion | { data: PedidoDotacion }>("/pedidos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return unwrap(payload);
  },

  async getDetail(user: AppUser, id: string): Promise<PedidoDetail | null> {
    try {
      const payload = await backendApiFetch<PedidoDetail | { data: PedidoDetail }>(`/pedidos/${id}`);
      const detail = unwrap(payload);
      return scopeMatchesFilters(detail.pedido, user) ? detail : null;
    } catch {
      return null;
    }
  },

  async listAttachments(user: AppUser, id: string): Promise<EntityAttachment[]> {
    const detail = await this.getDetail(user, id);
    if (!detail) return [];

    const payload = await backendApiFetch<EntityAttachment[] | { data: EntityAttachment[] }>(`/pedidos/${id}/adjuntos`);
    const attachments = unwrap(payload);
    return attachments.filter((entry) => scopeMatchesFilters(entry, user));
  },

  async createAttachment(user: AppUser, id: string, input: PedidoAttachmentCreateInput): Promise<EntityAttachment> {
    const detail = await this.getDetail(user, id);
    if (!detail) {
      throw new Error("Pedido no encontrado o sin acceso para adjuntar");
    }

    const payload = await backendApiFetch<EntityAttachment | { data: EntityAttachment }>(`/pedidos/${id}/adjuntos`, {
      method: "POST",
      body: JSON.stringify(input),
    });

    const attachment = unwrap(payload);
    if (!scopeMatchesFilters(attachment, user)) {
      throw new Error("Adjunto creado fuera del alcance de sedes permitido");
    }

    return attachment;
  },

  async deleteAttachment(user: AppUser, id: string, attachmentId: string): Promise<boolean> {
    const detail = await this.getDetail(user, id);
    if (!detail) return false;

    const payload = await backendApiFetch<{ ok?: boolean } | { data: { ok?: boolean } }>(
      `/pedidos/${id}/adjuntos/${attachmentId}`,
      {
        method: "DELETE",
      },
    );

    const result = unwrap(payload);
    return result.ok ?? true;
  },

  async update(user: AppUser, id: string, input: PedidoUpdateInput): Promise<PedidoDotacion | null> {
    const detail = await this.getDetail(user, id);
    if (!detail) return null;

    try {
      const payload = await backendApiFetch<PedidoDotacion | { data: PedidoDotacion }>(`/pedidos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      const updated = unwrap(payload);
      return scopeMatchesFilters(updated, user) ? updated : null;
    } catch {
      return null;
    }
  },

  async delete(user: AppUser, id: string): Promise<boolean> {
    const detail = await this.getDetail(user, id);
    if (!detail) return false;

    const payload = await backendApiFetch<{ ok?: boolean } | { data: { ok?: boolean } }>(`/pedidos/${id}`, {
      method: "DELETE",
    });

    const result = unwrap(payload);
    return result.ok ?? true;
  },
};

const resolvePedidoRepository = (): IPedidoRepository =>
  isDemoMode() ? demoPedidoRepository : apiPedidoRepository;

export const listPedidos = async (user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]> =>
  resolvePedidoRepository().list(user, filters);

export const createPedido = async (user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion> =>
  resolvePedidoRepository().create(user, input);

export const getPedidoDetail = async (user: AppUser, id: string): Promise<PedidoDetail | null> =>
  resolvePedidoRepository().getDetail(user, id);

export const listPedidoAttachments = async (user: AppUser, id: string): Promise<EntityAttachment[]> =>
  resolvePedidoRepository().listAttachments(user, id);

export const createPedidoAttachment = async (
  user: AppUser,
  id: string,
  input: PedidoAttachmentCreateInput,
): Promise<EntityAttachment> => resolvePedidoRepository().createAttachment(user, id, input);

export const deletePedidoAttachment = async (
  user: AppUser,
  id: string,
  attachmentId: string,
): Promise<boolean> => resolvePedidoRepository().deleteAttachment(user, id, attachmentId);

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
