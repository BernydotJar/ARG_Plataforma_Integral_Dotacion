import type {
  ActividadMantenimiento,
  Area,
  Bodega,
  ChecklistCalidad,
  CentroCosto,
  CriterioChecklist,
  DefectoCalidad,
  Empleado,
  EntityAttachment,
  Equipo,
  HistorialEvento,
  InspeccionCalidad,
  IntegrationRequest,
  Inventario,
  ItemDotacion,
  KitDotacion,
  KitDotacionItem,
  MovimientoInventario,
  PedidoDotacion,
  PedidoDotacionDetalle,
  PlanPreventivo,
  Proveedor,
  Sede,
  Severidad,
  Talla,
  TicketMantenimiento,
  TipoDefecto,
  Ubicacion,
} from "@/lib/dataverse/types";

type MockDatabase = {
  attachments: EntityAttachment[];
  sedes: Sede[];
  areas: Area[];
  bodegas: Bodega[];
  ubicaciones: Ubicacion[];
  empleados: Empleado[];
  itemsDotacion: ItemDotacion[];
  tallas: Talla[];
  proveedores: Proveedor[];
  centrosCosto: CentroCosto[];
  kitsDotacion: KitDotacion[];
  kitDotacionItems: KitDotacionItem[];
  pedidos: PedidoDotacion[];
  pedidoDetalles: PedidoDotacionDetalle[];
  historial: HistorialEvento[];
  inventario: Inventario[];
  movimientos: MovimientoInventario[];
  inspecciones: InspeccionCalidad[];
  defectos: DefectoCalidad[];
  checklist: ChecklistCalidad[];
  tiposDefecto: TipoDefecto[];
  severidades: Severidad[];
  criteriosChecklist: CriterioChecklist[];
  equipos: Equipo[];
  tickets: TicketMantenimiento[];
  actividades: ActividadMantenimiento[];
  planesPreventivos: PlanPreventivo[];
  integrationRequests: IntegrationRequest[];
};

declare global {
  var __ARGOS_MOCK_DB__: MockDatabase | undefined;
}

const isoNow = (): string => new Date().toISOString();

const newId = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const seedDatabase = (): MockDatabase => {
  const now = isoNow();

  const sedeCentro: Sede = {
    id: "sede-centro",
    sedeId: "sede-centro",
    codigo: "CENTRO",
    nombre: "Sede Centro",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const sedeNorte: Sede = {
    id: "sede-norte",
    sedeId: "sede-norte",
    codigo: "NORTE",
    nombre: "Sede Norte",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const areaOperaciones: Area = {
    id: "area-operaciones",
    sedeId: sedeCentro.id,
    codigo: "OP",
    nombre: "Operaciones",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const areaMantenimiento: Area = {
    id: "area-mantenimiento",
    sedeId: sedeCentro.id,
    codigo: "MANT",
    nombre: "Mantenimiento",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const bodegaPrincipal: Bodega = {
    id: "bodega-principal",
    sedeId: sedeCentro.id,
    nombre: "Bodega Principal",
    areaId: areaOperaciones.id,
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const ubicacionA1: Ubicacion = {
    id: "ubicacion-a1",
    sedeId: sedeCentro.id,
    nombre: "Pasillo A1",
    bodegaId: bodegaPrincipal.id,
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const empleados: Empleado[] = [
    {
      id: "emp-100",
      sedeId: sedeCentro.id,
      identificacion: "100",
      nombreCompleto: "Carlos Ramírez",
      areaId: areaOperaciones.id,
      cargo: "Operario",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "emp-200",
      sedeId: sedeCentro.id,
      identificacion: "200",
      nombreCompleto: "Luisa Montoya",
      areaId: areaMantenimiento.id,
      cargo: "Técnico",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const itemsDotacion: ItemDotacion[] = [
    {
      id: "item-bota-seguridad",
      sedeId: sedeCentro.id,
      sku: "BOT-001",
      nombre: "Bota de seguridad",
      categoria: "Calzado",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "item-casco",
      sedeId: sedeCentro.id,
      sku: "CAS-001",
      nombre: "Casco industrial",
      categoria: "Protección",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const tallas: Talla[] = [
    {
      id: "talla-39",
      sedeId: sedeCentro.id,
      nombre: "39",
      tipoPrenda: "Calzado",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "talla-unica",
      sedeId: sedeCentro.id,
      nombre: "Única",
      tipoPrenda: "General",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const proveedores: Proveedor[] = [
    {
      id: "prov-1",
      sedeId: sedeCentro.id,
      nombre: "Seguridad Industrial S.A.S.",
      nit: "900123456",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const centrosCosto: CentroCosto[] = [
    {
      id: "ceco-001",
      sedeId: sedeCentro.id,
      codigo: "CC-1001",
      nombre: "Operaciones Planta Centro",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "ceco-002",
      sedeId: sedeNorte.id,
      codigo: "CC-2001",
      nombre: "Mantenimiento Planta Norte",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const kitsDotacion: KitDotacion[] = [
    {
      id: "kit-001",
      sedeId: sedeCentro.id,
      nombre: "Kit Operario Semestre 1",
      genero: "Unisex",
      cargo: "Operario",
      ciclo: "2026-S1",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const kitDotacionItems: KitDotacionItem[] = [
    {
      id: "kit-item-001",
      sedeId: sedeCentro.id,
      kitId: "kit-001",
      itemNombre: "Bota de seguridad",
      cantidad: 1,
      obligatorio: true,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "kit-item-002",
      sedeId: sedeCentro.id,
      kitId: "kit-001",
      itemNombre: "Casco industrial",
      cantidad: 1,
      obligatorio: true,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const pedidoInicial: PedidoDotacion = {
    id: "ped-001",
    sedeId: sedeCentro.id,
    codigo: "PD-2026-0001",
    empleadoNombre: "Carlos Ramírez",
    areaNombre: "Operaciones",
    observacion: "Reposición trimestral",
    totalItems: 3,
    prioridad: "Media",
    estado: "Borrador",
    createdOn: now,
    modifiedOn: now,
  };

  const pedidoDetalles: PedidoDotacionDetalle[] = [
    {
      id: "pdd-001",
      sedeId: sedeCentro.id,
      pedidoId: pedidoInicial.id,
      itemNombre: "Bota de seguridad",
      talla: "39",
      cantidad: 1,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "pdd-002",
      sedeId: sedeCentro.id,
      pedidoId: pedidoInicial.id,
      itemNombre: "Casco industrial",
      talla: "Única",
      cantidad: 2,
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const inventario: Inventario[] = [
    {
      id: "inv-001",
      sedeId: sedeCentro.id,
      itemNombre: "Bota de seguridad",
      bodegaNombre: bodegaPrincipal.nombre,
      ubicacionNombre: ubicacionA1.nombre,
      stockActual: 50,
      stockMinimo: 20,
      estado: "Disponible",
      createdOn: now,
      modifiedOn: now,
    },
    {
      id: "inv-002",
      sedeId: sedeCentro.id,
      itemNombre: "Casco industrial",
      bodegaNombre: bodegaPrincipal.nombre,
      ubicacionNombre: ubicacionA1.nombre,
      stockActual: 32,
      stockMinimo: 12,
      estado: "Disponible",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const movimientos: MovimientoInventario[] = [
    {
      id: "mov-001",
      sedeId: sedeCentro.id,
      tipo: "Ingreso",
      itemNombre: "Bota de seguridad",
      bodegaNombre: bodegaPrincipal.nombre,
      ubicacionNombre: ubicacionA1.nombre,
      cantidad: 10,
      motivo: "Compra proveedor",
      fecha: now,
      estado: "Registrado",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const inspeccionInicial: InspeccionCalidad = {
    id: "cal-001",
    sedeId: sedeCentro.id,
    codigo: "IC-2026-001",
    inspector: "Ana Gómez",
    lote: "LOT-8891",
    resultado: "Conforme",
    fechaInspeccion: now,
    estado: "Cerrado",
    observacion: "Sin novedades",
    createdOn: now,
    modifiedOn: now,
  };

  const tipoDefecto: TipoDefecto = {
    id: "tipo-def-001",
    sedeId: sedeCentro.id,
    nombre: "Costura defectuosa",
    codigo: "CD-01",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const severidadMedia: Severidad = {
    id: "sev-002",
    sedeId: sedeCentro.id,
    nombre: "Media",
    nivel: 2,
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const criterioChecklist: CriterioChecklist = {
    id: "crit-001",
    sedeId: sedeCentro.id,
    nombre: "Empaque correcto",
    categoria: "Recepción",
    estado: "Activo",
    createdOn: now,
    modifiedOn: now,
  };

  const equipos: Equipo[] = [
    {
      id: "eq-001",
      sedeId: sedeCentro.id,
      codigo: "EQ-TR-01",
      nombre: "Transportador Principal",
      tipo: "Mecánico",
      areaNombre: "Operaciones",
      estado: "Operativo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const ticketInicial: TicketMantenimiento = {
    id: "tk-001",
    sedeId: sedeCentro.id,
    codigo: "TM-2026-0001",
    equipoNombre: "Transportador Principal",
    prioridad: "Alta",
    descripcion: "Ruido anormal en eje secundario",
    tecnicoAsignado: "Luisa Montoya",
    fechaReporte: now,
    estado: "Abierto",
    createdOn: now,
    modifiedOn: now,
  };

  const actividades: ActividadMantenimiento[] = [
    {
      id: "act-001",
      sedeId: sedeCentro.id,
      ticketId: ticketInicial.id,
      descripcion: "Inspección inicial y ajuste de tensión",
      fechaActividad: now,
      responsable: "Luisa Montoya",
      estado: "Ejecutada",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const planesPreventivos: PlanPreventivo[] = [
    {
      id: "pp-001",
      sedeId: sedeCentro.id,
      equipoId: equipos[0].id,
      frecuenciaDias: 30,
      fechaProxima: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      responsable: "Luisa Montoya",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const historial: HistorialEvento[] = [
    {
      id: "hist-001",
      sedeId: sedeCentro.id,
      entidad: "PedidoDotacion",
      entidadId: pedidoInicial.id,
      tipo: "Creación",
      mensaje: "Pedido creado en estado borrador",
      usuario: "Sistema",
      fecha: now,
      metadata: {},
      estado: "Registrado",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  const attachments: EntityAttachment[] = [
    {
      id: "att-001",
      sedeId: sedeCentro.id,
      entidad: "PedidoDotacion",
      entidadId: pedidoInicial.id,
      nombreArchivo: "guia-dotacion-demo.txt",
      mimeType: "text/plain",
      tamanoBytes: 48,
      usuario: "Sistema",
      fechaCarga: now,
      contenidoBase64: "RG9jdW1lbnRvIGRlIGRlbW9zdHJhY2nDs24gcGFyYSBwZWRpZG8gZGUgZG90YWNpw7NuLg==",
      estado: "Activo",
      createdOn: now,
      modifiedOn: now,
    },
  ];

  return {
    attachments,
    sedes: [sedeCentro, sedeNorte],
    areas: [areaOperaciones, areaMantenimiento],
    bodegas: [bodegaPrincipal],
    ubicaciones: [ubicacionA1],
    empleados,
    itemsDotacion,
    tallas,
    proveedores,
    centrosCosto,
    kitsDotacion,
    kitDotacionItems,
    pedidos: [pedidoInicial],
    pedidoDetalles,
    historial,
    inventario,
    movimientos,
    inspecciones: [inspeccionInicial],
    defectos: [],
    checklist: [],
    tiposDefecto: [tipoDefecto],
    severidades: [severidadMedia],
    criteriosChecklist: [criterioChecklist],
    equipos,
    tickets: [ticketInicial],
    actividades,
    planesPreventivos,
    integrationRequests: [],
  };
};

export const getMockDb = (): MockDatabase => {
  if (!globalThis.__ARGOS_MOCK_DB__) {
    globalThis.__ARGOS_MOCK_DB__ = seedDatabase();
  }


  if (!globalThis.__ARGOS_MOCK_DB__.attachments) {
    globalThis.__ARGOS_MOCK_DB__.attachments = [];
  }
  return globalThis.__ARGOS_MOCK_DB__;
};

export const createMockAttachment = (
  data: Omit<EntityAttachment, "id" | "createdOn" | "modifiedOn" | "fechaCarga">,
): EntityAttachment => {
  const now = isoNow();
  return {
    id: newId("att"),
    createdOn: now,
    modifiedOn: now,
    fechaCarga: now,
    ...data,
  };
};

export const createMockEvent = (
  data: Omit<HistorialEvento, "id" | "createdOn" | "modifiedOn" | "fecha">,
): HistorialEvento => {
  const now = isoNow();
  return {
    id: newId("hist"),
    createdOn: now,
    modifiedOn: now,
    fecha: now,
    ...data,
  };
};

export const createMockIntegrationRequest = (
  data: Omit<IntegrationRequest, "id" | "createdOn" | "modifiedOn">,
): IntegrationRequest => {
  const now = isoNow();
  return {
    id: newId("int"),
    createdOn: now,
    modifiedOn: now,
    ...data,
  };
};

export const createMockId = (prefix: string): string => newId(prefix);
