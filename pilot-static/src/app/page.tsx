const modules = [
  { id: "dotacion", title: "Dotación / Pedidos", description: "Solicitudes, aprobaciones y trazabilidad de entrega.", count: "18" },
  { id: "inventario", title: "Inventario", description: "Control de stock, movimientos y ajustes por sede.", count: "42" },
  { id: "calidad", title: "Calidad", description: "Inspecciones, checklist y defectos con seguimiento.", count: "9" },
  { id: "mantenimiento", title: "Mantenimiento", description: "Tickets técnicos y planes preventivos operativos.", count: "13" },
];

const pendientes = [
  { tipo: "Pedido", titulo: "PED-2026-1042", estado: "EnAprobación", fecha: "Hoy 08:15" },
  { tipo: "Ajuste", titulo: "MOV-2026-331", estado: "Pendiente", fecha: "Hoy 09:32" },
  { tipo: "Ticket", titulo: "TIC-2026-077", estado: "EnProceso", fecha: "Ayer 16:48" },
];

export default function PilotHomePage() {
  const logoPath = process.env.NODE_ENV === "production"
    ? "/ARG_Plataforma_Integral_Dotacion/argos-logo.webp"
    : "/argos-logo.webp";

  return (
    <main className="pilot-shell">
      <aside className="pilot-sidebar">
        <div className="pilot-brand">
          <div className="pilot-logo-wrap">
            <img src={logoPath} alt="Argos" width={116} height={40} />
          </div>
          <h1>ARGOS</h1>
          <p>Plataforma Integral</p>
        </div>
        <nav className="pilot-nav" aria-label="Módulos">
          <a href="#dotacion">Dotación / Pedidos</a>
          <a href="#inventario">Inventario</a>
          <a href="#calidad">Calidad</a>
          <a href="#mantenimiento">Mantenimiento</a>
        </nav>
      </aside>

      <section className="pilot-main">
        <header className="pilot-topbar">
          <div>
            <h2>Pilot Visual en GitHub Pages</h2>
            <p>Vista estática para validación UX. Integraciones y auth están desactivadas en este entorno.</p>
          </div>
          <span className="pilot-chip">Modo Pilot</span>
        </header>

        <section className="pilot-cards" aria-label="Resumen por módulo">
          {modules.map((module) => (
            <article key={module.id} className="pilot-card" id={module.id}>
              <div className="pilot-card-head">
                <h3>{module.title}</h3>
                <span>{module.count}</span>
              </div>
              <p>{module.description}</p>
            </article>
          ))}
        </section>

        <section className="pilot-table-wrap" aria-label="Mis pendientes">
          <div className="pilot-table-head">
            <h3>Mis pendientes</h3>
            <span>Demo</span>
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
              {pendientes.map((item) => (
                <tr key={item.titulo}>
                  <td>{item.tipo}</td>
                  <td>{item.titulo}</td>
                  <td>{item.estado}</td>
                  <td>{item.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
