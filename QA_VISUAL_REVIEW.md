# ARGOS Plataforma Integral — QA Visual Experience Report

**Tipo:** Visual QA Review
**Metodología:** Equivalence Partitioning · Boundary Value Analysis · State Transition Testing · Consistency Testing · Exploratory Testing
**Scope:** Todos los componentes UI, páginas de módulo y formularios
**Fecha:** Febrero 2026
**Revisor:** QA Engineer — Visual Experience

---

## Resumen Ejecutivo

Se evaluaron **16 archivos de interfaz** (páginas, componentes, CSS) aplicando principios formales de QA. Se identificaron **26 defectos visuales clasificados**, de los cuales **4 son críticos** (afectan funcionalidad visible y pueden generar datos incorrectos), **10 altos** (inconsistencias estructurales que dañan la confianza del usuario) y **12 medios/bajos** (polish y regresiones potenciales).

### Distribución de Defectos

| Severidad | Cantidad | Categoría Principal |
|-----------|----------|---------------------|
| 🔴 Crítico | 4 | Datos incorrectos visibles + funcionalidad rota |
| 🟠 Alto | 10 | Inconsistencias de estado + patrones rotos |
| 🟡 Medio | 8 | Comportamiento de borde + contenido inapropiado |
| 🟢 Bajo | 4 | Polish y regresión potencial |

---

## Metodología Aplicada

### Técnicas de Diseño de Pruebas

| Técnica | Aplicación |
|---------|-----------|
| **Equivalence Partitioning** | Grupos de estados por página (loading / empty / error / data) |
| **Boundary Value Analysis** | Textos en mínimo (1 char), típico (20 chars), largo (200+ chars), vacío |
| **State Transition Testing** | Todos los `estado` de cada entidad y sus transiciones visuales |
| **Consistency Testing** | El mismo componente debe verse igual en todas las páginas |
| **Exploratory Testing** | Flujos de usuario completos con datos límite |
| **Decision Table Testing** | Combinaciones de `disabled`, `loading`, `error` simultáneos |

---

## 🔴 Defectos Críticos

---

### VIS-001 — `StatusBadge` No Cubre Estados de `InspeccionCalidad`

**Tipo:** State Coverage Gap
**Archivos:** [`StatusBadge.tsx`](src/components/ui/StatusBadge.tsx), [`calidad/page.tsx`](src/app/(portal)/calidad/page.tsx)

**Descripción:** El mapa de apariencias en `StatusBadge` incluye `Abierto` (masculino) pero **no** `Abierta` (femenino), que es el estado real devuelto por `InspeccionCalidad`. El resultado es que todas las inspecciones abiertas muestran el badge con apariencia por defecto (`outline`) en lugar de la apariencia semántica esperada.

**Evidencia en código:**
```typescript
// StatusBadge.tsx — ❌ Solo tiene "Abierto", no "Abierta"
const statusAppearance = {
  Abierto: "tint",    // TicketMantenimiento ✅
  Cerrado: "filled",  // TicketMantenimiento ✅
  // "Abierta" ausente ← InspeccionCalidad usa este valor
  // "Cerrada" ausente ← InspeccionCalidad usa este valor
};
```

```typescript
// types.ts — ❌ Define dos variantes de "cerrado" para InspeccionCalidad
export const INSPECCION_STATUSES = [
  "Abierta",
  "Cerrada",
  "Cerrado",  // ← duplicado semántico (masculino/femenino coexisten)
] as const;
```

**Pasos para reproducir:**
1. Ir a `/calidad`
2. Observar la columna "Estado" de cualquier inspección
3. Todas las inspecciones en estado "Abierta" muestran badge gris outline sin distinción

**Esperado:** Badge con apariencia `tint` para inspecciones abiertas
**Actual:** Badge con apariencia `outline` (fallback) — igual que "Borrador"

**Impacto:** El usuario no puede diferenciar visualmente una inspección abierta de una en borrador.

---

### VIS-002 — Valor Técnico `"NoConforme"` Expuesto en UI de Producción

**Tipo:** Data Display Error / Boundary Value
**Archivos:** [`calidad/nuevo/page.tsx`](src/app/(portal)/calidad/nuevo/page.tsx), [`calidad/page.tsx`](src/app/(portal)/calidad/page.tsx)

**Descripción:** El valor raw del enum `"NoConforme"` (sin espacio, camelCase interno) se muestra directamente al usuario final en dos lugares: el dropdown de selección al crear una inspección, y la celda de la tabla en el listado.

**Evidencia en código:**
```typescript
// calidad/nuevo/page.tsx — ❌ Valor técnico en opciones de usuario
const resultados = ["Conforme", "NoConforme"] as const;

// En el Dropdown:
<Option key={option} value={option}>{option}</Option>
// → El usuario ve "NoConforme" como texto de opción
```

```tsx
// calidad/page.tsx — ❌ Valor crudo en celda de tabla
<TableCell>{entry.resultado}</TableCell>
// → El usuario ve "NoConforme" en la tabla
```

**Pasos para reproducir:**
1. Ir a `/calidad/nuevo` → El dropdown muestra "NoConforme" como opción
2. Ir a `/calidad` con una inspección no conforme → La columna "Resultado" muestra "NoConforme"

**Esperado:** "No Conforme"
**Actual:** "NoConforme"

**Impacto:** Apariencia no profesional. Lenguaje técnico interno visible a usuarios de negocio.

---

### VIS-003 — Input Cantidad Acepta Valores Negativos y Decimales sin Feedback Visual

**Tipo:** Boundary Value Analysis / Form Validation Gap
**Archivo:** [`pedidos/nuevo/page.tsx:161-165`](src/app/(portal)/pedidos/nuevo/page.tsx#L161-L165)

**Descripción:** El campo "Cantidad" es `type="number"` sin atributos `min`, `max` ni `step`. El usuario puede ingresar `0`, valores negativos (`-5`) o decimales (`1.5`), todos los cuales se procesan silenciosamente en el estado del componente. El API rechaza enteros ≤ 0 vía Zod, pero el UI no previene ni advierte antes de enviar.

**Evidencia en código:**
```tsx
{/* pedidos/nuevo/page.tsx — ❌ Sin min/max/step */}
<Input
  type="number"
  value={String(detalle.cantidad)}
  onChange={(_, data) => updateDetalle(idx, { cantidad: Number(data.value || 0) })}
/>
```

**Casos de prueba por partición:**

| Valor ingresado | Procesado como | Visualmente | API Zod | Resultado |
|----------------|---------------|-------------|---------|-----------|
| `3` | `3` | ✅ | ✅ Pasa | OK |
| `0` | `0` | ⚠️ Sin aviso | ❌ Falla | Error en API |
| `-1` | `-1` | ⚠️ Sin aviso | ❌ Falla | Error en API |
| `1.5` | `1.5` | ⚠️ Sin aviso | ❌ Falla `int` | Error en API |
| `` (vacío) | `0` | ⚠️ Sin aviso | ❌ Falla | Error en API |

**Esperado:** El campo debe mostrar estado de error inline cuando el valor es inválido
**Actual:** El usuario llega al API error para descubrir el problema

---

### VIS-004 — Nota de Implementación MVP Visible para el Usuario Final

**Tipo:** Content Error / Exploratory
**Archivo:** [`pedidos/[id]/page.tsx:212-217`](src/app/(portal)/pedidos/%5Bid%5D/page.tsx#L212-L217)

**Descripción:** Una nota de desarrollo interno aparece como contenido de usuario en la sección "Adjuntos" de cada pedido.

**Evidencia en código:**
```tsx
{/* pedidos/[id]/page.tsx — ❌ Nota técnica de desarrollador visible al usuario */}
<Card>
  <Text weight="semibold">Adjuntos</Text>
  <Text size={200} className="muted-text">
    MVP: cargar archivos en Dataverse Note/Attachment. Esta pantalla ya reserva
    el espacio funcional para la integración.
  </Text>
</Card>
```

**Pasos para reproducir:**
1. Ir a cualquier `/pedidos/[id]`
2. Observar la última sección "Adjuntos"
3. El usuario ve el texto técnico "MVP: cargar archivos en Dataverse Note/Attachment..."

**Esperado:** Sección "Adjuntos" con estado vacío elegante o simplemente omitida hasta que sea funcional
**Actual:** Nota de developer visible en producción

---

## 🟠 Defectos Altos

---

### VIS-005 — Spinner de Carga en Ticket Detail Sin Contenedor de Centrado

**Tipo:** Consistency Testing / Component State
**Archivos:** [`mantenimiento/[id]/page.tsx:84-85`](src/app/(portal)/mantenimiento/%5Bid%5D/page.tsx#L84-L85), [`pedidos/[id]/page.tsx:114-120`](src/app/(portal)/pedidos/%5Bid%5D/page.tsx#L114-L120)

**Descripción:** El spinner de carga se renderiza de forma inconsistente entre páginas de detalle. Pedido detail lo envuelve en `.centered-state`, Ticket detail no.

**Evidencia en código:**
```tsx
{/* pedidos/[id]/page.tsx — ✅ Spinner centrado */}
if (loading) {
  return (
    <div className="centered-state">
      <Spinner label="Cargando pedido..." />
    </div>
  );
}

{/* mantenimiento/[id]/page.tsx — ❌ Spinner sin contenedor */}
if (loading) {
  return <Spinner label="Cargando ticket..." />; // aparece alineado arriba-izquierda
}
```

**Inventario de inconsistencias de spinner por página:**

| Página | Implementación | Centrado |
|--------|---------------|----------|
| `pedidos/page.tsx` | `<div className="centered-state"><Spinner /></div>` | ✅ |
| `calidad/page.tsx` | `<Spinner label="..." />` directo | ❌ |
| `mantenimiento/page.tsx` | `<Spinner label="..." />` directo | ❌ |
| `pedidos/[id]/page.tsx` | `<div className="centered-state"><Spinner /></div>` | ✅ |
| `mantenimiento/[id]/page.tsx` | `<Spinner label="..." />` directo | ❌ |

**Esperado:** Todos los spinners de página completa usan `.centered-state`

---

### VIS-006 — Error State Visible Simultáneamente con Contenido en Detalle de Pedido

**Tipo:** State Transition Testing
**Archivo:** [`pedidos/[id]/page.tsx:219`](src/app/(portal)/pedidos/%5Bid%5D/page.tsx#L219)

**Descripción:** En la vista de detalle de pedido, el error de acciones secundarias (ej: fallo al enviar a SAP) se muestra al final de la página, debajo de 3 cards de contenido. El usuario debe hacer scroll para descubrir que una acción falló.

**Escenario:**
1. Usuario carga el detalle del pedido (exitoso)
2. Usuario hace clic en "Enviar a SAP" (falla)
3. `setError("No se pudo enviar a SAP")` se ejecuta
4. El error aparece en la **última línea** de la página

```tsx
{/* Al final de la página, después de 3 Cards */}
{error ? <Text className="error-text">{error}</Text> : null}
```

**Impacto:** En pedidos con historial largo, el error puede quedar fuera del viewport, dando la impresión de que la acción fue exitosa.

**Esperado:** El error de acciones críticas debe aparecer en la zona del header o como toast, siempre visible.

---

### VIS-007 — Acción "Enviar a Aprobación" Disponible Independientemente del Estado

**Tipo:** State Transition Testing / Decision Table
**Archivo:** [`pedidos/[id]/page.tsx:146-163`](src/app/(portal)/pedidos/%5Bid%5D/page.tsx#L146-L163)

**Descripción:** Los botones "Enviar a aprobación" y "Enviar a SAP" están habilitados para cualquier estado del pedido. Un pedido en estado "Rechazado" o "EnviadoSAP" puede ser reenviado indefinidamente.

**Matriz de estados vs. disponibilidad esperada de botones:**

| Estado del Pedido | "Enviar a aprobación" | "Enviar a SAP" |
|-------------------|----------------------|----------------|
| `Borrador` | ✅ Habilitado | ❌ Debe estar deshabilitado |
| `EnAprobacion` | ❌ Debe estar deshabilitado | ❌ Debe estar deshabilitado |
| `Aprobado` | ❌ Debe estar deshabilitado | ✅ Habilitado |
| `EnviadoSAP` | ❌ Debe estar deshabilitado | ❌ Debe estar deshabilitado |
| `Rechazado` | ✅ Debería ser habilitado (re-enviar) | ❌ Debe estar deshabilitado |

**Código actual:**
```tsx
{/* ❌ Sin lógica de estado — siempre habilitado */}
<Button
  appearance="primary"
  icon={<Send24Regular />}
  disabled={sendingApproval}  // Solo deshabilitado mientras se envía
  onClick={sendToApproval}
>
```

---

### VIS-008 — Botón de Guardado: Spinner Reemplaza el Texto (Inconsistente)

**Tipo:** Consistency Testing / Component State
**Archivos:** Múltiples formularios

**Descripción:** El estado de "guardando" se implementa de dos formas distintas en el mismo módulo. Algunas páginas muestran un `<Spinner size="tiny" />` dentro del botón (reemplazando el texto), otras muestran texto alternativo. Ambas se usan en la misma aplicación sin estándar.

**Inventario:**

| Página | Botón principal | Patrón durante guardado |
|--------|----------------|------------------------|
| `pedidos/nuevo` | "Crear pedido" | `<Spinner size="tiny" />` — ❌ botón queda sin texto |
| `calidad/nuevo` | "Guardar inspección" | `<Spinner size="tiny" />` — ❌ botón queda sin texto |
| `mantenimiento/nuevo` | "Guardar ticket" | `<Spinner size="tiny" />` — ❌ botón queda sin texto |
| `pedidos/[id]` | "Enviar a aprobación" | `"Enviando..."` — ✅ texto alternativo |
| `pedidos/[id]` | "Enviar a SAP" | `"Enviando..."` — ✅ texto alternativo |
| `mantenimiento/[id]` | "Guardar cambios" | `<Spinner size="tiny" />` — ❌ botón queda sin texto |

**Impacto visual:** Cuando el Spinner reemplaza el texto, el botón cambia de ancho porque el spinner tiene un ancho fijo menor al texto anterior → layout shift en el `actions-row`.

---

### VIS-009 — Validación de Formulario Solo se Limpia al Próximo Submit

**Tipo:** State Transition Testing / Form Validation
**Archivo:** [`pedidos/nuevo/page.tsx:63-75`](src/app/(portal)/pedidos/nuevo/page.tsx#L63-L75)

**Descripción:** Al fallar la validación, el mensaje de error permanece visible incluso después de que el usuario corrige el campo. Solo desaparece cuando el usuario vuelve a hacer clic en "Crear pedido".

**Flujo con defecto:**
1. Usuario deja "Empleado" vacío y hace clic en "Crear pedido"
2. `setError("Empleado y área son requeridos")` → mensaje de error aparece
3. Usuario escribe en el campo "Empleado" ← **el error sigue mostrándose**
4. Solo desaparece cuando el usuario hace clic en "Crear pedido" nuevamente

```tsx
{/* validate() llama setError pero nunca se limpia en tiempo real */}
const validate = () => {
  if (!empleadoNombre.trim() || !areaNombre.trim()) {
    setError("Empleado y área son requeridos");
    return false;
  }
  return true;
};
```

**Esperado:** El error debe desaparecer cuando el campo que lo causó recibe un valor válido.

---

### VIS-010 — Tablas de Calidad y Mantenimiento Sin Empty State

**Tipo:** State Coverage / Consistency Testing
**Archivos:** [`calidad/page.tsx`](src/app/(portal)/calidad/page.tsx), [`mantenimiento/page.tsx`](src/app/(portal)/mantenimiento/page.tsx)

**Descripción:** Cuando la lista está vacía, Pedidos muestra una fila con mensaje explicativo. Calidad y Mantenimiento muestran la tabla con cabecera pero sin filas y sin ningún mensaje.

**Comparativa:**

```tsx
{/* pedidos/page.tsx — ✅ Tiene empty state */}
{pedidos.length === 0 ? (
  <TableRow>
    <TableCell colSpan={6}>No hay pedidos para los filtros seleccionados.</TableCell>
  </TableRow>
) : null}

{/* calidad/page.tsx — ❌ Sin empty state */}
{list.map((entry) => (
  <TableRow key={entry.id}>...</TableRow>
))}
{/* Si list.length === 0, el tbody queda vacío sin mensaje */}
```

**Resultado visual en tabla vacía:** Calidad y Mantenimiento muestran una tabla con 6 columnas de cabecera y cuerpo completamente vacío — looks broken.

---

### VIS-011 — Ticket Detail: Guardado Exitoso Sin Feedback Visual

**Tipo:** State Coverage / User Feedback
**Archivo:** [`mantenimiento/[id]/page.tsx:61-82`](src/app/(portal)/mantenimiento/%5Bid%5D/page.tsx#L61-L82)

**Descripción:** La función `saveChanges()` actualiza el estado y recarga el detalle, pero no despacha ningún toast de éxito. El usuario no recibe confirmación visual de que la operación fue exitosa.

**Comparativa con Pedidos:**
```tsx
{/* pedidos/[id]/page.tsx — ✅ Despacha toast en éxito */}
dispatchToast(<Toast><ToastTitle>Pedido enviado a aprobación</ToastTitle></Toast>, { intent: "success" });

{/* mantenimiento/[id]/page.tsx — ❌ Solo recarga, sin toast */}
const saveChanges = async () => {
  // ...
  await apiFetch(`/api/mantenimiento/tickets/${detail.ticket.id}`, { method: "PATCH", ... });
  await load(); // ← solo recarga, sin feedback de éxito
};
```

**Impacto:** El usuario no sabe si el click en "Guardar cambios" tuvo efecto, especialmente cuando los cambios son mínimos visualmente (cambio de estado).

---

### VIS-012 — Inventario Sin Capacidad de Búsqueda o Filtrado

**Tipo:** Consistency Testing / Feature Parity
**Archivo:** [`inventario/page.tsx`](src/app/(portal)/inventario/page.tsx)

**Descripción:** El módulo de Inventario muestra la tabla de stock completa sin ningún control de búsqueda. Todos los demás módulos de listado (Pedidos, Calidad, Mantenimiento) ofrecen al menos un campo de texto de búsqueda.

**Inventario de capacidades de filtro por módulo:**

| Módulo | Búsqueda de texto | Filtro por estado |
|--------|-----------------|-------------------|
| Pedidos | ✅ | ✅ |
| Calidad | ✅ | ❌ |
| Mantenimiento | ✅ | ❌ |
| **Inventario** | **❌** | **❌** |

**Impacto:** En un almacén con 500 ítems, el usuario debe hacer scroll para encontrar un artículo específico.

---

### VIS-013 — "Ver detalle" Como Texto de Enlace Sin Contexto Diferenciador

**Tipo:** Consistency Testing / Accessibility
**Archivos:** Todas las páginas de listado

**Descripción:** Todos los enlaces de acción en tablas usan el texto genérico "Ver detalle". Un lector de pantalla escucha una lista de "Ver detalle, Ver detalle, Ver detalle..." sin poder distinguir a qué registro corresponde cada uno.

```tsx
{/* Todas las páginas usan el mismo texto sin contexto */}
<Link href={`/pedidos/${pedido.id}`}>Ver detalle</Link>
<Link href={`/calidad/${entry.id}`}>Ver detalle</Link>
<Link href={`/mantenimiento/${ticket.id}`}>Ver detalle</Link>
```

**Esperado:**
```tsx
<Link href={`/pedidos/${pedido.id}`} aria-label={`Ver detalle del pedido ${pedido.codigo}`}>
  Ver detalle
</Link>
```

---

### VIS-014 — `<Link>` Envolviendo `<Card>` en Inventario — Anti-patrón

**Tipo:** Consistency Testing / Semantic HTML
**Archivo:** [`inventario/page.tsx:57-68`](src/app/(portal)/inventario/page.tsx#L57-L68)

**Descripción:** Las tarjetas de navegación en Inventario envuelven `<Card>` interactivo dentro de un `<Link>`. Este patrón produce elementos interactivos anidados y comportamiento de foco incorrecto.

```tsx
{/* inventario/page.tsx — ❌ Link envuelve Card interactivo */}
<Link className="unstyled-link" href="/inventario/movimientos">
  <Card className="module-card">
    <Text weight="semibold">Movimientos de inventario</Text>
    <Text className="muted-text">Registra ingresos, salidas y ajustes.</Text>
  </Card>
</Link>
```

El mismo patrón existe en `page.tsx` (dashboard) con las module-cards.

---

## 🟡 Defectos Medios

---

### VIS-015 — Key de Array por Índice en Lista de Ítems Dinámica

**Tipo:** Boundary Value / React Reconciliation
**Archivo:** [`pedidos/nuevo/page.tsx:150`](src/app/(portal)/pedidos/nuevo/page.tsx#L150)

**Descripción:** Los ítems del formulario de nuevo pedido usan `idx` como key. Cuando el usuario elimina un ítem del medio de la lista, React reutiliza el DOM del elemento siguiente, causando que los inputs muestren valores del ítem eliminado.

**Flujo con defecto:**
1. Agregar 3 ítems: [A, B, C]
2. Eliminar el ítem B (índice 1)
3. El ítem C aparece en la posición de B con el valor del input de B momentáneamente

```tsx
{/* ❌ Índice como key */}
{detalles.map((detalle, idx) => (
  <div key={`detalle-${idx}`} className="detail-row">
```

---

### VIS-016 — `statusOptions` en Ticket Detail Duplica la Constante de Tipos

**Tipo:** Consistency / Single Source of Truth
**Archivo:** [`mantenimiento/[id]/page.tsx:32`](src/app/(portal)/mantenimiento/%5Bid%5D/page.tsx#L32)

**Descripción:** El array de opciones de estado en el formulario de edición del ticket está definido localmente, duplicando `TICKET_STATUSES` del sistema de tipos. Si se agrega un nuevo estado en `types.ts`, el dropdown no se actualizará automáticamente.

```typescript
// mantenimiento/[id]/page.tsx — ❌ Duplicado local
const statusOptions = ["Abierto", "EnProgreso", "Resuelto", "Cerrado"];

// types.ts — Fuente de verdad disponible
export const TICKET_STATUSES = ["Abierto", "EnProgreso", "Resuelto", "Cerrado"] as const;
```

---

### VIS-017 — `INSPECCION_STATUSES` Define Dos Variantes del Estado "Cerrado"

**Tipo:** State Coverage / Data Consistency
**Archivo:** [`types.ts`](src/lib/dataverse/types.ts)

**Descripción:** El tipo `EstadoInspeccionCalidad` incluye tanto `"Cerrada"` como `"Cerrado"` — valores semánticamente equivalentes en español (femenino/masculino del mismo concepto).

```typescript
export const INSPECCION_STATUSES = [
  "Abierta",
  "Cerrada",
  "Cerrado",  // ← duplicado semántico — ¿es un typo?
] as const;
```

**Impacto:** Si la base de datos almacena `"Cerrado"` pero el código espera `"Cerrada"` (o viceversa), el `StatusBadge` aplicará el fallback incorrecto.

---

### VIS-018 — Formato de Fecha Inconsistente entre Páginas

**Tipo:** Consistency Testing
**Archivos:** Múltiples páginas

**Descripción:** Todas las fechas se formatean con `toLocaleString("es-CO")` que incluye **fecha y hora**. Para campos como `fechaReporte` de un ticket, mostrar la hora puede ser información irrelevante. No hay distinción entre campos de solo-fecha y campos de fecha-hora.

**Casos:**

| Campo | Valor ejemplo | Mostrado como | ¿Correcto? |
|-------|-------------|---------------|-----------|
| `historial.fecha` | `2026-02-27T10:30:00Z` | `27/2/2026, 10:30:00 a. m.` | ✅ Fecha+hora apropiada |
| `ticket.fechaReporte` | `2026-02-27T10:30:00Z` | `27/2/2026, 10:30:00 a. m.` | ⚠️ Solo fecha sería suficiente |
| `pedidos` (tabla) | — | No se muestra fecha | ❌ Falta |

---

### VIS-019 — `form-grid` Aplicado Directamente al Elemento `Card`

**Tipo:** Layout / Component Usage
**Archivos:** [`pedidos/nuevo/page.tsx:119`](src/app/(portal)/pedidos/nuevo/page.tsx#L119), [`calidad/nuevo/page.tsx:68`](src/app/(portal)/calidad/nuevo/page.tsx#L68), [`mantenimiento/nuevo/page.tsx:65`](src/app/(portal)/mantenimiento/nuevo/page.tsx#L65)

**Descripción:** La clase `form-grid two-col` se aplica directamente al componente `Card` de Fluent UI. Card tiene su propio esquema de layout interno, y forzar un grid en su elemento raíz puede competir con el padding y estructura internos del componente, especialmente en diferentes versiones de Fluent UI.

```tsx
{/* ❌ form-grid aplicado directamente a Card */}
<Card className="form-grid two-col">
  <Field label="Empleado">...</Field>
  <Field label="Área">...</Field>
```

**Patrón correcto:**
```tsx
{/* ✅ Grid en contenedor interno del Card */}
<Card>
  <div className="form-grid two-col">
    <Field label="Empleado">...</Field>
    <Field label="Área">...</Field>
  </div>
</Card>
```

---

### VIS-020 — Columna "Técnico" en Mantenimiento Muestra "Sin asignar" Sin Estilo

**Tipo:** Visual Differentiation / Consistency
**Archivo:** [`mantenimiento/page.tsx:94`](src/app/(portal)/mantenimiento/page.tsx#L94)

**Descripción:** Cuando no hay técnico asignado, la celda muestra "Sin asignar" como texto plano, igual en apariencia al resto de los valores. No hay diferenciación visual (como texto muted o un badge especial) para indicar que el campo está vacío de forma intencional.

```tsx
{/* ❌ "Sin asignar" tiene el mismo estilo que valores reales */}
<TableCell>{ticket.tecnicoAsignado || "Sin asignar"}</TableCell>
```

**Esperado:** Texto muted o badge especial para valores vacíos:
```tsx
<TableCell>
  {ticket.tecnicoAsignado ?? (
    <Text className="muted-text">Sin asignar</Text>
  )}
</TableCell>
```

---

### VIS-021 — Formulario Nueva Inspección Sin Función `validate()` Explícita

**Tipo:** Form Validation Consistency
**Archivo:** [`calidad/nuevo/page.tsx:37-58`](src/app/(portal)/calidad/nuevo/page.tsx#L37-L58)

**Descripción:** A diferencia de `NuevoPedidoPage` que tiene una función `validate()` explícita con mensaje de error descriptivo, `NuevaInspeccionPage` delega la validación al `disabled` del botón y a los errores del API.

**Comparativa:**
```typescript
// pedidos/nuevo/page.tsx — ✅ Validación explícita con mensajes
const validate = () => {
  if (!empleadoNombre.trim()) {
    setError("Empleado y área son requeridos");
    return false;
  }
  return true;
};

// calidad/nuevo/page.tsx — ❌ Sin función de validación
const submit = async () => {
  setSaving(true);
  // Va directo al API sin validación cliente
  try { await apiFetch(...) }
};
```

**Impacto:** Cuando el API rechaza (ej. lote con formato inválido), el usuario ve un error genérico sin indicación del campo específico a corregir.

---

### VIS-022 — Sección "Calidad" Carece de Filtro por Resultado

**Tipo:** Feature Parity / Equivalence Partitioning
**Archivo:** [`calidad/page.tsx`](src/app/(portal)/calidad/page.tsx)

**Descripción:** La página de Calidad solo ofrece búsqueda de texto libre, sin filtro por el campo clave del módulo: el resultado (`Conforme` / `NoConforme`). Para un inspector de calidad, la acción más común es "ver todas las no conformes".

**Pedidos** tiene filtro por estado. **Calidad** no tiene equivalente para "Resultado".

---

## 🟢 Defectos Bajos

---

### VIS-023 — `colSpan` Hardcodeado Como Literal Numérico

**Tipo:** Boundary Value / Responsive
**Archivos:** [`pedidos/page.tsx:138`](src/app/(portal)/pedidos/page.tsx#L138)

**Descripción:** El empty state usa `colSpan={6}` — el número exacto de columnas visibles en desktop. En responsive, si las columnas cambian, el colSpan será incorrecto.

```tsx
{/* ❌ Número hardcodeado — cambiará si se añade/elimina una columna */}
<TableCell colSpan={6}>No hay pedidos para los filtros seleccionados.</TableCell>
```

---

### VIS-024 — Botón "Eliminar Ítem" Siempre Presente Aunque Deshabilitado

**Tipo:** Layout / Visual Clarity
**Archivo:** [`pedidos/nuevo/page.tsx:167-173`](src/app/(portal)/pedidos/nuevo/page.tsx#L167-L173)

**Descripción:** Cuando solo existe 1 ítem en la lista, el botón de eliminar está deshabilitado pero sigue ocupando su columna en el grid `2fr 1fr 1fr auto`. Esto crea espacio vacío en la columna `auto` que visualmente parece un error de layout.

**Consideración:** Cuando hay 1 solo ítem, ocultar el botón (`display: none`) o removerlo del DOM sería más limpio visualmente.

---

### VIS-025 — Fecha del Pedido Ausente en la Tabla de Listado

**Tipo:** Feature Parity / Consistency
**Archivo:** [`pedidos/page.tsx:111-134`](src/app/(portal)/pedidos/page.tsx#L111-L134)

**Descripción:** La tabla de pedidos muestra Código, Empleado, Área, Prioridad, Estado y Acción — pero **no incluye la fecha de creación**. La tabla del dashboard sí muestra una columna "Fecha" para los pendientes. El usuario no puede ordenar o ver cuándo fue creado un pedido desde el listado principal.

---

### VIS-026 — Animación `reveal-up` Aplica a Cards de Error Sin Efecto Deseado

**Tipo:** Animation / Exploratory
**Archivo:** [`globals.css:224-226`](src/app/globals.css#L224-L226)

**Descripción:** La animación `reveal-up` aplica a todos los hijos directos de `.page-container`, incluyendo los estados de error. Cuando un error aparece dinámicamente (después de la carga inicial), la animación ya se ejecutó — el error aparece sin animación de entrada, creando una inconsistencia entre el primer render y renders posteriores causados por errores de acciones.

---

## Resumen de Hallazgos por Archivo

| Archivo | Defectos | IDs |
|---------|----------|-----|
| `StatusBadge.tsx` | 1 crítico, 1 medio | VIS-001, (VIS-017) |
| `pedidos/[id]/page.tsx` | 1 crítico, 2 altos | VIS-004, VIS-006, VIS-007 |
| `pedidos/nuevo/page.tsx` | 1 crítico, 2 altos, 2 medios, 1 bajo | VIS-003, VIS-008, VIS-009, VIS-015, VIS-019, VIS-023 |
| `calidad/nuevo/page.tsx` | 1 crítico, 1 alto, 2 medios | VIS-002, VIS-008, VIS-019, VIS-021 |
| `calidad/page.tsx` | 1 crítico, 1 alto, 1 medio | VIS-001, VIS-010, VIS-022 |
| `mantenimiento/[id]/page.tsx` | 2 altos, 1 medio | VIS-005, VIS-011, VIS-016 |
| `mantenimiento/nuevo/page.tsx` | 1 alto, 1 medio | VIS-008, VIS-019 |
| `mantenimiento/page.tsx` | 1 alto, 1 medio | VIS-010, VIS-020 |
| `inventario/page.tsx` | 1 alto, 1 alto | VIS-012, VIS-014 |
| `types.ts` | 1 medio | VIS-017 |
| `globals.css` | 1 alto, 1 bajo | VIS-005, VIS-026 |

---

## Plan de Remediación Priorizado

### Iteración 1 — Críticos (Fix inmediato)

```
VIS-001  Agregar "Abierta" y "Cerrada" a statusAppearance en StatusBadge
VIS-002  Crear mapa de display labels: { NoConforme: "No Conforme" }
VIS-003  Agregar min={1} max={9999} step={1} al Input de cantidad
VIS-004  Remover la nota MVP de la card de Adjuntos
```

### Iteración 2 — Altos (Sprint corriente)

```
VIS-005  Envolver todos los spinners de carga en <div className="centered-state">
VIS-007  Deshabilitar botones de acción según el estado del pedido
VIS-008  Estandarizar patrón de botón en carga: usar texto alternativo, no Spinner interno
VIS-009  Limpiar el mensaje de error cuando el campo que lo causó cambia
VIS-010  Agregar fila de empty state a Calidad y Mantenimiento
VIS-011  Agregar toast de éxito en saveChanges() del Ticket Detail
VIS-012  Agregar campo de búsqueda al módulo de Inventario
VIS-013  Agregar aria-label descriptivo a todos los enlaces "Ver detalle"
VIS-014  Refactorizar Link-que-envuelve-Card al patrón correcto
VIS-006  Mover error de acciones críticas al área visible (top de la card de acciones)
```

### Iteración 3 — Medios y Bajos (Deuda técnica)

```
VIS-015  Cambiar key de índice a ID estable en lista de ítems de pedido
VIS-016  Importar TICKET_STATUSES en lugar de redefinir statusOptions localmente
VIS-017  Resolver ambigüedad Cerrada/Cerrado en INSPECCION_STATUSES
VIS-018  Crear helper formatDate(date, "date-only" | "datetime") reutilizable
VIS-019  Mover form-grid dentro del Card, no en el Card mismo
VIS-020  Aplicar muted text a valores "Sin asignar" y similares
VIS-021  Agregar validate() a NuevaInspeccionPage y NuevoTicketPage
VIS-022  Agregar filtro por Resultado a la página de Calidad
VIS-023  Extraer COLUMN_COUNT como constante o calcularla dinámicamente
VIS-024  Ocultar botón "Eliminar ítem" cuando hay solo 1 ítem
VIS-025  Agregar columna "Fecha" a la tabla de listado de pedidos
VIS-026  Evaluar cómo gestionar animaciones en renders posteriores al inicial
```

---

## Matriz de Riesgo

```
                    PROBABILIDAD DE OCURRENCIA
                    Baja        Media       Alta
                 ┌─────────┬───────────┬──────────────┐
IMPACTO   Alto   │         │  VIS-007  │ VIS-001      │
                 │         │  VIS-006  │ VIS-002      │
                 │         │           │ VIS-004      │
                 ├─────────┼───────────┼──────────────┤
          Medio  │ VIS-026 │  VIS-015  │ VIS-003      │
                 │ VIS-023 │  VIS-009  │ VIS-005      │
                 │         │  VIS-019  │ VIS-008      │
                 │         │  VIS-010  │ VIS-011      │
                 ├─────────┼───────────┼──────────────┤
          Bajo   │ VIS-024 │  VIS-016  │ VIS-013      │
                 │ VIS-025 │  VIS-021  │ VIS-020      │
                 └─────────┴───────────┴──────────────┘
```

**Zona roja (acción inmediata):** VIS-001, VIS-002, VIS-003, VIS-004, VIS-005, VIS-008, VIS-011
**Zona amarilla (próxima iteración):** VIS-007, VIS-009, VIS-010, VIS-012, VIS-013, VIS-015
**Zona verde (backlog):** VIS-016 al VIS-026
