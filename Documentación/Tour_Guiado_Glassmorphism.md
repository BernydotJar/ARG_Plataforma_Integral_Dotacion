# Tour Guiado ARGOS (Glassmorphism)

## 1. Objetivo
Implementar un tour guiado de producto, activado por botón, con estilo visual glassmorphism tipo corporativo/Apple-like para acelerar onboarding en:
- Shell global (topbar + navegación)
- Inicio
- Pedidos
- Inventario
- Calidad
- Mantenimiento

Se implementó en ambos frontends para mantener paridad funcional:
- `src/` (app principal)
- `pilot-static/src/` (pilot para GitHub Pages)

## 2. Diseño UX aplicado
### Principios
- Activación manual y no intrusiva mediante botón `Tour` en topbar.
- Spotlights sobre elementos reales (`data-tour`) con fallback si no existen.
- Overlay translúcido con blur, borde suave y sombras profundas.
- Mensajería corta, operativa y orientada a tarea.
- Navegación por teclado (`Esc`, `ArrowLeft`, `ArrowRight`).

### Estilo visual
- Capa oscura con `backdrop-filter: blur(...)`
- Tarjeta flotante translúcida con borde claro y gradiente suave
- Barra de progreso horizontal por paso
- CTA de `Anterior`, `Omitir`, `Siguiente/Finalizar`

## 3. Arquitectura técnica
### Componente principal
- `src/components/tour/AppTour.tsx`
- `pilot-static/src/components/tour/AppTour.tsx`

### Integración en layout
- Botón de activación en topbar (`data-tour="tour-toggle"`)
- Render condicional del tour en `PortalShell`
- Estado local: `tourOpen`, `tourRunKey` (reinicio limpio del tour)

### Anclajes estables
Se agregaron selectores `data-tour` en:
- Navegación global (`nav-inicio`, `nav-pedidos`, etc.)
- Header de página y acción primaria
- Tarjetas principales en Inicio e Inventario
- Bloques de filtros y tablas en Pedidos/Calidad/Mantenimiento

## 4. Cobertura de pasos
### Shell
- Contexto operativo (topbar)
- Inicio
- Pedidos
- Inventario
- Calidad
- Mantenimiento

### Inicio
- Tarjetas de módulos
- Tarjeta principal de Pedidos
- Mis pendientes

### Módulos
- Pedidos: filtros, crear pedido, tabla
- Inventario: movimientos, ajustes, stock
- Calidad: búsqueda, nueva inspección, tabla
- Mantenimiento: búsqueda, nuevo ticket, tabla

## 5. Accesibilidad y robustez
- Cierre por `Esc`
- Avance/retroceso con teclado
- Focus inicial en controles del tour
- Persistencia de cierre/finalización en `localStorage` (clave versionada)
- Si no hay targets disponibles, se muestra estado informativo en lugar de fallar

## 6. QA ejecutado
Validación técnica completada en ambas apps:
1. `npm run lint` ✅
2. `npm run build` (root) ✅
3. `npm --prefix pilot-static run build` ✅

## 7. Archivos actualizados
### Root
- `src/components/tour/AppTour.tsx`
- `src/components/layout/PortalShell.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/app/(portal)/page.tsx`
- `src/app/(portal)/pedidos/page.tsx`
- `src/app/(portal)/inventario/page.tsx`
- `src/app/(portal)/calidad/page.tsx`
- `src/app/(portal)/mantenimiento/page.tsx`
- `src/app/globals.css`

### Pilot Static
- `pilot-static/src/components/tour/AppTour.tsx`
- `pilot-static/src/components/layout/PortalShell.tsx`
- `pilot-static/src/components/ui/PageHeader.tsx`
- `pilot-static/src/app/(portal)/page.tsx`
- `pilot-static/src/app/(portal)/pedidos/page.tsx`
- `pilot-static/src/app/(portal)/inventario/page.tsx`
- `pilot-static/src/app/(portal)/calidad/page.tsx`
- `pilot-static/src/app/(portal)/mantenimiento/page.tsx`
- `pilot-static/src/app/globals.css`

## 8. Siguientes mejoras sugeridas
1. Tour por rol (steps dinámicos según permisos y módulo).
2. Tour multi-ruta encadenado (navegación automática entre páginas).
3. Métricas de adopción (inicio/finalización por usuario y rol).
4. Opción de animaciones reducidas por preferencia del usuario.

## 9. Ajuste para Presentación RFQ (Mar 2026)
Se actualizó el guion del tour con enfoque ejecutivo y lenguaje corporativo:
1. Dotación / Pedidos (prioridad de negocio)
2. Admin Usuarios (RBAC y 4 perfiles)
3. Integraciones (SFTP SuccessFactors + SAP)
4. Asistente RAG (diferenciador)

Calidad y Mantenimiento se mantienen como capacidades extensibles y se muestran de forma breve para no desviar el foco del alcance de Dotación.

### Evidencia de funcionalidad en `pilot-static`
- `Dotación / Pedidos`: `/pedidos`
- `Admin Usuarios`: `/admin/usuarios-roles` con pasos `usuarios-perfiles-rfq` y `usuarios-matriz-rbac`
- `Integraciones`: `/admin/integraciones` con pasos `integraciones-placeholders` e `integraciones-estado`
- `Asistente RAG`: `/asistente-rag`
