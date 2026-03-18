import "server-only";

import { backendApiFetch } from "@/lib/backend/client";
import { isDemoMode } from "@/lib/config/env";
import { getMockDb } from "@/lib/dataverse/mock-store";
import type { Inventario, MovimientoInventario } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  createMockEntityId,
  getRequestedSede,
  scopeMatchesFilters,
} from "./common";
import {
  DEFAULT_MOVIMIENTO_STATUS_AJUSTE,
  DEFAULT_MOVIMIENTO_STATUS,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  IInventarioRepository,
  ListFilters,
  MovimientoCreateInput,
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

const demoInventarioRepository: IInventarioRepository = {
  async listMovimientos(user: AppUser, filters?: ListFilters): Promise<MovimientoInventario[]> {
    const db = getMockDb();
    const scoped = db.movimientos.filter((entry) => scopeMatchesFilters(entry, user, filters));

    return applyTextSearch(scoped, filters?.query, (entry) => [entry.itemNombre, entry.bodegaNombre, entry.ubicacionNombre])
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async createMovimiento(user: AppUser, input: MovimientoCreateInput): Promise<MovimientoInventario> {
    const db = getMockDb();
    const now = new Date().toISOString();
    const sedeId = getRequestedSede(user, input.sedeId);

    const movimiento: MovimientoInventario = {
      id: createMockEntityId("mov"),
      sedeId,
      tipo: input.tipo,
      itemNombre: input.itemNombre,
      bodegaNombre: input.bodegaNombre,
      ubicacionNombre: input.ubicacionNombre,
      cantidad: input.cantidad,
      motivo: input.motivo,
      fecha: now,
      estado: input.tipo === "Ajuste" ? DEFAULT_MOVIMIENTO_STATUS_AJUSTE : DEFAULT_MOVIMIENTO_STATUS,
      createdOn: now,
      modifiedOn: now,
    };

    db.movimientos.unshift(movimiento);

    await logHistorialEvent({
      user,
      sedeId,
      entidad: "MovimientoInventario",
      entidadId: movimiento.id,
      tipo: "Creación",
      mensaje: `Movimiento ${movimiento.tipo} registrado`,
      metadata: { ...input },
    });

    return movimiento;
  },

  async updateMovimientoEstado(user: AppUser, id: string, estado: NonNullable<MovimientoInventario["estado"]>): Promise<MovimientoInventario | null> {
    const db = getMockDb();
    const index = db.movimientos.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    const current = db.movimientos[index];
    if (!scopeMatchesFilters(current, user)) return null;

    const updated = {
      ...current,
      estado,
      modifiedOn: new Date().toISOString(),
    };

    db.movimientos[index] = updated;

    await logHistorialEvent({
      user,
      sedeId: current.sedeId,
      entidad: "MovimientoInventario",
      entidadId: id,
      tipo: "Estado",
      mensaje: `Estado actualizado a ${estado}`,
    });

    return updated;
  },

  async listInventario(user: AppUser): Promise<Inventario[]> {
    const db = getMockDb();
    return db.inventario.filter((item) => scopeMatchesFilters(item, user));
  },
};

const apiInventarioRepository: IInventarioRepository = {
  async listMovimientos(user: AppUser, filters?: ListFilters): Promise<MovimientoInventario[]> {
    const payload = await backendApiFetch<MovimientoInventario[] | { data: MovimientoInventario[] }>(
      `/inventario/movimientos${toQueryString(filters)}`,
    );

    const data = unwrap(payload);
    return data.filter((entry) => scopeMatchesFilters(entry, user, filters));
  },

  async createMovimiento(user: AppUser, input: MovimientoCreateInput): Promise<MovimientoInventario> {
    const payload = await backendApiFetch<MovimientoInventario | { data: MovimientoInventario }>(
      "/inventario/movimientos",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    const created = unwrap(payload);
    if (!scopeMatchesFilters(created, user)) {
      throw new Error("Movimiento creado fuera del alcance de sedes permitido");
    }

    return created;
  },

  async updateMovimientoEstado(user: AppUser, id: string, estado: NonNullable<MovimientoInventario["estado"]>): Promise<MovimientoInventario | null> {
    const hasAccess = (await this.listMovimientos(user)).some((entry) => entry.id === id);
    if (!hasAccess) return null;

    try {
      const payload = await backendApiFetch<MovimientoInventario | { data: MovimientoInventario }>(
        `/inventario/movimientos/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ estado }),
        },
      );

      const updated = unwrap(payload);
      return scopeMatchesFilters(updated, user) ? updated : null;
    } catch {
      return null;
    }
  },

  async listInventario(user: AppUser): Promise<Inventario[]> {
    const payload = await backendApiFetch<Inventario[] | { data: Inventario[] }>("/inventario/stock");
    const data = unwrap(payload);
    return data.filter((item) => scopeMatchesFilters(item, user));
  },
};

const resolveInventarioRepository = (): IInventarioRepository =>
  isDemoMode() ? demoInventarioRepository : apiInventarioRepository;

export const listMovimientos = async (user: AppUser, filters?: ListFilters): Promise<MovimientoInventario[]> =>
  resolveInventarioRepository().listMovimientos(user, filters);

export const createMovimiento = async (user: AppUser, input: MovimientoCreateInput): Promise<MovimientoInventario> =>
  resolveInventarioRepository().createMovimiento(user, input);

export const updateMovimientoEstado = async (
  user: AppUser,
  id: string,
  estado: NonNullable<MovimientoInventario["estado"]>,
): Promise<MovimientoInventario | null> => resolveInventarioRepository().updateMovimientoEstado(user, id, estado);

export const listInventario = async (user: AppUser): Promise<Inventario[]> =>
  resolveInventarioRepository().listInventario(user);
