export {
  createIntegrationRequest,
  getRuntimeModeLabel,
  logHistorialEvent,
} from "./integration.repository";

export {
  createPedido,
  deletePedido,
  getPedidoDetail,
  listPedidos,
  setPedidoStatus,
  updatePedido,
} from "./pedidos.repository";

export {
  createMovimiento,
  listInventario,
  listMovimientos,
  updateMovimientoEstado,
} from "./inventario.repository";

export {
  createTicket,
  getTicketDetail,
  listTickets,
  updateTicket,
} from "./mantenimiento.repository";

export {
  createInspeccion,
  getInspeccionDetail,
  listInspecciones,
} from "./calidad.repository";

export {
  listCatalogos,
  listUserRoleCatalog,
} from "./admin.repository";

export { getDashboardData } from "./dashboard.service";

export type {
  DashboardData,
  HistorialEventInput,
  InspeccionCreateInput,
  IntegrationRequestInput,
  ListFilters,
  MovimientoCreateInput,
  PedidoCreateInput,
  PedidoUpdateInput,
  RepositoryRuntimeMode,
  TicketCreateInput,
  TicketUpdateInput,
} from "./types";
