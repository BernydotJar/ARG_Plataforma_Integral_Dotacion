import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { getDataverseClient } from "@/lib/dataverse/client";
import { getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type { TicketDetail, TicketMantenimiento } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  createMockEntityId,
  generateCode,
  getRequestedSede,
  rowToActividad,
  rowToHistorial,
  rowToTicket,
  scopeMatchesFilters,
} from "./common";
import {
  QUERY_TOP_DEFAULT,
  QUERY_TOP_DETAIL,
  QUERY_TOP_HISTORY,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  IMantenimientoRepository,
  ListFilters,
  TicketCreateInput,
  TicketUpdateInput,
} from "./types";

const demoMantenimientoRepository: IMantenimientoRepository = {
  async listTickets(user: AppUser, filters?: ListFilters): Promise<TicketMantenimiento[]> {
    const db = getMockDb();
    const scoped = db.tickets.filter((entry) => scopeMatchesFilters(entry, user, filters));

    return applyTextSearch(scoped, filters?.query, (entry) => [entry.codigo, entry.equipoNombre, entry.descripcion])
      .sort((a, b) => b.fechaReporte.localeCompare(a.fechaReporte));
  },

  async createTicket(user: AppUser, input: TicketCreateInput): Promise<TicketMantenimiento> {
    const db = getMockDb();
    const sedeId = getRequestedSede(user, input.sedeId);
    const now = new Date().toISOString();

    const ticket: TicketMantenimiento = {
      id: createMockEntityId("tk"),
      sedeId,
      codigo: generateCode("TM"),
      equipoNombre: input.equipoNombre,
      prioridad: input.prioridad,
      descripcion: input.descripcion,
      tecnicoAsignado: input.tecnicoAsignado,
      fechaReporte: now,
      estado: "Abierto",
      createdOn: now,
      modifiedOn: now,
    };

    db.tickets.unshift(ticket);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "TicketMantenimiento",
      entidadId: ticket.id,
      tipo: "Creación",
      mensaje: "Ticket de mantenimiento creado",
    });

    return ticket;
  },

  async getTicketDetail(user: AppUser, id: string): Promise<TicketDetail | null> {
    const db = getMockDb();
    const ticket = db.tickets.find((entry) => entry.id === id);
    if (!ticket || !scopeMatchesFilters(ticket, user)) return null;

    return {
      ticket,
      actividades: db.actividades
        .filter((entry) => entry.ticketId === id)
        .sort((a, b) => b.fechaActividad.localeCompare(a.fechaActividad)),
      historial: db.historial
        .filter((entry) => entry.entidad === "TicketMantenimiento" && entry.entidadId === id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    };
  },

  async updateTicket(user: AppUser, id: string, input: TicketUpdateInput): Promise<TicketMantenimiento | null> {
    const db = getMockDb();
    const index = db.tickets.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    const current = db.tickets[index];
    if (!scopeMatchesFilters(current, user)) return null;

    const updated = {
      ...current,
      prioridad: input.prioridad ?? current.prioridad,
      descripcion: input.descripcion ?? current.descripcion,
      tecnicoAsignado: input.tecnicoAsignado ?? current.tecnicoAsignado,
      estado: input.estado ?? current.estado,
      modifiedOn: new Date().toISOString(),
    };

    db.tickets[index] = updated;

    await logHistorialEvent({
      user,
      sedeId: current.sedeId,
      entidad: "TicketMantenimiento",
      entidadId: id,
      tipo: "Actualización",
      mensaje: "Ticket actualizado",
      metadata: { ...input },
    });

    return updated;
  },
};

const dataverseMantenimientoRepository: IMantenimientoRepository = {
  async listTickets(user: AppUser, filters?: ListFilters): Promise<TicketMantenimiento[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.TicketMantenimiento, {
      top: QUERY_TOP_DEFAULT,
      orderBy: "createdon desc",
    });

    const scoped = rows.map(rowToTicket).filter((entry) => scopeMatchesFilters(entry, user, filters));
    return applyTextSearch(scoped, filters?.query, (entry) => [entry.codigo, entry.equipoNombre, entry.descripcion]);
  },

  async createTicket(user: AppUser, input: TicketCreateInput): Promise<TicketMantenimiento> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);

    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.TicketMantenimiento, {
      crf1_codigo: generateCode("TM"),
      crf1_equiponombre: input.equipoNombre,
      crf1_prioridad: input.prioridad,
      crf1_descripcion: input.descripcion,
      crf1_tecnicoasignado: input.tecnicoAsignado,
      crf1_fechareporte: new Date().toISOString(),
      crf1_estado: "Abierto",
      crf1_sedeid: sedeId,
    });

    const ticket = rowToTicket(created);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "TicketMantenimiento",
      entidadId: ticket.id,
      tipo: "Creación",
      mensaje: "Ticket de mantenimiento creado",
    });

    return ticket;
  },

  async getTicketDetail(user: AppUser, id: string): Promise<TicketDetail | null> {
    const client = getDataverseClient();
    const ticketRow = await client.get<Record<string, unknown>>(dataverseEntitySet.TicketMantenimiento, id);
    const ticket = rowToTicket(ticketRow);
    if (!scopeMatchesFilters(ticket, user)) return null;

    const actividadRows = await client.list<Record<string, unknown>>(dataverseEntitySet.ActividadMantenimiento, {
      filter: `crf1_ticketid eq ${id}`,
      top: QUERY_TOP_DETAIL,
      orderBy: "createdon desc",
    });

    const historialRows = await client.list<Record<string, unknown>>(dataverseEntitySet.HistorialEvento, {
      filter: `crf1_entidad eq 'TicketMantenimiento' and crf1_entidadid eq '${id}'`,
      top: QUERY_TOP_HISTORY,
      orderBy: "createdon desc",
    });

    return {
      ticket,
      actividades: actividadRows.map((row) => rowToActividad(row, ticket.sedeId, id)),
      historial: historialRows.map((row) =>
        rowToHistorial(row, {
          sedeId: ticket.sedeId,
          entidad: "TicketMantenimiento",
          entidadId: id,
        }),
      ),
    };
  },

  async updateTicket(user: AppUser, id: string, input: TicketUpdateInput): Promise<TicketMantenimiento | null> {
    const existing = await this.getTicketDetail(user, id);
    if (!existing) return null;

    const client = getDataverseClient();
    await client.update(dataverseEntitySet.TicketMantenimiento, id, {
      ...(input.prioridad !== undefined ? { crf1_prioridad: input.prioridad } : {}),
      ...(input.descripcion !== undefined ? { crf1_descripcion: input.descripcion } : {}),
      ...(input.tecnicoAsignado !== undefined ? { crf1_tecnicoasignado: input.tecnicoAsignado } : {}),
      ...(input.estado !== undefined ? { crf1_estado: input.estado } : {}),
    });

    await logHistorialEvent({
      user,
      sedeId: existing.ticket.sedeId,
      entidad: "TicketMantenimiento",
      entidadId: id,
      tipo: "Actualización",
      mensaje: "Ticket actualizado",
      metadata: { ...input },
    });

    return (await this.getTicketDetail(user, id))?.ticket || null;
  },
};

const resolveMantenimientoRepository = (): IMantenimientoRepository =>
  isDemoMode() ? demoMantenimientoRepository : dataverseMantenimientoRepository;

export const listTickets = async (user: AppUser, filters?: ListFilters): Promise<TicketMantenimiento[]> =>
  resolveMantenimientoRepository().listTickets(user, filters);

export const createTicket = async (user: AppUser, input: TicketCreateInput): Promise<TicketMantenimiento> =>
  resolveMantenimientoRepository().createTicket(user, input);

export const getTicketDetail = async (user: AppUser, id: string): Promise<TicketDetail | null> =>
  resolveMantenimientoRepository().getTicketDetail(user, id);

export const updateTicket = async (
  user: AppUser,
  id: string,
  input: TicketUpdateInput,
): Promise<TicketMantenimiento | null> => resolveMantenimientoRepository().updateTicket(user, id, input);
