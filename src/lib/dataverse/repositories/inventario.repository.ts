import "server-only";

import { isDemoMode } from "@/lib/config/env";
import { getDataverseClient } from "@/lib/dataverse/client";
import { getMockDb } from "@/lib/dataverse/mock-store";
import { dataverseEntitySet } from "@/lib/dataverse/schema";
import type { Inventario, MovimientoInventario } from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  applyTextSearch,
  createMockEntityId,
  getRequestedSede,
  rowToInventario,
  rowToMovimiento,
  scopeMatchesFilters,
} from "./common";
import {
  DEFAULT_MOVIMIENTO_STATUS_AJUSTE,
  DEFAULT_MOVIMIENTO_STATUS,
  QUERY_TOP_DEFAULT,
  QUERY_TOP_LARGE,
} from "./constants";
import { logHistorialEvent } from "./integration.repository";
import type {
  IInventarioRepository,
  ListFilters,
  MovimientoCreateInput,
} from "./types";

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

const dataverseInventarioRepository: IInventarioRepository = {
  async listMovimientos(user: AppUser, filters?: ListFilters): Promise<MovimientoInventario[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.MovimientoInventario, {
      orderBy: "createdon desc",
      top: QUERY_TOP_LARGE,
    });

    const scoped = rows.map(rowToMovimiento).filter((entry) => scopeMatchesFilters(entry, user, filters));
    return applyTextSearch(scoped, filters?.query, (entry) => [entry.itemNombre, entry.bodegaNombre, entry.ubicacionNombre]);
  },

  async createMovimiento(user: AppUser, input: MovimientoCreateInput): Promise<MovimientoInventario> {
    const client = getDataverseClient();
    const sedeId = getRequestedSede(user, input.sedeId);

    const created = await client.create<Record<string, unknown>>(dataverseEntitySet.MovimientoInventario, {
      crf1_tipo: input.tipo,
      crf1_itemnombre: input.itemNombre,
      crf1_bodeganombre: input.bodegaNombre,
      crf1_ubicacionnombre: input.ubicacionNombre,
      crf1_cantidad: input.cantidad,
      crf1_motivo: input.motivo,
      crf1_fecha: new Date().toISOString(),
      crf1_estado: input.tipo === "Ajuste" ? DEFAULT_MOVIMIENTO_STATUS_AJUSTE : DEFAULT_MOVIMIENTO_STATUS,
      crf1_sedeid: sedeId,
    });

    const movimiento = rowToMovimiento(created);

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
    const existing = await this.listMovimientos(user);
    const target = existing.find((entry) => entry.id === id);
    if (!target) return null;

    const client = getDataverseClient();
    await client.update(dataverseEntitySet.MovimientoInventario, id, {
      crf1_estado: estado,
    });

    await logHistorialEvent({
      user,
      sedeId: target.sedeId,
      entidad: "MovimientoInventario",
      entidadId: id,
      tipo: "Estado",
      mensaje: `Estado actualizado a ${estado}`,
    });

    return { ...target, estado };
  },

  async listInventario(user: AppUser): Promise<Inventario[]> {
    const client = getDataverseClient();
    const rows = await client.list<Record<string, unknown>>(dataverseEntitySet.Inventario, {
      top: QUERY_TOP_DEFAULT,
      orderBy: "createdon desc",
    });

    return rows.map(rowToInventario).filter((item) => scopeMatchesFilters(item, user));
  },
};

const resolveInventarioRepository = (): IInventarioRepository =>
  isDemoMode() ? demoInventarioRepository : dataverseInventarioRepository;

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
