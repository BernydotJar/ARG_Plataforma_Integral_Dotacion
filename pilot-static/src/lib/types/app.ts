export const APP_ROLES = [
  "SuperAdmin",
  "AdminLocal",
  "UsuarioPedidos",
  "UsuarioFinal",
  "OperarioBodega",
  "InspectorCalidad",
  "TecnicoMantenimiento",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface AppUser {
  id: string;
  tenantId?: string;
  name: string;
  email?: string;
  roles: AppRole[];
  sedeIds: string[];
  preferredSedeId?: string;
}

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
}

export interface PendingItem {
  id: string;
  tipo: "Pedido" | "AjusteInventario" | "Ticket" | "Calidad";
  titulo: string;
  estado: string;
  fecha: string;
  href: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export type PedidoEstado = "Borrador" | "EnAprobacion" | "Aprobado" | "EnviadoSAP" | "Rechazado";
export type Prioridad = "Baja" | "Media" | "Alta";

export interface PedidoDotacion {
  id: string;
  codigo: string;
  empleadoNombre: string;
  areaNombre: string;
  prioridad: Prioridad;
  estado: PedidoEstado;
}

export interface Inventario {
  id: string;
  itemNombre: string;
  bodegaNombre: string;
  ubicacionNombre: string;
  stockActual: number;
  stockMinimo: number;
}

export type MovimientoTipo = "Ingreso" | "Salida" | "Ajuste";

export interface MovimientoInventario {
  id: string;
  tipo: MovimientoTipo;
  itemNombre: string;
  cantidad: number;
  motivo?: string;
  bodegaNombre: string;
  ubicacionNombre: string;
  estado: "Registrado" | "PendienteAprobacion" | "EnAprobacion" | "Aprobado" | "Rechazado";
  fecha: string;
}

export interface InspeccionCalidad {
  id: string;
  codigo: string;
  inspector: string;
  lote: string;
  resultado: "Conforme" | "NoConforme";
  estado: "Abierta" | "Cerrada";
}

export interface TicketMantenimiento {
  id: string;
  codigo: string;
  equipoNombre: string;
  prioridad: Prioridad;
  tecnicoAsignado?: string;
  estado: "Abierto" | "EnProceso" | "Cerrado";
}

export interface CatalogEntry {
  id: string;
  nombre?: string;
  codigo?: string;
}

export interface UserRoleSample {
  id: string;
  nombre: string;
  correo: string;
  roles: AppRole[];
  sedes: string[];
}
