import { APP_ROLES, type AppUser, type CatalogEntry, type DashboardCard, type InspeccionCalidad, type Inventario, type MovimientoInventario, type PendingItem, type PedidoDotacion, type UserRoleSample, type TicketMantenimiento } from "@/lib/types/app";

export const demoUser: AppUser = {
  id: "pilot-user-001",
  name: "Usuario Demo",
  roles: ["SuperAdmin", "AdminLocal"],
  sedeIds: ["*"],
  email: "usuario.demo@argos.co",
};

export const dashboardCards: DashboardCard[] = [
  {
    id: "pedidos",
    title: "Dotación / Pedidos",
    description: "Solicitudes de dotación y aprobaciones",
    href: "/pedidos",
    count: 1,
  },
  {
    id: "inventario",
    title: "Inventario",
    description: "Movimientos, ajustes y stock",
    href: "/inventario",
    count: 1,
  },
  {
    id: "calidad",
    title: "Calidad",
    description: "Inspecciones y defectos",
    href: "/calidad",
    count: 1,
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    description: "Tickets correctivos y preventivos",
    href: "/mantenimiento",
    count: 1,
  },
];

export const pendingItems: PendingItem[] = [
  {
    id: "pending-ticket-001",
    tipo: "Ticket",
    titulo: "TM-2026-0001 - Transportador Principal",
    estado: "Abierto",
    fecha: "2026-02-26T23:26:47.000Z",
    href: "/mantenimiento",
  },
];

export const pedidos: PedidoDotacion[] = [
  {
    id: "PED-2026-0001",
    codigo: "PD-2026-0001",
    empleadoNombre: "Carlos Mejía",
    areaNombre: "Producción",
    prioridad: "Alta",
    estado: "EnAprobacion",
  },
  {
    id: "PED-2026-0002",
    codigo: "PD-2026-0002",
    empleadoNombre: "Ana Díaz",
    areaNombre: "Mantenimiento",
    prioridad: "Media",
    estado: "Aprobado",
  },
  {
    id: "PED-2026-0003",
    codigo: "PD-2026-0003",
    empleadoNombre: "Luis Ramírez",
    areaNombre: "Calidad",
    prioridad: "Baja",
    estado: "Borrador",
  },
];

export const inventarioStock: Inventario[] = [
  {
    id: "INV-1",
    itemNombre: "Casco industrial",
    bodegaNombre: "Bodega Principal",
    ubicacionNombre: "Pasillo A1",
    stockActual: 180,
    stockMinimo: 80,
  },
  {
    id: "INV-2",
    itemNombre: "Guantes nitrilo",
    bodegaNombre: "Bodega Seguridad",
    ubicacionNombre: "Pasillo B2",
    stockActual: 420,
    stockMinimo: 200,
  },
  {
    id: "INV-3",
    itemNombre: "Botas dieléctricas",
    bodegaNombre: "Bodega Principal",
    ubicacionNombre: "Pasillo C3",
    stockActual: 65,
    stockMinimo: 70,
  },
];

export const movimientos: MovimientoInventario[] = [
  {
    id: "MOV-1",
    tipo: "Ingreso",
    itemNombre: "Casco industrial",
    cantidad: 40,
    bodegaNombre: "Bodega Principal",
    ubicacionNombre: "Pasillo A1",
    motivo: "Compra mensual",
    estado: "Registrado",
    fecha: "2026-02-26T14:15:00.000Z",
  },
  {
    id: "MOV-2",
    tipo: "Ajuste",
    itemNombre: "Guantes nitrilo",
    cantidad: -12,
    bodegaNombre: "Bodega Seguridad",
    ubicacionNombre: "Pasillo B2",
    motivo: "Conteo cíclico",
    estado: "PendienteAprobacion",
    fecha: "2026-02-26T09:48:00.000Z",
  },
  {
    id: "MOV-3",
    tipo: "Salida",
    itemNombre: "Botas dieléctricas",
    cantidad: -8,
    bodegaNombre: "Bodega Principal",
    ubicacionNombre: "Pasillo C3",
    motivo: "Entrega de dotación",
    estado: "Aprobado",
    fecha: "2026-02-25T17:20:00.000Z",
  },
];

export const inspecciones: InspeccionCalidad[] = [
  {
    id: "CAL-1",
    codigo: "IC-2026-0041",
    inspector: "María López",
    lote: "L-89-2026",
    resultado: "Conforme",
    estado: "Cerrada",
  },
  {
    id: "CAL-2",
    codigo: "IC-2026-0042",
    inspector: "Jorge Alvarado",
    lote: "L-90-2026",
    resultado: "NoConforme",
    estado: "Abierta",
  },
];

export const tickets: TicketMantenimiento[] = [
  {
    id: "TM-1",
    codigo: "TM-2026-0001",
    equipoNombre: "Transportador Principal",
    prioridad: "Alta",
    tecnicoAsignado: "Pedro Ruiz",
    estado: "Abierto",
  },
  {
    id: "TM-2",
    codigo: "TM-2026-0002",
    equipoNombre: "Compresor Línea 2",
    prioridad: "Media",
    tecnicoAsignado: "Andrea Gómez",
    estado: "EnProceso",
  },
  {
    id: "TM-3",
    codigo: "TM-2026-0003",
    equipoNombre: "Bomba Hidráulica",
    prioridad: "Baja",
    tecnicoAsignado: "",
    estado: "Cerrado",
  },
];

export const catalogosData: Record<string, CatalogEntry[]> = {
  Sede: [
    { id: "SEDE-CENTRAL", nombre: "Sede Central" },
    { id: "SEDE-NORTE", nombre: "Sede Norte" },
  ],
  Area: [
    { id: "AR-PRD", nombre: "Producción" },
    { id: "AR-MNT", nombre: "Mantenimiento" },
  ],
  Bodega: [
    { id: "BOD-PRINC", nombre: "Bodega Principal" },
    { id: "BOD-SEG", nombre: "Bodega Seguridad" },
  ],
  ItemDotacion: [
    { id: "IT-001", codigo: "CAS-IND", nombre: "Casco industrial" },
    { id: "IT-002", codigo: "GUA-NIT", nombre: "Guantes nitrilo" },
  ],
};

export const availableRoles = [...APP_ROLES];

export const sampleUsers: UserRoleSample[] = [
  {
    id: "USR-01",
    nombre: "Daniel Pérez",
    correo: "daniel.perez@argos.co",
    roles: ["AdminLocal", "UsuarioPedidos"],
    sedes: ["SEDE-CENTRAL"],
  },
  {
    id: "USR-02",
    nombre: "Lucía Hernández",
    correo: "lucia.hernandez@argos.co",
    roles: ["OperarioBodega"],
    sedes: ["SEDE-NORTE"],
  },
  {
    id: "USR-03",
    nombre: "Ricardo Morales",
    correo: "ricardo.morales@argos.co",
    roles: ["InspectorCalidad", "TecnicoMantenimiento"],
    sedes: ["SEDE-CENTRAL", "SEDE-NORTE"],
  },
];
