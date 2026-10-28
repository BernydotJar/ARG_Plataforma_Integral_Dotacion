#!/usr/bin/env python3
"""Build a strictly static, synthetic ARGOS presentation artifact."""
from pathlib import Path
from html import escape
import shutil

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
OUT.mkdir(exist_ok=True)
shutil.copyfile(ROOT.parent / "public/argos-logo.webp", OUT / "argos-logo.webp")
shutil.copyfile(ROOT / "style.css", OUT / "style.css")
shutil.copyfile(ROOT / "server.js", OUT / "server.js")

PATHS = {
    "home": '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    "pedidos": '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6M8 10h8M8 14h6M8 18h4"/>',
    "box": '<path d="m3 7 9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10"/>',
    "catalogos": '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 10v11M9 5v5"/>',
    "arrow": '<path d="M5 12h14m-7-7 7 7-7 7"/>',
    "chevron": '<path d="m9 6 6 6-6 6"/>',
    "check": '<path d="m5 12 5 5L20 7"/>',
    "users": '<circle cx="9" cy="8" r="3"/><path d="M2.5 20v-2c0-3 2.5-5 6.5-5s6.5 2 6.5 5v2M17 6a3 3 0 0 1 0 6m2 2c2 1 2.5 2 2.5 5"/>',
    "pin": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    "shield": '<path d="M12 2 20 5v7c0 5-3 8-8 10-5-2-8-5-8-10V5z"/><path d="m9 12 2 2 4-4"/>',
    "layers": '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/>',
    "file": '<path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7"/>',
    "bag": '<path d="M4 9h16l-1 12H5L4 9zM8 9V7a4 4 0 0 1 8 0v2"/>',
    "star": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>'
}

def icon(name, size=20):
    return ('<svg width="{0}" height="{0}" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
            ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '{1}</svg>').format(size, PATHS[name])

NAV = [
    ("home", "/", "Vista general", "home"),
    ("pedidos", "/pedidos", "Ciclos y pedidos", "pedidos"),
    ("inventario", "/inventario", "Inventario", "box"),
    ("catalogos", "/catalogos", "Datos maestros", "catalogos")
]

def nav(active):
    return "".join(
        '<a class="nav-link {0}" href="{1}" {2}>{3}<span>{4}</span></a>'.format(
            "active" if key == active else "", href, 'aria-current="page"' if key == active else "",
            icon(ico, 20), escape(label)
        ) for key, href, label, ico in NAV
    )

def status(label, tone="info"):
    return '<span class="status status--{}"><i aria-hidden="true"></i>{}</span>'.format(tone, escape(label))

def metric(label, value, note, kind, tone="blue"):
    return ('<article class="metric metric--{0}"><div class="metric-top"><span>{1}</span>'
            '<span class="metric-icon">{2}</span></div><div class="metric-value">{3}</div>'
            '<div class="metric-note">{4}</div></article>').format(
        tone, escape(label), icon(kind, 19), escape(value), escape(note))

def section(title, desc, eyebrow):
    return '<header class="section-head"><div class="eyebrow">{0}</div><h1>{1}</h1><p>{2}</p></header>'.format(
        escape(eyebrow), escape(title), escape(desc))

def table(headers, rows):
    head = "".join("<th scope='col'>{}</th>".format(escape(h)) for h in headers)
    body = "".join("<tr>{}</tr>".format("".join("<td>{}</td>".format(cell) for cell in row)) for row in rows)
    return '<div class="table-wrap"><table><thead><tr>{}</tr></thead><tbody>{}</tbody></table></div>'.format(head, body)

def home():
    steps = [
        ("01", "users", "Colaboradores", "Altas, cambios y novedades desde SuccessFactors"),
        ("02", "bag", "Tallas", "Preparación y validaciones por sede"),
        ("03", "file", "Pedidos", "Consolidación nacional y archivo SOLPED"),
        ("04", "check", "Entregas", "Registro de recepción, firma y constancia")
    ]
    journey = '<div class="journey">' + "".join(
        '<div class="journey-item"><span>{0}</span><strong>{1}</strong></div>'.format(n, escape(title))
        for n, _, title, _ in steps
    ) + '</div>'
    process = "".join(
        '<div class="process-row"><span class="process-no">{0}</span><span class="process-icon">{1}</span>'
        '<div><strong>{2}</strong><small>{3}</small></div>{4}</div>'.format(
            n, icon(kind, 20), escape(title), escape(desc), icon("chevron", 17)
        ) for n, kind, title, desc in steps
    )
    return """
      <section class="hero">
        <div class="hero-copy">
          <div class="hero-eyebrow"><span class="hero-dot"></span> UNA PROPUESTA PARA ARGOS</div>
          <h1>La dotación, de principio a fin. <em>En un mismo lugar.</em></h1>
          <p>Una experiencia para visualizar colaboradores, tallas, pedidos, entregas e inventario de manera clara y conectada.</p>
          <a class="hero-link" href="/pedidos">Explorar los ciclos de dotación {arrow}</a>
        </div>
        <div class="hero-graphic">
          <span class="graphic-title">RECORRIDO PROPUESTO</span>
          {journey}
          <div class="graphic-foot">{shield} Flujo ilustrativo · Sujeto a validación</div>
        </div>
      </section>
      <section class="content-block">
        <div class="block-heading"><div><div class="eyebrow">PANORAMA GENERAL</div><h2>Una operación con visibilidad</h2></div><span class="illustration-note">Todos los valores son ficticios</span></div>
        <div class="metrics-grid">{metrics}</div>
      </section>
      <div class="two-panel">
        <section class="panel">
          <div class="panel-title"><div><div class="eyebrow">VISIÓN DEL PROCESO</div><h2>De la información a la entrega</h2></div><span class="panel-icon">{layers}</span></div>
          <div class="process-list">{process}</div>
        </section>
        <aside class="panel panel--statement">
          <div class="eyebrow statement-eyebrow">{star} PARA ESTA REUNIÓN</div>
          <h2>Validemos juntos la experiencia.</h2>
          <p>Queremos conocer su perspectiva sobre la navegación, la organización de la información y el recorrido del usuario mientras avanzamos en la implementación.</p>
          <div class="statement-items"><span>{check} Navegación y estructura</span><span>{check} Información por sede y rol</span><span>{check} Visualización de ciclos</span></div>
          <div class="statement-bottom">Sin registros, envíos ni operaciones reales.</div>
        </aside>
      </div>
    """.format(
        arrow=icon("arrow",18), shield=icon("shield",17), journey=journey,
        metrics="".join([
            metric("Colaboradores","3.200","Población ilustrativa","users"),
            metric("Sedes","18","Distribución de ejemplo","pin","teal"),
            metric("Pedidos de ejemplo","146","Sin transacciones","pedidos"),
            metric("Entregas previstas","1.180","Proyección ficticia","bag","lime")]),
        layers=icon("layers"), process=process,star=icon("star",17),check=icon("check",17))

def pedidos():
    steps = [
        ("01", "clock", "Ventana de ajustes", "El administrador local revisaría tallas y cantidades durante el período habilitado."),
        ("02", "check", "Validación por sede", "Las novedades se revisarían antes del cierre y consolidación."),
        ("03", "file", "Archivo SOLPED", "Se prepararía con el formato acordado para su carga en SAP.")
    ]
    stages = "".join(
        '<article class="stage-card"><div class="stage-label">ETAPA {}</div><span class="stage-icon">{}</span>'
        '<h3>{}</h3><p>{}</p>{}</article>'.format(
            n, icon(kind,24),escape(name),escape(desc),status("Integración pendiente","neutral") if n=="03" else status("Flujo propuesto"))
        for n,kind,name,desc in steps)
    rows = [
        ("DEM-PED-001","Sede Central","II / 2026","12 / 12","En revisión","review"),
        ("DEM-PED-002","Sede Norte","II / 2026","8 / 10","Ajustes ilustrativos","info"),
        ("DEM-PED-003","Sede Occidente","II / 2026","9 / 9","Para consolidar","ready"),
        ("DEM-PED-004","Centro Logístico","II / 2026","6 / 8","Ajustes ilustrativos","info"),
    ]
    data = [[
        '<span class="mono">{}</span>'.format(r[0]),'<strong>{}</strong>'.format(r[1]),r[2],r[3],
        status(r[4],r[5])
    ] for r in rows]
    return section("Ciclos y pedidos",
        "Acompañar los ajustes de cada sede y preparar una consolidación nacional transparente.",
        "DOTACIÓN / PEDIDOS") + """
        <div class="cycle-ribbon"><span class="ribbon-icon">{clock}</span>
          <div><strong>Ciclo de referencia · Segundo semestre 2026</strong>
               <small>Ejemplo para visualizar aperturas, ajustes y consolidación</small></div>
          {pill}
        </div>
        <section class="content-block">
          <div class="block-heading"><div><div class="eyebrow">ETAPAS DEL CICLO</div>
          <h2>Un recorrido simple y visible</h2></div><span class="illustration-note">Sin ejecución de procesos</span></div>
          <div class="stage-grid">{stages}</div>
        </section>
        <section class="panel data-panel"><div class="panel-title"><div><div class="eyebrow">VISIÓN POR SEDE</div>
        <h2>Seguimiento de pedidos</h2><p>Registros ficticios para evaluar el diseño del listado.</p></div>
        <span class="tag">4 ejemplos</span></div>{table}
        <div class="panel-foot">{shield} El archivo SOLPED y la conexión con SAP no están habilitados en esta demostración.</div></section>
    """.format(clock=icon("clock",22),pill=status("Diseño conceptual"),stages=stages,table=table(
        ["Código ilustrativo","Sede","Período","Validaciones","Estado visual"],data),shield=icon("shield",18))

def inventario():
    rows = [
        ("Polo corporativo","M","Bodega Central","246","Referencial","ready"),
        ("Pantalón de dotación","32","Bodega Norte","128","Referencial","ready"),
        ("Botas de seguridad","42","Bodega Central","64","Revisión ilustrativa","review"),
        ("Chaqueta industrial","L","Bodega Occidente","82","Referencial","ready"),
    ]
    data = [['<strong>{}</strong>'.format(r[0]),'<span class="mono">{}</span>'.format(r[1]),r[2],
             '<strong>{}</strong>'.format(r[3]),status(r[4],r[5])] for r in rows]
    return section("Inventario y existencias",
        "Una visión organizada de materiales, tallas y bodegas para acompañar las entregas.",
        "DOTACIÓN / INVENTARIO") + """
      <div class="metrics-grid metrics-grid--three">{metrics}</div>
      <div class="two-panel two-panel--inventory">
        <section class="panel data-panel">
          <div class="panel-title"><div><div class="eyebrow">EXISTENCIAS POR MATERIAL</div>
          <h2>Vista de inventario</h2><p>Cómo se presentarían cantidades por talla y ubicación.</p></div>
          <span class="tag">Datos de ejemplo</span></div>
          {table}
        </section>
        <aside class="panel inventory-aside">
          <div class="inventory-badge">{box}<span>TRAZABILIDAD PROPUESTA</span></div>
          <h2>De la bodega al colaborador</h2>
          <p>La experiencia permitiría relacionar cada entrega con el material, la talla y la sede correspondiente.</p>
          <div class="aside-timeline"><div><b>01</b> Existencia disponible</div><div><b>02</b> Selección de elementos</div>
          <div><b>03</b> Registro de entrega</div><div><b>04</b> Constancia de recepción</div></div>
          <div class="aside-note">Ningún movimiento se ejecuta en esta vista preliminar.</div>
        </aside>
      </div>
    """.format(
        metrics="".join([
            metric("Unidades de ejemplo","520","Existencias ilustrativas","box"),
            metric("Bodegas","3","Ubicaciones ficticias","pin","teal"),
            metric("Materiales","4","Referencias de catálogo","layers","lime")]),
        table=table(["Material","Talla","Bodega","Unidades","Estado visual"],data),box=icon("box",33))

def catalogos():
    cards=[
        ("pin","ESTRUCTURA","Sedes y bodegas",
         "Ubicaciones, centros de entrega y responsables asociados a cada sede.","Relaciones por sede"),
        ("bag","DOTACIÓN","Materiales y tallas",
         "Prendas, referencias y códigos del proveedor para cada material.","Catálogo de dotación"),
        ("layers","ORGANIZACIÓN","Centros de costo",
         "Asociaciones entre centros de costo y las diferentes sedes.","Asignaciones")
    ]
    cards_html="".join(
        '<article class="catalog-card"><span class="catalog-icon">{}</span><div class="eyebrow">{}</div>'
        '<h2>{}</h2><p>{}</p><span class="catalog-foot">{} {}</span></article>'.format(
        icon(kind,24),eye,title,desc,foot,icon("arrow",17)) for kind,eye,title,desc,foot in cards)
    roles=[("SA","Super Administrador","Configuración y supervisión global"),
           ("AL","Administrador Local","Operación de las sedes asignadas"),
           ("UP","Usuario Pedidos","Seguimiento y consolidación nacional")]
    roles_html="".join('<div class="role-row"><span class="role-avatar">{}</span><div><strong>{}</strong><small>{}</small></div></div>'.format(
        *r) for r in roles)
    data=[
        ['<span class="mono">DEM-SEDE-01</span>','<strong>Sede Central</strong>','Administrativa'],
        ['<span class="mono">DEM-SEDE-02</span>','<strong>Sede Norte</strong>','Operativa'],
        ['<span class="mono">DEM-SEDE-03</span>','<strong>Sede Occidente</strong>','Operativa'],
    ]
    return section("Datos maestros",
        "La base que organizaría sedes, materiales, centros de costo y perfiles de acceso.",
        "ADMINISTRACIÓN / CATÁLOGOS") + """
        <div class="catalog-grid">{cards}</div>
        <div class="two-panel two-panel--catalog">
          <section class="panel data-panel">
            <div class="panel-title"><div><div class="eyebrow">EJEMPLO DE CATÁLOGO</div><h2>Sedes de referencia</h2>
            <p>Identificadores ficticios, no procedentes de SuccessFactors.</p></div><span class="tag">3 ejemplos</span></div>{table}
          </section>
          <aside class="panel"><div class="panel-title"><div><div class="eyebrow">ACCESO POR PERFIL</div>
          <h2>Roles de referencia</h2></div><span class="panel-icon">{shield}</span></div>
          <div class="role-list">{roles}</div>
          <div class="aside-note">El SSO, MFA y la segregación real de permisos se validarán con la infraestructura corporativa.</div>
          </aside>
        </div>
    """.format(cards=cards_html,table=table(["Identificador","Sede ilustrativa","Tipo"],data),
        shield=icon("shield",20),roles=roles_html)

PAGES = {
    "inicio": ("index.html","Vista general",home),
    "pedidos": ("pedidos.html","Ciclos y pedidos",pedidos),
    "inventario": ("inventario.html","Inventario",inventario),
    "catalogos": ("catalogos.html","Datos maestros",catalogos)
}

def layout(active):
    _,title, content = PAGES[active]
    return """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#092b4c">
<meta name="description" content="Vista preliminar de ARGOS Dotación. Datos ilustrativos, sin operaciones activas.">
<title>ARGOS · {title} · Vista preliminar</title>
<link rel="icon" type="image/webp" href="/argos-logo.webp">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="preview-layout">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="ARGOS - ir a vista general">
      <span class="brand-logo"><img src="/argos-logo.webp" alt="ARGOS" width="116" height="62"></span>
      <strong>Plataforma de Dotación</strong><small>Concepto de experiencia digital</small>
    </a>
    <div class="sidebar-divider"></div>
    <div class="sidebar-label">EXPLORAR LA EXPERIENCIA</div>
    <nav class="nav" aria-label="Secciones de la demostración">{sidebar_links}</nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-info">{shield}<div><strong>Modo presentación</strong><small>Solo visualización<br>Sin operaciones activas</small></div></div>
    <div class="sidebar-footer">ARGOS · Propuesta visual 2026</div>
  </aside>
  <div class="app-surface">
    <header class="topbar">
      <div class="topbar-left"><span class="topbar-mark">A</span><div><strong>ARGOS / Dotación</strong><small>Experiencia de gestión empresarial</small></div></div>
      <div class="topbar-right"><span class="topbar-caption">Presentación de concepto</span><span class="preview-pill"><i></i> Vista preliminar</span></div>
    </header>
    <div class="mobile-nav"><nav aria-label="Secciones de la demostración">{mobile_links}</nav></div>
    <main id="main" class="main">
      <div class="disclaimer" role="note"><strong>{star} DEMOSTRACIÓN VISUAL</strong><span>Datos ilustrativos · Diseño sujeto a validación · Sin transacciones ni integraciones reales</span></div>
      {content}
      <footer class="main-footer"><span>ARGOS · Propuesta de experiencia de usuario</span><span>Vista preliminar para validar con el cliente · No es un sistema terminado</span></footer>
    </main>
  </div>
</div>
</body>
</html>""".format(title=escape(title),sidebar_links=nav(active),mobile_links=nav(active),
        shield=icon("shield"),star=icon("star",17),content=content())

for name,(filename,_,_) in PAGES.items():
    (OUT/filename).write_text(layout(name), encoding="utf-8")
(OUT/"robots.txt").write_text("User-agent: *\nDisallow: /\n")
print("PREVIEW_BUILD_SUCCESS", len(PAGES), "pages", OUT)
