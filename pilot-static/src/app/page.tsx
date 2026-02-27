"use client";

import { useEffect, useMemo, useState } from "react";

type ModuleKey = "pedidos" | "inventario" | "calidad" | "mantenimiento";

type PedidoStatus = "Borrador" | "EnAprobacion" | "Aprobado" | "EnviadoSAP" | "Rechazado";
type InventarioStatus = "OK" | "BajoMinimo" | "SinStock";
type CalidadStatus = "Abierta" | "Cerrada";
type MantenimientoStatus = "Abierto" | "EnProceso" | "Cerrado";

type PedidoRow = {
  id: string;
  codigo: string;
  empleado: string;
  area: string;
  prioridad: "Baja" | "Media" | "Alta";
  estado: PedidoStatus;
  fecha: string;
};

type InventarioRow = {
  id: string;
  item: string;
  bodega: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  estado: InventarioStatus;
};

type CalidadRow = {
  id: string;
  codigo: string;
  inspector: string;
  lote: string;
  resultado: "Conforme" | "NoConforme";
  estado: CalidadStatus;
  fecha: string;
};

type MantenimientoRow = {
  id: string;
  codigo: string;
  equipo: string;
  tecnico: string | null;
  prioridad: "Baja" | "Media" | "Alta";
  estado: MantenimientoStatus;
  fecha: string;
};

type PendingItem = {
  id: string;
  tipo: "Pedido" | "AjusteInventario" | "Calidad" | "Ticket";
  titulo: string;
  estado: string;
  fecha: string;
};

type DeliverableItem = {
  id: string;
  title: string;
  score: number;
  highlights: string[];
};

const repoBasePath = process.env.NODE_ENV === "production" ? "/ARG_Plataforma_Integral_Dotacion" : "";
const logoPath = `${repoBasePath}/argos-logo.webp`;

const moduleMeta: Record<ModuleKey, { label: string; subtitle: string }> = {
  pedidos: {
    label: "Dotación / Pedidos",
    subtitle: "Solicitudes, aprobaciones y envío SAP",
  },
  inventario: {
    label: "Inventario",
    subtitle: "Control de stock y ajustes por bodega",
  },
  calidad: {
    label: "Calidad",
    subtitle: "Inspecciones y resultados de conformidad",
  },
  mantenimiento: {
    label: "Mantenimiento",
    subtitle: "Tickets técnicos y actividades operativas",
  },
};

const pedidosData: PedidoRow[] = [
  {
    id: "ped-1001",
    codigo: "PED-2026-1001",
    empleado: "Ana López",
    area: "Producción",
    prioridad: "Alta",
    estado: "EnAprobacion",
    fecha: "2026-02-26T08:15:00-06:00",
  },
  {
    id: "ped-1002",
    codigo: "PED-2026-1002",
    empleado: "Luis Méndez",
    area: "Logística",
    prioridad: "Media",
    estado: "Aprobado",
    fecha: "2026-02-25T14:40:00-06:00",
  },
  {
    id: "ped-1003",
    codigo: "PED-2026-1003",
    empleado: "Marta Pérez",
    area: "Calidad",
    prioridad: "Baja",
    estado: "Rechazado",
    fecha: "2026-02-24T10:05:00-06:00",
  },
  {
    id: "ped-1004",
    codigo: "PED-2026-1004",
    empleado: "Carlos Gómez",
    area: "Mantenimiento",
    prioridad: "Alta",
    estado: "EnviadoSAP",
    fecha: "2026-02-23T16:55:00-06:00",
  },
];

const inventarioData: InventarioRow[] = [
  {
    id: "inv-001",
    item: "Casco de seguridad",
    bodega: "Bodega Central",
    ubicacion: "A-01",
    stockActual: 126,
    stockMinimo: 80,
    estado: "OK",
  },
  {
    id: "inv-002",
    item: "Guante dieléctrico",
    bodega: "Bodega Norte",
    ubicacion: "B-12",
    stockActual: 24,
    stockMinimo: 30,
    estado: "BajoMinimo",
  },
  {
    id: "inv-003",
    item: "Botas punta acero",
    bodega: "Bodega Sur",
    ubicacion: "C-04",
    stockActual: 0,
    stockMinimo: 20,
    estado: "SinStock",
  },
];

const calidadData: CalidadRow[] = [
  {
    id: "cal-201",
    codigo: "INSP-2026-201",
    inspector: "Diana Ruiz",
    lote: "L-784",
    resultado: "Conforme",
    estado: "Abierta",
    fecha: "2026-02-26T11:20:00-06:00",
  },
  {
    id: "cal-202",
    codigo: "INSP-2026-202",
    inspector: "Rosa Alvarado",
    lote: "L-785",
    resultado: "NoConforme",
    estado: "Cerrada",
    fecha: "2026-02-25T09:12:00-06:00",
  },
  {
    id: "cal-203",
    codigo: "INSP-2026-203",
    inspector: "Diana Ruiz",
    lote: "L-786",
    resultado: "Conforme",
    estado: "Abierta",
    fecha: "2026-02-24T15:08:00-06:00",
  },
];

const mantenimientoData: MantenimientoRow[] = [
  {
    id: "tic-310",
    codigo: "TIC-2026-310",
    equipo: "Compresor Planta 2",
    tecnico: "Jorge Cux",
    prioridad: "Alta",
    estado: "EnProceso",
    fecha: "2026-02-26T07:45:00-06:00",
  },
  {
    id: "tic-311",
    codigo: "TIC-2026-311",
    equipo: "Montacargas 04",
    tecnico: null,
    prioridad: "Media",
    estado: "Abierto",
    fecha: "2026-02-25T12:30:00-06:00",
  },
  {
    id: "tic-312",
    codigo: "TIC-2026-312",
    equipo: "Banda de empaque",
    tecnico: "Kevin Pérez",
    prioridad: "Baja",
    estado: "Cerrado",
    fecha: "2026-02-24T17:22:00-06:00",
  },
];

const pendingItems: PendingItem[] = [
  {
    id: "pend-01",
    tipo: "Pedido",
    titulo: "PED-2026-1001",
    estado: "EnAprobacion",
    fecha: "2026-02-26T08:15:00-06:00",
  },
  {
    id: "pend-02",
    tipo: "AjusteInventario",
    titulo: "MOV-2026-331",
    estado: "PendienteAprobacion",
    fecha: "2026-02-26T09:32:00-06:00",
  },
  {
    id: "pend-03",
    tipo: "Ticket",
    titulo: "TIC-2026-310",
    estado: "EnProceso",
    fecha: "2026-02-26T07:45:00-06:00",
  },
];

const deliverables: DeliverableItem[] = [
  {
    id: "eng-review",
    title: "Engineering Review (SOLID/DRY/KISS)",
    score: 92,
    highlights: [
      "Repository modular por dominio y Strategy por runtime.",
      "Dashboard optimizado con llamadas paralelas.",
      "Mapeos y filtros unificados para evitar duplicación.",
    ],
  },
  {
    id: "ux-review",
    title: "UX Review (Apple HIG + WCAG)",
    score: 89,
    highlights: [
      "Focus ring con contraste AA y tipografía moderna.",
      "Estados de loading con skeletons y errores con reintento.",
      "Navegación contextual y labels accesibles en filtros.",
    ],
  },
  {
    id: "qa-visual",
    title: "QA Visual (VIS-001 a VIS-026)",
    score: 86,
    highlights: [
      "Status badges cubren Abierta/Cerrada y semántica completa.",
      "Resultado muestra “No Conforme” en lugar de valor técnico.",
      "Cantidad validada con min/max y acciones según estado.",
    ],
  },
];

const statusLabels: Record<string, string> = {
  Borrador: "Borrador",
  EnAprobacion: "En Aprobación",
  Aprobado: "Aprobado",
  EnviadoSAP: "Enviado SAP",
  Rechazado: "Rechazado",
  OK: "OK",
  BajoMinimo: "Bajo mínimo",
  SinStock: "Sin stock",
  Abierta: "Abierta",
  Cerrada: "Cerrada",
  Abierto: "Abierto",
  EnProceso: "En proceso",
  Cerrado: "Cerrado",
  PendienteAprobacion: "Pendiente aprobación",
  NoConforme: "No Conforme",
  Conforme: "Conforme",
};

const statusTone: Record<string, "success" | "warning" | "danger" | "informative" | "brand"> = {
  Borrador: "informative",
  EnAprobacion: "warning",
  Aprobado: "success",
  EnviadoSAP: "brand",
  Rechazado: "danger",
  OK: "success",
  BajoMinimo: "warning",
  SinStock: "danger",
  Abierta: "warning",
  Cerrada: "success",
  Abierto: "warning",
  EnProceso: "informative",
  Cerrado: "success",
  PendienteAprobacion: "warning",
  NoConforme: "danger",
  Conforme: "success",
};

const statusOptions: Record<ModuleKey, string[]> = {
  pedidos: ["Todos", "Borrador", "EnAprobacion", "Aprobado", "EnviadoSAP", "Rechazado"],
  inventario: ["Todos", "OK", "BajoMinimo", "SinStock"],
  calidad: ["Todos", "Abierta", "Cerrada"],
  mantenimiento: ["Todos", "Abierto", "EnProceso", "Cerrado"],
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatDate = (isoDate: string, mode: "date-only" | "datetime"): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  if (mode === "date-only") {
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] || "informative";
  const label = statusLabels[status] || status;
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`skeleton-${index}`} className="skeleton-line" />
      ))}
    </div>
  );
}

export default function PilotHomePage() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("pedidos");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [selectedPedidoId, setSelectedPedidoId] = useState(pedidosData[0]?.id ?? "");
  const [cantidad, setCantidad] = useState<number>(1);
  const [toast, setToast] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 520);

    return () => clearTimeout(timer);
  }, [activeModule, query, statusFilter]);

  useEffect(() => {
    setStatusFilter("Todos");
    setQuery("");
  }, [activeModule]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredPedidos = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return pedidosData.filter((row) => {
      if (statusFilter !== "Todos" && row.estado !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [row.codigo, row.empleado, row.area, row.prioridad]
        .some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }, [query, statusFilter]);

  const filteredInventario = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return inventarioData.filter((row) => {
      if (statusFilter !== "Todos" && row.estado !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [row.item, row.bodega, row.ubicacion]
        .some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }, [query, statusFilter]);

  const filteredCalidad = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return calidadData.filter((row) => {
      if (statusFilter !== "Todos" && row.estado !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [row.codigo, row.inspector, row.lote, statusLabels[row.resultado]]
        .some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }, [query, statusFilter]);

  const filteredMantenimiento = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return mantenimientoData.filter((row) => {
      if (statusFilter !== "Todos" && row.estado !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [row.codigo, row.equipo, row.tecnico || "sin asignar", row.prioridad]
        .some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }, [query, statusFilter]);

  const selectedPedido = useMemo(
    () => pedidosData.find((row) => row.id === selectedPedidoId) || null,
    [selectedPedidoId],
  );

  const canSendApproval = Boolean(selectedPedido && (selectedPedido.estado === "Borrador" || selectedPedido.estado === "Rechazado"));
  const canSendSap = Boolean(selectedPedido && selectedPedido.estado === "Aprobado");

  const quantityIsValid = Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= 9999;

  const currentRows =
    activeModule === "pedidos"
      ? filteredPedidos.length
      : activeModule === "inventario"
        ? filteredInventario.length
        : activeModule === "calidad"
          ? filteredCalidad.length
          : filteredMantenimiento.length;

  const dashboardCards = [
    {
      id: "dashboard-pedidos",
      title: moduleMeta.pedidos.label,
      count: pedidosData.length,
      pending: pedidosData.filter((item) => item.estado === "EnAprobacion").length,
    },
    {
      id: "dashboard-inventario",
      title: moduleMeta.inventario.label,
      count: inventarioData.length,
      pending: inventarioData.filter((item) => item.estado !== "OK").length,
    },
    {
      id: "dashboard-calidad",
      title: moduleMeta.calidad.label,
      count: calidadData.length,
      pending: calidadData.filter((item) => item.resultado === "NoConforme").length,
    },
    {
      id: "dashboard-mantenimiento",
      title: moduleMeta.mantenimiento.label,
      count: mantenimientoData.length,
      pending: mantenimientoData.filter((item) => item.estado !== "Cerrado").length,
    },
  ];

  const triggerAction = (kind: "approval" | "sap" | "create") => {
    if (kind === "approval") {
      setToast({ tone: "success", message: "Pedido enviado a aprobación correctamente." });
      return;
    }

    if (kind === "sap") {
      setToast({ tone: "success", message: "Pedido enviado a SAP y registrado en historial." });
      return;
    }

    setToast({ tone: "success", message: "Pedido rápido creado y agregado al flujo operativo." });
  };

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <div className="brand-logo-wrap">
            <img src={logoPath} alt="Argos" width={116} height={40} />
          </div>
          <h1>ARGOS</h1>
          <p>Plataforma Integral</p>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          {(Object.keys(moduleMeta) as ModuleKey[]).map((module) => (
            <button
              key={`nav-${module}`}
              type="button"
              className={`side-nav-btn ${activeModule === module ? "active" : ""}`}
              onClick={() => setActiveModule(module)}
            >
              {moduleMeta[module].label}
            </button>
          ))}
        </nav>

        <div className="user-card">
          <h2>Perfil Operativo</h2>
          <p>Rol: Admin de Sede</p>
          <p>Sede: Sede Central, Sede Norte</p>
          <p>Modo: Pilot de validación</p>
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div>
            <h2>Centro de Operaciones ARGOS</h2>
            <p>{moduleMeta[activeModule].subtitle}</p>
          </div>
          <div className="topbar-right">
            <span className="chip chip-brand">SSO Entra ID</span>
            <span className="chip">Dataverse + Flows</span>
          </div>
        </header>

        {toast ? <div className={`inline-toast ${toast.tone}`}>{toast.message}</div> : null}

        <section className="overview-grid" aria-label="Resumen general">
          {dashboardCards.map((card) => (
            <article key={card.id} className="kpi-card">
              <div className="kpi-head">
                <h3>{card.title}</h3>
                <span>{card.count}</span>
              </div>
              <p>{card.pending} pendientes críticos</p>
            </article>
          ))}
        </section>

        <section className="workspace-grid">
          <article className="panel module-panel">
            <div className="panel-head">
              <h3>Operación por módulo</h3>
              <span>{currentRows} registros</span>
            </div>

            <div className="toolbar">
              <div className="tabs" role="tablist" aria-label="Módulos">
                {(Object.keys(moduleMeta) as ModuleKey[]).map((module) => (
                  <button
                    key={`tab-${module}`}
                    type="button"
                    role="tab"
                    aria-selected={activeModule === module}
                    className={`tab-btn ${activeModule === module ? "active" : ""}`}
                    onClick={() => setActiveModule(module)}
                  >
                    {moduleMeta[module].label}
                  </button>
                ))}
              </div>

              <div className="filters" role="group" aria-label="Filtros de tabla">
                <label className="field-label" htmlFor="search-input">Buscar</label>
                <input
                  id="search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Código, persona, equipo o lote"
                />

                <label className="field-label" htmlFor="status-filter">Estado</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statusOptions[activeModule].map((status) => (
                    <option key={`status-option-${status}`} value={status}>
                      {statusLabels[status] || status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? <SkeletonTable rows={6} /> : null}

            {!loading ? (
              <div className="table-wrap">
                {activeModule === "pedidos" ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Empleado</th>
                        <th>Área</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPedidos.map((row) => (
                        <tr key={row.id}>
                          <td>{row.codigo}</td>
                          <td>{row.empleado}</td>
                          <td>{row.area}</td>
                          <td>{row.prioridad}</td>
                          <td><StatusBadge status={row.estado} /></td>
                          <td>{formatDate(row.fecha, "date-only")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {activeModule === "inventario" ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Ítem</th>
                        <th>Bodega</th>
                        <th>Ubicación</th>
                        <th>Stock actual</th>
                        <th>Stock mínimo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventario.map((row) => (
                        <tr key={row.id}>
                          <td>{row.item}</td>
                          <td>{row.bodega}</td>
                          <td>{row.ubicacion}</td>
                          <td>{row.stockActual}</td>
                          <td>{row.stockMinimo}</td>
                          <td><StatusBadge status={row.estado} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {activeModule === "calidad" ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Inspector</th>
                        <th>Lote</th>
                        <th>Resultado</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCalidad.map((row) => (
                        <tr key={row.id}>
                          <td>{row.codigo}</td>
                          <td>{row.inspector}</td>
                          <td>{row.lote}</td>
                          <td><StatusBadge status={row.resultado} /></td>
                          <td><StatusBadge status={row.estado} /></td>
                          <td>{formatDate(row.fecha, "datetime")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {activeModule === "mantenimiento" ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Equipo</th>
                        <th>Técnico</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMantenimiento.map((row) => (
                        <tr key={row.id}>
                          <td>{row.codigo}</td>
                          <td>{row.equipo}</td>
                          <td>{row.tecnico ? row.tecnico : <span className="muted">Sin asignar</span>}</td>
                          <td>{row.prioridad}</td>
                          <td><StatusBadge status={row.estado} /></td>
                          <td>{formatDate(row.fecha, "datetime")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {currentRows === 0 ? (
                  <div className="empty-state" role="status">
                    <h4>Sin resultados para los filtros actuales</h4>
                    <p>Prueba otro término de búsqueda o cambia el estado seleccionado.</p>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("Todos");
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>

          <article className="panel side-panel">
            <div className="panel-head">
              <h3>Acciones inteligentes</h3>
              <span>Flujos simulados</span>
            </div>

            <div className="form-stack">
              <label htmlFor="pedido-select">Pedido seleccionado</label>
              <select
                id="pedido-select"
                value={selectedPedidoId}
                onChange={(event) => setSelectedPedidoId(event.target.value)}
              >
                {pedidosData.map((pedido) => (
                  <option key={`pedido-option-${pedido.id}`} value={pedido.id}>
                    {pedido.codigo} · {statusLabels[pedido.estado]}
                  </option>
                ))}
              </select>

              <div className="selected-status">
                Estado actual: {selectedPedido ? <StatusBadge status={selectedPedido.estado} /> : "-"}
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="btn primary"
                  disabled={!canSendApproval}
                  onClick={() => triggerAction("approval")}
                >
                  Enviar a aprobación
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!canSendSap}
                  onClick={() => triggerAction("sap")}
                >
                  Enviar a SAP
                </button>
              </div>
              <p className="helper-text">
                Reglas: aprobación solo para Borrador/Rechazado, SAP solo para Aprobado.
              </p>
            </div>

            <div className="form-stack quick-form">
              <h4>Nuevo pedido rápido</h4>
              <label htmlFor="cantidad-input">Cantidad</label>
              <input
                id="cantidad-input"
                type="number"
                min={1}
                max={9999}
                step={1}
                value={cantidad}
                onChange={(event) => setCantidad(Number(event.target.value || 0))}
              />
              <p className={`helper-text ${quantityIsValid ? "ok" : "error"}`}>
                {quantityIsValid
                  ? "Cantidad válida para crear pedido."
                  : "Ingresa un número entero entre 1 y 9999."}
              </p>
              <button
                type="button"
                className="btn primary"
                disabled={!quantityIsValid}
                onClick={() => triggerAction("create")}
              >
                Crear pedido
              </button>
            </div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Mis pendientes</h3>
              <span>{pendingItems.length} activos</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tipo}</td>
                    <td>{item.titulo}</td>
                    <td><StatusBadge status={item.estado} /></td>
                    <td>{formatDate(item.fecha, "datetime")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="panel deliverables-panel">
            <div className="panel-head">
              <h3>Entregables completados</h3>
              <span>Roadmap MVP</span>
            </div>

            <div className="deliverable-list">
              {deliverables.map((item) => (
                <section key={item.id} className="deliverable-card">
                  <div className="deliverable-head">
                    <h4>{item.title}</h4>
                    <strong>{item.score}%</strong>
                  </div>
                  <div className="progress-track" aria-hidden="true">
                    <div className="progress-fill" style={{ width: `${item.score}%` }} />
                  </div>
                  <ul>
                    {item.highlights.map((highlight) => (
                      <li key={`${item.id}-${highlight}`}>{highlight}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
