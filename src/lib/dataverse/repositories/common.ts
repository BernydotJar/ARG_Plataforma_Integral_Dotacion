import { canAccessSede } from "@/lib/auth/roles";
import { env } from "@/lib/config/env";
import { createMockEvent, createMockId, getMockDb } from "@/lib/dataverse/mock-store";
import type {
  ActividadMantenimiento,
  CentroCosto,
  ChecklistCalidad,
  DefectoCalidad,
  HistorialEvento,
  InspeccionCalidad,
  Inventario,
  KitDotacion,
  KitDotacionItem,
  MovimientoInventario,
  PedidoDotacion,
  PedidoDotacionDetalle,
  TicketMantenimiento,
} from "@/lib/dataverse/types";
import {
  INSPECCION_STATUSES,
  MOVIMIENTO_STATUSES,
  PEDIDO_STATUSES,
  TICKET_STATUSES,
} from "@/lib/dataverse/types";
import type { AppUser } from "@/lib/types/app";

import {
  DEFAULT_HISTORY_EVENT_TYPE,
  DEFAULT_HISTORY_STATUS,
  DEFAULT_INVENTARIO_STATUS,
  DEFAULT_MOVIMIENTO_STATUS,
  DEFAULT_PEDIDO_STATUS,
  DEFAULT_SEDE_FALLBACK,
  DEFAULT_TICKET_STATUS,
} from "./constants";
import type { ListFilters } from "./types";

export const normalizeText = (value: string): string => value.toLowerCase().trim();

export const applyTextSearch = <T>(
  items: T[],
  query: string | undefined,
  getFields: (item: T) => Array<string | undefined>,
): T[] => {
  if (!query) return items;

  const normalizedQuery = normalizeText(query);
  return items.filter((item) =>
    getFields(item)
      .filter((field): field is string => Boolean(field))
      .some((field) => normalizeText(field).includes(normalizedQuery)),
  );
};

export const scopeMatchesFilters = <T extends { estado?: string; sedeId: string }>(
  item: T,
  user: AppUser,
  filters?: ListFilters,
): boolean => {
  if (!user.sedeIds.includes("*") && !user.sedeIds.includes(item.sedeId)) return false;
  if (filters?.sedeId && filters.sedeId !== item.sedeId) return false;
  if (filters?.status && filters.status !== "Todos" && item.estado !== filters.status) return false;
  return true;
};

export const getRequestedSede = (user: AppUser, requested?: string): string => {
  const fallback = user.preferredSedeId || user.sedeIds.find((sedeId) => sedeId !== "*") || env.defaultSedes[0] || DEFAULT_SEDE_FALLBACK;

  if (!requested) return fallback;
  if (user.sedeIds.includes("*")) return requested;

  if (!canAccessSede(user, requested)) {
    throw new Error(`El usuario no puede operar sobre la sede ${requested}`);
  }

  return requested;
};

export const generateCode = (prefix: string): string =>
  `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const asEnumValue = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] => {
  const candidate = String(value || "");
  return (allowed as readonly string[]).includes(candidate) ? (candidate as T[number]) : fallback;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si", "sí"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
};

const asKitGenero = (value: unknown): KitDotacion["genero"] => {
  const candidate = String(value || "").trim();
  if (candidate === "Masculino" || candidate === "Femenino" || candidate === "Unisex") {
    return candidate;
  }
  return "Unisex";
};

export const rowToPedido = (row: Record<string, unknown>): PedidoDotacion => ({
  id: String(row.crf1_pedidodotacionid || row.pedidodotacionid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  codigo: String(row.crf1_codigo || row.codigo || "PD-SIN-CODIGO"),
  empleadoNombre: String(row.crf1_empleadonombre || row.empleadonombre || "N/A"),
  areaNombre: String(row.crf1_areanombre || row.areanombre || "N/A"),
  observacion: row.crf1_observacion ? String(row.crf1_observacion) : undefined,
  totalItems: Number(row.crf1_totalitems || row.totalitems || 0),
  prioridad: String(row.crf1_prioridad || row.prioridad || "Media") as PedidoDotacion["prioridad"],
  estado: asEnumValue(row.crf1_estado || row.estado, PEDIDO_STATUSES, DEFAULT_PEDIDO_STATUS),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToPedidoDetalle = (row: Record<string, unknown>, defaultSedeId: string, pedidoId: string): PedidoDotacionDetalle => ({
  id: String(row.crf1_pedidodotaciondetalleid || row.id || ""),
  sedeId: String(row.crf1_sedeid || defaultSedeId),
  pedidoId,
  itemNombre: String(row.crf1_itemnombre || ""),
  talla: String(row.crf1_talla || ""),
  cantidad: Number(row.crf1_cantidad || 0),
  estado: String(row.crf1_estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToMovimiento = (row: Record<string, unknown>): MovimientoInventario => ({
  id: String(row.crf1_movimientoinventarioid || row.movimientoinventarioid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  tipo: String(row.crf1_tipo || row.tipo || "Ingreso") as MovimientoInventario["tipo"],
  itemNombre: String(row.crf1_itemnombre || row.itemnombre || ""),
  bodegaNombre: String(row.crf1_bodeganombre || row.bodeganombre || ""),
  ubicacionNombre: String(row.crf1_ubicacionnombre || row.ubicacionnombre || ""),
  cantidad: Number(row.crf1_cantidad || row.cantidad || 0),
  motivo: row.crf1_motivo ? String(row.crf1_motivo) : undefined,
  fecha: String(row.crf1_fecha || row.fecha || new Date().toISOString()),
  estado: asEnumValue(row.crf1_estado || row.estado, MOVIMIENTO_STATUSES, DEFAULT_MOVIMIENTO_STATUS),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToInventario = (row: Record<string, unknown>): Inventario => ({
  id: String(row.crf1_inventarioid || row.inventarioid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  itemNombre: String(row.crf1_itemnombre || row.itemnombre || ""),
  bodegaNombre: String(row.crf1_bodeganombre || row.bodeganombre || ""),
  ubicacionNombre: String(row.crf1_ubicacionnombre || row.ubicacionnombre || ""),
  stockActual: Number(row.crf1_stockactual || row.stockactual || 0),
  stockMinimo: Number(row.crf1_stockminimo || row.stockminimo || 0),
  estado: String(row.crf1_estado || row.estado || DEFAULT_INVENTARIO_STATUS),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToCentroCosto = (row: Record<string, unknown>): CentroCosto => ({
  id: String(row.crf1_centrocostoid || row.centrocostoid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  codigo: String(row.crf1_codigo || row.codigo || ""),
  nombre: String(row.crf1_nombre || row.nombre || ""),
  estado: String(row.crf1_estado || row.estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToKit = (row: Record<string, unknown>): KitDotacion => ({
  id: String(row.crf1_kitdotacionid || row.kitdotacionid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  nombre: String(row.crf1_nombre || row.nombre || "Kit sin nombre"),
  genero: asKitGenero(row.crf1_genero || row.genero),
  cargo: String(row.crf1_cargo || row.cargo || ""),
  ciclo: String(row.crf1_ciclo || row.ciclo || ""),
  estado: String(row.crf1_estado || row.estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToKitItem = (row: Record<string, unknown>, defaultSedeId: string): KitDotacionItem => ({
  id: String(row.crf1_kitdotacionitemid || row.kitdotacionitemid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || defaultSedeId),
  kitId: String(row.crf1_kitid || row._crf1_kitid_value || row.crf1_kitdotacionid || row.kitid || ""),
  itemNombre: String(row.crf1_itemnombre || row.itemnombre || ""),
  cantidad: Number(row.crf1_cantidad || row.cantidad || 0),
  obligatorio: asBoolean(row.crf1_obligatorio ?? row.obligatorio, false),
  estado: String(row.crf1_estado || row.estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToTicket = (row: Record<string, unknown>): TicketMantenimiento => ({
  id: String(row.crf1_ticketmantenimientoid || row.ticketmantenimientoid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  codigo: String(row.crf1_codigo || row.codigo || "TM-SIN-CODIGO"),
  equipoNombre: String(row.crf1_equiponombre || row.equiponombre || ""),
  prioridad: String(row.crf1_prioridad || row.prioridad || "Media") as TicketMantenimiento["prioridad"],
  descripcion: String(row.crf1_descripcion || row.descripcion || ""),
  tecnicoAsignado: row.crf1_tecnicoasignado ? String(row.crf1_tecnicoasignado) : undefined,
  fechaReporte: String(row.crf1_fechareporte || row.fechareporte || new Date().toISOString()),
  estado: asEnumValue(row.crf1_estado || row.estado, TICKET_STATUSES, DEFAULT_TICKET_STATUS),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToInspeccion = (row: Record<string, unknown>): InspeccionCalidad => ({
  id: String(row.crf1_inspeccioncalidadid || row.inspeccioncalidadid || row.id || ""),
  sedeId: String(row.crf1_sedeid || row.sedeid || DEFAULT_SEDE_FALLBACK),
  codigo: String(row.crf1_codigo || row.codigo || "IC-SIN-CODIGO"),
  inspector: String(row.crf1_inspector || row.inspector || "N/A"),
  lote: String(row.crf1_lote || row.lote || "N/A"),
  resultado: String(row.crf1_resultado || row.resultado || "Conforme") as InspeccionCalidad["resultado"],
  fechaInspeccion: String(row.crf1_fechainspeccion || row.fechainspeccion || row.createdon || new Date().toISOString()),
  observacion: row.crf1_observacion ? String(row.crf1_observacion) : undefined,
  estado: asEnumValue(row.crf1_estado || row.estado, INSPECCION_STATUSES, "Abierta"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToChecklist = (
  row: Record<string, unknown>,
  defaults: { sedeId: string; inspeccionId: string },
): ChecklistCalidad => ({
  id: String(row.crf1_checklistcalidadid || row.checklistcalidadid || row.id || ""),
  sedeId: String(row.crf1_sedeid || defaults.sedeId),
  inspeccionId: String(row.crf1_inspeccionid || defaults.inspeccionId),
  criterioChecklistId: String(row.crf1_criteriochecklistid || row.criteriochecklistid || ""),
  cumple: Boolean(row.crf1_cumple ?? row.cumple ?? false),
  observacion: row.crf1_observacion ? String(row.crf1_observacion) : undefined,
  estado: String(row.crf1_estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToDefecto = (
  row: Record<string, unknown>,
  defaults: { sedeId: string; inspeccionId: string },
): DefectoCalidad => ({
  id: String(row.crf1_defectocalidadid || row.defectocalidadid || row.id || ""),
  sedeId: String(row.crf1_sedeid || defaults.sedeId),
  inspeccionId: String(row.crf1_inspeccionid || defaults.inspeccionId),
  tipoDefectoId: String(row.crf1_tipodefectoid || row.tipodefectoid || ""),
  severidadId: String(row.crf1_severidadid || row.severidadid || ""),
  descripcion: String(row.crf1_descripcion || row.descripcion || ""),
  estado: String(row.crf1_estado || "Activo"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToActividad = (
  row: Record<string, unknown>,
  defaultSedeId: string,
  ticketId: string,
): ActividadMantenimiento => ({
  id: String(row.crf1_actividadmantenimientoid || row.id || ""),
  sedeId: String(row.crf1_sedeid || defaultSedeId),
  ticketId,
  descripcion: String(row.crf1_descripcion || ""),
  fechaActividad: String(row.crf1_fechaactividad || row.createdon || new Date().toISOString()),
  responsable: String(row.crf1_responsable || "N/A"),
  estado: String(row.crf1_estado || "Registrada"),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const rowToHistorial = (
  row: Record<string, unknown>,
  defaults: { sedeId: string; entidad: string; entidadId: string },
): HistorialEvento => ({
  id: String(row.crf1_historialeventoid || row.id || ""),
  sedeId: String(row.crf1_sedeid || defaults.sedeId),
  entidad: String(row.crf1_entidad || defaults.entidad),
  entidadId: String(row.crf1_entidadid || defaults.entidadId),
  tipo: String(row.crf1_tipo || DEFAULT_HISTORY_EVENT_TYPE),
  mensaje: String(row.crf1_mensaje || ""),
  usuario: String(row.crf1_usuario || "Sistema"),
  fecha: String(row.crf1_fecha || row.createdon || new Date().toISOString()),
  metadata: {},
  estado: String(row.crf1_estado || DEFAULT_HISTORY_STATUS),
  createdOn: String(row.createdon || new Date().toISOString()),
  modifiedOn: String(row.modifiedon || new Date().toISOString()),
});

export const createMockEntityId = (prefix: string): string => createMockId(prefix);

export const addMockHistorialEvent = (params: {
  user: AppUser;
  sedeId: string;
  entidad: string;
  entidadId: string;
  tipo: string;
  mensaje: string;
  metadata?: Record<string, unknown>;
}): HistorialEvento => {
  const db = getMockDb();

  const event = createMockEvent({
    sedeId: params.sedeId,
    entidad: params.entidad,
    entidadId: params.entidadId,
    tipo: params.tipo,
    mensaje: params.mensaje,
    usuario: params.user.name,
    metadata: params.metadata,
    estado: DEFAULT_HISTORY_STATUS,
  });

  db.historial.unshift(event);
  return event;
};
