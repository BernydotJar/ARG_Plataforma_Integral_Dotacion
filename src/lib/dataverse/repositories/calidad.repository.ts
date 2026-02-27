import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { getDataverseClient } from "@/lib/dataverse/client";
import { getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type { InspeccionCalidad, InspeccionDetail } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  createMockEntityId,
  generateCode,
  getRequestedSede,
  rowToChecklist,
  rowToDefecto,
  rowToHistorial,
  rowToInspeccion,
  scopeMatchesFilters,
} from "./common";
import {
  QUERY_TOP_DEFAULT,
  QUERY_TOP_DETAIL,
  QUERY_TOP_HISTORY,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  ICalidadRepository,
  InspeccionCreateInput,
  ListFilters,
} from "./types";

const baseMockCalidadRepository: ICalidadRepository = {
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

const dataverseCalidadRepository: ICalidadRepository = {
  async listInspecciones(user: AppUser, filters?: ListFilters): Promise<InspeccionCalidad[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.InspeccionCalidad, {
      orderBy: "createdon desc",
      top: QUERY_TOP_DEFAULT,
    });

    const scoped = rows.map(rowToInspeccion).filter((entry) => scopeMatchesFilters(entry, user, filters));
    return applyTextSearch(scoped, filters?.query, (entry) => [entry.codigo, entry.inspector, entry.lote]);
  },

  async createInspeccion(user: AppUser, input: InspeccionCreateInput): Promise<InspeccionCalidad> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);
    const now = new Date().toISOString();

    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.InspeccionCalidad, {
      crf1_codigo: generateCode("IC"),
      crf1_inspector: input.inspector,
      crf1_lote: input.lote,
      crf1_resultado: input.resultado,
      crf1_fechainspeccion: now,
      crf1_observacion: input.observacion,
      crf1_estado: "Abierta",
      crf1_sedeid: sedeId,
    });

    const inspeccion = rowToInspeccion(created);

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
    const client = getDataverseClient();
    const inspeccionRow = await client.get<Record<string, unknown>>(dataverseEntitySet.InspeccionCalidad, id);
    const inspeccion = rowToInspeccion(inspeccionRow);
    if (!scopeMatchesFilters(inspeccion, user)) return null;

    const checklistRows = await client.list<Record<string, unknown>>(dataverseEntitySet.ChecklistCalidad, {
      filter: `crf1_inspeccionid eq ${id}`,
      top: QUERY_TOP_DETAIL,
      orderBy: "createdon desc",
    });

    const defectoRows = await client.list<Record<string, unknown>>(dataverseEntitySet.DefectoCalidad, {
      filter: `crf1_inspeccionid eq ${id}`,
      top: QUERY_TOP_DETAIL,
      orderBy: "createdon desc",
    });

    const historialRows = await client.list<Record<string, unknown>>(dataverseEntitySet.HistorialEvento, {
      filter: `crf1_entidad eq 'InspeccionCalidad' and crf1_entidadid eq '${id}'`,
      top: QUERY_TOP_HISTORY,
      orderBy: "createdon desc",
    });

    return {
      inspeccion,
      checklist: checklistRows.map((row) =>
        rowToChecklist(row, {
          sedeId: inspeccion.sedeId,
          inspeccionId: id,
        }),
      ),
      defectos: defectoRows.map((row) =>
        rowToDefecto(row, {
          sedeId: inspeccion.sedeId,
          inspeccionId: id,
        }),
      ),
      historial: historialRows.map((row) =>
        rowToHistorial(row, {
          sedeId: inspeccion.sedeId,
          entidad: "InspeccionCalidad",
          entidadId: id,
        }),
      ),
    };
  },
};

const resolveCalidadRepository = (): ICalidadRepository => {
  return isDemoMode() ? baseMockCalidadRepository : dataverseCalidadRepository;
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
