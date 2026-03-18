import "server-only";

import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import { getMockDb } from "@/lib/dataverse/mock-store";
import type { InspeccionCalidad, InspeccionDetail } from "@/lib/dataverse/types";
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
  ICalidadRepository,
  InspeccionCreateInput,
  ListFilters,
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

const demoCalidadRepository: ICalidadRepository = {
  async listInspecciones(user: AppUser, filters?: ListFilters): Promise<InspeccionCalidad[]> {
    const db = getMockDb();
    const scoped = db.inspecciones.filter((entry) => scopeMatchesFilters(entry, user, filters));

    return applyTextSearch(scoped, filters?.query, (entry) => [entry.codigo, entry.inspector, entry.lote])
      .sort((a, b) => b.fechaInspeccion.localeCompare(a.fechaInspeccion));
  },

  async createInspeccion(user: AppUser, input: InspeccionCreateInput): Promise<InspeccionCalidad> {
    const db = getMockDb();
    const sedeId = getRequestedSede(user, input.sedeId);
    const now = new Date().toISOString();

    const inspeccion: InspeccionCalidad = {
      id: createMockEntityId("cal"),
      sedeId,
      codigo: generateCode("IC"),
      inspector: input.inspector,
      lote: input.lote,
      resultado: input.resultado,
      fechaInspeccion: now,
      observacion: input.observacion,
      estado: "Abierta",
      createdOn: now,
      modifiedOn: now,
    };

    db.inspecciones.unshift(inspeccion);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "InspeccionCalidad",
      entidadId: inspeccion.id,
      tipo: "Creación",
      mensaje: "Inspección de calidad registrada",
    });

    return inspeccion;
  },

  async getInspeccionDetail(user: AppUser, id: string): Promise<InspeccionDetail | null> {
    const db = getMockDb();
    const inspeccion = db.inspecciones.find((entry) => entry.id === id);
    if (!inspeccion || !scopeMatchesFilters(inspeccion, user)) return null;

    return {
      inspeccion,
      checklist: db.checklist.filter((entry) => entry.inspeccionId === id),
      defectos: db.defectos.filter((entry) => entry.inspeccionId === id),
      historial: db.historial
        .filter((entry) => entry.entidad === "InspeccionCalidad" && entry.entidadId === id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    };
  },
};

const apiCalidadRepository: ICalidadRepository = {
  async listInspecciones(user: AppUser, filters?: ListFilters): Promise<InspeccionCalidad[]> {
    const payload = await backendApiFetch<InspeccionCalidad[] | { data: InspeccionCalidad[] }>(
      `/calidad${toQueryString(filters)}`,
    );

    const data = unwrap(payload);
    return data.filter((entry) => scopeMatchesFilters(entry, user, filters));
  },

  async createInspeccion(user: AppUser, input: InspeccionCreateInput): Promise<InspeccionCalidad> {
    const payload = await backendApiFetch<InspeccionCalidad | { data: InspeccionCalidad }>("/calidad", {
      method: "POST",
      body: JSON.stringify(input),
    });

    const created = unwrap(payload);
    if (!scopeMatchesFilters(created, user)) {
      throw new Error("Inspección creada fuera del alcance de sedes permitido");
    }

    return created;
  },

  async getInspeccionDetail(user: AppUser, id: string): Promise<InspeccionDetail | null> {
    try {
      const payload = await backendApiFetch<InspeccionDetail | { data: InspeccionDetail }>(`/calidad/${id}`);
      const detail = unwrap(payload);
      return scopeMatchesFilters(detail.inspeccion, user) ? detail : null;
    } catch {
      return null;
    }
  },
};

const resolveCalidadRepository = (): ICalidadRepository => {
  return isDemoMode() ? demoCalidadRepository : apiCalidadRepository;
};

export const listInspecciones = async (
  user: AppUser,
  filters?: ListFilters,
): Promise<InspeccionCalidad[]> => resolveCalidadRepository().listInspecciones(user, filters);

export const createInspeccion = async (
  user: AppUser,
  input: InspeccionCreateInput,
): Promise<InspeccionCalidad> => resolveCalidadRepository().createInspeccion(user, input);

export const getInspeccionDetail = async (
  user: AppUser,
  id: string,
): Promise<InspeccionDetail | null> => resolveCalidadRepository().getInspeccionDetail(user, id);
