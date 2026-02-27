import type {
  InspeccionCalidad,
  InspeccionDetail,
  IntegrationRequest,
  Inventario,
  MovimientoInventario,
  PedidoDetail,
  PedidoDotacion,
  TicketDetail,
  TicketMantenimiento,
} from "@/lib/dataverse/types";
import type { AppUser, DashboardCard, PendingItem } from "@/lib/types/app";

export type RepositoryRuntimeMode = "demo" | "dataverse";

export type ListFilters = {
  query?: string;
  status?: string;
  sedeId?: string;
};

export interface PedidoCreateInput {
  sedeId?: string;
  empleadoNombre: string;
  areaNombre: string;
  observacion?: string;
  prioridad: PedidoDotacion["prioridad"];
  detalles: Array<{
    itemNombre: string;
    talla: string;
    cantidad: number;
  }>;
}

export interface PedidoUpdateInput {
  observacion?: string;
  prioridad?: PedidoDotacion["prioridad"];
  estado?: NonNullable<PedidoDotacion["estado"]>;
}

export interface MovimientoCreateInput {
  sedeId?: string;
  tipo: MovimientoInventario["tipo"];
  itemNombre: string;
  bodegaNombre: string;
  ubicacionNombre: string;
  cantidad: number;
  motivo?: string;
}

export interface TicketCreateInput {
  sedeId?: string;
  equipoNombre: string;
  prioridad: TicketMantenimiento["prioridad"];
  descripcion: string;
  tecnicoAsignado?: string;
}

export interface TicketUpdateInput {
  prioridad?: TicketMantenimiento["prioridad"];
  descripcion?: string;
  tecnicoAsignado?: string;
  estado?: NonNullable<TicketMantenimiento["estado"]>;
}

export interface InspeccionCreateInput {
  sedeId?: string;
  inspector: string;
  lote: string;
  resultado: InspeccionCalidad["resultado"];
  observacion?: string;
}

export interface DashboardData {
  cards: DashboardCard[];
  pendientes: PendingItem[];
}

export interface HistorialEventInput {
  user: AppUser;
  sedeId: string;
  entidad: string;
  entidadId: string;
  tipo: string;
  mensaje: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationRequestInput {
  user: AppUser;
  sedeId: string;
  flujo: string;
  payload: Record<string, unknown>;
}

export interface IPedidoRepository {
  list(user: AppUser, filters?: ListFilters): Promise<PedidoDotacion[]>;
  create(user: AppUser, input: PedidoCreateInput): Promise<PedidoDotacion>;
  getDetail(user: AppUser, id: string): Promise<PedidoDetail | null>;
  update(user: AppUser, id: string, input: PedidoUpdateInput): Promise<PedidoDotacion | null>;
  delete(user: AppUser, id: string): Promise<boolean>;
}

export interface IInventarioRepository {
  listMovimientos(user: AppUser, filters?: ListFilters): Promise<MovimientoInventario[]>;
  createMovimiento(user: AppUser, input: MovimientoCreateInput): Promise<MovimientoInventario>;
  updateMovimientoEstado(user: AppUser, id: string, estado: NonNullable<MovimientoInventario["estado"]>): Promise<MovimientoInventario | null>;
  listInventario(user: AppUser): Promise<Inventario[]>;
}

export interface IMantenimientoRepository {
  listTickets(user: AppUser, filters?: ListFilters): Promise<TicketMantenimiento[]>;
  createTicket(user: AppUser, input: TicketCreateInput): Promise<TicketMantenimiento>;
  getTicketDetail(user: AppUser, id: string): Promise<TicketDetail | null>;
  updateTicket(user: AppUser, id: string, input: TicketUpdateInput): Promise<TicketMantenimiento | null>;
}

export interface ICalidadRepository {
  listInspecciones(user: AppUser, filters?: ListFilters): Promise<InspeccionCalidad[]>;
  createInspeccion(user: AppUser, input: InspeccionCreateInput): Promise<InspeccionCalidad>;
  getInspeccionDetail(user: AppUser, id: string): Promise<InspeccionDetail | null>;
}

export interface IAdminRepository {
  listCatalogos(user: AppUser): Promise<{
    sedes: unknown[];
    areas: unknown[];
    bodegas: unknown[];
    ubicaciones: unknown[];
    empleados: unknown[];
    itemsDotacion: unknown[];
    tallas: unknown[];
    proveedores: unknown[];
    tiposDefecto: unknown[];
    severidades: unknown[];
    criteriosChecklist: unknown[];
    equipos: unknown[];
  }>;
  listUserRoleCatalog(user: AppUser): Promise<{
    availableRoles: readonly string[];
    sampleUsers: Array<{
      id: string;
      nombre: string;
      correo: string;
      roles: string[];
      sedes: string[];
    }>;
  }>;
}

export interface IIntegrationRepository {
  logHistorialEvent(params: HistorialEventInput): Promise<void>;
  createIntegrationRequest(params: IntegrationRequestInput): Promise<IntegrationRequest>;
}
