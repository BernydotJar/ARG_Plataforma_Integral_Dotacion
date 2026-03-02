export const PEDIDO_STATUSES = [
  "Borrador",
  "EnAprobacion",
  "Aprobado",
  "EnviadoSAP",
  "Rechazado",
] as const;
export type EstadoPedidoDotacion = (typeof PEDIDO_STATUSES)[number];

export const MOVIMIENTO_STATUSES = [
  "Registrado",
  "PendienteAprobacion",
  "EnAprobacion",
  "Aprobado",
  "Rechazado",
] as const;
export type EstadoMovimientoInventario = (typeof MOVIMIENTO_STATUSES)[number];

export const TICKET_STATUSES = [
  "Abierto",
  "EnProgreso",
  "Resuelto",
  "Cerrado",
] as const;
export type EstadoTicketMantenimiento = (typeof TICKET_STATUSES)[number];

export const INSPECCION_STATUSES = [
  "Abierta",
  "Cerrada",
  "Cerrado",
] as const;
export type EstadoInspeccionCalidad = (typeof INSPECCION_STATUSES)[number];

export interface EntityBase<TStatus extends string = string> {
  id: string;
  sedeId: string;
  createdOn: string;
  modifiedOn: string;
  estado?: TStatus;
}

export interface Sede extends EntityBase {
  nombre: string;
  codigo: string;
}

export interface Area extends EntityBase {
  nombre: string;
  codigo: string;
}

export interface Bodega extends EntityBase {
  nombre: string;
  areaId?: string;
}

export interface Ubicacion extends EntityBase {
  nombre: string;
  bodegaId?: string;
}

export interface Empleado extends EntityBase {
  identificacion: string;
  nombreCompleto: string;
  areaId?: string;
  cargo?: string;
}

export interface ItemDotacion extends EntityBase {
  sku: string;
  nombre: string;
  categoria?: string;
}

export interface Talla extends EntityBase {
  nombre: string;
  tipoPrenda?: string;
}

export interface Proveedor extends EntityBase {
  nombre: string;
  nit?: string;
}

export interface CentroCosto extends EntityBase {
  codigo: string;
  nombre: string;
}

export interface PedidoDotacion extends EntityBase<EstadoPedidoDotacion> {
  codigo: string;
  empleadoNombre: string;
  areaNombre: string;
  observacion?: string;
  totalItems: number;
  prioridad: "Baja" | "Media" | "Alta";
}

export interface KitDotacion extends EntityBase {
  nombre: string;
  genero: "Masculino" | "Femenino" | "Unisex";
  cargo: string;
  ciclo: string;
}

export interface KitDotacionItem extends EntityBase {
  kitId: string;
  itemNombre: string;
  cantidad: number;
  obligatorio: boolean;
}

export interface PedidoDotacionDetalle extends EntityBase {
  pedidoId: string;
  itemNombre: string;
  talla: string;
  cantidad: number;
}

export interface EntregaDotacion extends EntityBase {
  pedidoId: string;
  fechaEntrega: string;
  recibidoPor: string;
}

export interface HistorialEvento extends EntityBase {
  entidad: string;
  entidadId: string;
  tipo: string;
  mensaje: string;
  usuario: string;
  fecha: string;
  metadata?: Record<string, unknown>;
}

export interface Inventario extends EntityBase {
  itemNombre: string;
  bodegaNombre: string;
  ubicacionNombre: string;
  stockActual: number;
  stockMinimo: number;
}

export interface MovimientoInventario extends EntityBase<EstadoMovimientoInventario> {
  tipo: "Ingreso" | "Salida" | "Ajuste";
  itemNombre: string;
  bodegaNombre: string;
  ubicacionNombre: string;
  cantidad: number;
  motivo?: string;
  fecha: string;
}

export interface InspeccionCalidad extends EntityBase<EstadoInspeccionCalidad> {
  codigo: string;
  inspector: string;
  lote: string;
  resultado: "Conforme" | "NoConforme";
  fechaInspeccion: string;
  observacion?: string;
}

export interface DefectoCalidad extends EntityBase {
  inspeccionId: string;
  tipoDefectoId: string;
  severidadId: string;
  descripcion: string;
}

export interface ChecklistCalidad extends EntityBase {
  inspeccionId: string;
  criterioChecklistId: string;
  cumple: boolean;
  observacion?: string;
}

export interface TipoDefecto extends EntityBase {
  nombre: string;
  codigo: string;
}

export interface Severidad extends EntityBase {
  nombre: string;
  nivel: number;
}

export interface CriterioChecklist extends EntityBase {
  nombre: string;
  categoria?: string;
}

export interface Equipo extends EntityBase {
  codigo: string;
  nombre: string;
  tipo: string;
  areaNombre?: string;
}

export interface TicketMantenimiento extends EntityBase<EstadoTicketMantenimiento> {
  codigo: string;
  equipoNombre: string;
  prioridad: "Baja" | "Media" | "Alta";
  descripcion: string;
  tecnicoAsignado?: string;
  fechaReporte: string;
}

export interface ActividadMantenimiento extends EntityBase {
  ticketId: string;
  descripcion: string;
  fechaActividad: string;
  responsable: string;
}

export interface PlanPreventivo extends EntityBase {
  equipoId: string;
  frecuenciaDias: number;
  fechaProxima: string;
  responsable: string;
}

export interface IntegrationRequest extends EntityBase {
  flujo: string;
  payload: Record<string, unknown>;
  estado: "Pendiente" | "EnProceso" | "Completado" | "Error";
  referencia?: string;
}

export interface EntityAttachment extends EntityBase {
  entidad: string;
  entidadId: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  usuario: string;
  fechaCarga: string;
  contenidoBase64?: string;
}

export interface PedidoDetail {
  pedido: PedidoDotacion;
  detalles: PedidoDotacionDetalle[];
  historial: HistorialEvento[];
}

export interface TicketDetail {
  ticket: TicketMantenimiento;
  actividades: ActividadMantenimiento[];
  historial: HistorialEvento[];
}

export interface InspeccionDetail {
  inspeccion: InspeccionCalidad;
  checklist: ChecklistCalidad[];
  defectos: DefectoCalidad[];
  historial: HistorialEvento[];
}
