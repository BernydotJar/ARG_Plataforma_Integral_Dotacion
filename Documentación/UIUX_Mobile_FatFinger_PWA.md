# UI/UX Mobile Fat-Finger + PWA (ARGOS)

## 1) Hallazgos criticos (operarios moviles con guantes)

### 1.1 Touch targets pequenos en acciones frecuentes
- Riesgo: botones de tabla y acciones secundarias con area de toque reducida.
- Impacto: toques fallidos, reintentos, fatiga operativa.
- Criterio recomendado: minimo 48x48 px (ideal 52 px para guantes).

### 1.2 Alta densidad en listados y filtros en movil
- Riesgo: filas y celdas compactas, filtros en una sola linea.
- Impacto: baja legibilidad en campo y errores de seleccion.
- Criterio recomendado: stack vertical en movil + spacing tactil.

### 1.3 Tablas no optimizadas para uso en mano
- Riesgo: truncamiento de columnas y scroll no controlado.
- Impacto: perdida de contexto en tickets/pedidos/inspecciones.
- Criterio recomendado: contenedor horizontal dedicado (`table-scroll`) y celdas no-wrap en movil.

### 1.4 Navegacion movil mejorable para operacion continua
- Riesgo: topbar no fija y controles pequenos en sesiones largas.
- Impacto: mayor friccion para cambio de modulo/acciones rapidas.
- Criterio recomendado: topbar sticky + controles tactiles consistentes.

### 1.5 Asistente RAG con tono de demo (no soporte L1)
- Riesgo: respuestas genericas sin pasos resolutivos.
- Impacto: se mantiene dependencia de soporte para casos repetitivos.
- Criterio recomendado: salida experta con diagnostico, pasos, validacion y criterio de escalamiento.

## 2) Cambios implementados (priorizados y accionables)

## P1 - Critico (aplicado)
- PWA base instalada y registrable:
  - `manifest.webmanifest`
  - `sw.js`
  - `offline.html`
  - iconos `192/512`
- Archivos:
  - `public/manifest.webmanifest`
  - `public/sw.js`
  - `public/offline.html`
  - `public/icons/argos-192.png`
  - `public/icons/argos-512.png`
  - `src/components/pwa/PwaRegister.tsx`
  - `src/app/layout.tsx`
  - `next.config.ts` (headers para SW)

## P1 - Critico (aplicado)
- Paridad PWA para version pilot-static (GitHub Pages):
  - `pilot-static/public/manifest.webmanifest`
  - `pilot-static/public/sw.js`
  - `pilot-static/public/offline.html`
  - `pilot-static/public/icons/argos-192.png`
  - `pilot-static/public/icons/argos-512.png`
  - `pilot-static/src/components/pwa/PwaRegister.tsx`
  - `pilot-static/src/app/layout.tsx`

## P1 - Critico (aplicado)
- Fat-finger y mobile-first visual:
  - targets minimos (`.fui-Button`, `.touch-action-button`)
  - topbar sticky en movil
  - `filter-row` en columna en movil
  - `table-scroll` para listados
  - celdas no-wrap y mayor alto tactil
- Archivos:
  - `src/app/globals.css`
  - `pilot-static/src/app/globals.css`

## P1 - Critico (aplicado)
- Listados core adaptados con tabla scroll + CTA tactil:
  - Pedidos, Inventario, Calidad, Mantenimiento
- Archivos:
  - `src/app/(portal)/pedidos/page.tsx`
  - `src/app/(portal)/inventario/page.tsx`
  - `src/app/(portal)/calidad/page.tsx`
  - `src/app/(portal)/mantenimiento/page.tsx`
  - `pilot-static/src/app/(portal)/pedidos/page.tsx`
  - `pilot-static/src/app/(portal)/inventario/page.tsx`
  - `pilot-static/src/app/(portal)/calidad/page.tsx`
  - `pilot-static/src/app/(portal)/mantenimiento/page.tsx`
  - `src/components/ui/PageHeader.tsx`
  - `pilot-static/src/components/ui/PageHeader.tsx`

## P1 - Critico (aplicado)
- RAG elevado a soporte operativo L1:
  - base de conocimiento con guias de diagnostico/pasos/validacion/escalamiento
  - salida estructurada para autoservicio
- Archivos:
  - `src/lib/rag/types.ts`
  - `src/lib/rag/knowledge-base.ts`
  - `src/lib/rag/engine.ts`
  - `src/app/(portal)/asistente-rag/page.tsx`
  - paridad en `pilot-static/src/lib/rag/*` y `pilot-static/src/app/(portal)/asistente-rag/page.tsx`

## 3) Minimos PWA para produccion (sin romper desktop)

### 3.1 Requisitos tecnicos minimos
- HTTPS obligatorio.
- Manifest valido con iconos `192` y `512` (maskable).
- Service Worker registrado y actualizado por version de cache.
- Fallback offline para navegacion basica (`offline.html`).

### 3.2 Installability UX
- Prompt de instalacion controlado (A2HS) solo en contexto movil.
- Mensaje corto: beneficio operativo en campo (acceso rapido, continuidad).
- No bloquear desktop: instalacion visible solo cuando el navegador lo soporta.

### 3.3 Estrategia de cache minima
- `Network-first` para navegacion.
- `Cache-first` o `stale-while-revalidate` para CSS/JS/imagenes/fonts.
- Invalida cache por version (`argos-pwa-vX`).

### 3.4 Observabilidad y operacion
- Registrar errores de SW y tasa de fallback offline.
- Medir eventos: install prompt mostrado, aceptado, cancelado.
- Revisar cada release: manifest + sw + iconos + scope.

### 3.5 Seguridad
- Mantener CSP actual y scope controlado del SW.
- No cachear respuestas sensibles de API con datos personales.
- Logout invalida sesion y evita contenido privado en cache de navegacion.

## 4) Checklist de QA rapido (movil)
- Botones accionables min 48x48.
- Formularios sin zoom inesperado al enfocar input.
- Tablas navegables por scroll horizontal sin romper layout.
- Drawer/menu accesible con una mano.
- PWA instalable en Android/iOS compatible.
- Asistente RAG responde con pasos operativos y criterio claro de escalamiento.

## 5) Actualizacion de endurecimiento (Mar 2026)
- Service Worker endurecido para evitar cache de rutas privadas (`/pedidos`, `/inventario`, `/calidad`, `/mantenimiento`, `/admin`, `/asistente-rag`) y limpieza explicita de cache al cerrar sesion (`ARGOS_CLEAR_CACHE`).
- Topbar movil ajustado para operacion en campo: badge de rol truncado/oculto en anchos reducidos y botones tactiles reforzados.
- Safe-area iOS (modo standalone PWA) agregado para evitar solape con notch en topbar y contenido inferior.
- Tablas administrativas envueltas en `table-scroll` para evitar corte horizontal en 961-1100 px.
- Motor RAG ajustado para reducir falsos positivos: ahora exige overlap lexical real y baja confianza maxima cuando no hay evidencia fuerte.
