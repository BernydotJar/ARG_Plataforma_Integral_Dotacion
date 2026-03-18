import "server-only";

import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import { getMockDb } from "@/lib/dataverse/mock-store";
import type { TicketDetail, TicketMantenimiento } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  createMockEntityId,
  generateCode,
  getRequestedSede,
  scopeMatchesFilters,
} from "./common";
import { logHistorialEvent } from "./integration.repository";
import type {
  IMantenimientoRepository,
  ListFilters,
  TicketCreateInput,
  TicketUpdateInput,
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

const apiMantenimientoRepository: IMantenimientoRepository = {
  async listTickets(user: AppUser, filters?: ListFilters): Promise<TicketMantenimiento[]> {
    const payload = await backendApiFetch<TicketMantenimiento[] | { data: TicketMantenimiento[] }>(
      `/mantenimiento/tickets${toQueryString(filters)}`,
    );

    const data = unwrap(payload);
    return data.filter((entry) => scopeMatchesFilters(entry, user, filters));
  },

  async createTicket(user: AppUser, input: TicketCreateInput): Promise<TicketMantenimiento> {
    const payload = await backendApiFetch<TicketMantenimiento | { data: TicketMantenimiento }>(
      "/mantenimiento/tickets",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    const created = unwrap(payload);
    if (!scopeMatchesFilters(created, user)) {
      throw new Error("Ticket creado fuera del alcance de sedes permitido");
    }

    return created;
  },

  async getTicketDetail(user: AppUser, id: string): Promise<TicketDetail | null> {
    try {
      const payload = await backendApiFetch<TicketDetail | { data: TicketDetail }>(`/mantenimiento/tickets/${id}`);
      const detail = unwrap(payload);
      return scopeMatchesFilters(detail.ticket, user) ? detail : null;
    } catch {
      return null;
    }
  },

  async updateTicket(user: AppUser, id: string, input: TicketUpdateInput): Promise<TicketMantenimiento | null> {
    const detail = await this.getTicketDetail(user, id);
    if (!detail) return null;

    try {
      const payload = await backendApiFetch<TicketMantenimiento | { data: TicketMantenimiento }>(
        `/mantenimiento/tickets/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        },
      );

      const updated = unwrap(payload);
      return scopeMatchesFilters(updated, user) ? updated : null;
    } catch {
      return null;
    }
  },
};

const resolveMantenimientoRepository = (): IMantenimientoRepository =>
  isDemoMode() ? demoMantenimientoRepository : apiMantenimientoRepository;

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
