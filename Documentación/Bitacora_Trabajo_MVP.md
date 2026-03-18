# Bitácora de Trabajo ARGOS (Pilot → MVP)

Fecha de actualización: 18 de marzo de 2026

## 1) Objetivo de esta etapa
Evolucionar el portal desde un estado piloto a una base MVP más robusta, con foco en seguridad, estabilidad operativa, control de flujo de negocio y calidad UX.

## 2) Resumen de avances implementados

### Seguridad de plataforma
- Se agregó baseline de headers de seguridad HTTP en Next.js:
  - `Content-Security-Policy`
  - `Strict-Transport-Security` (solo producción)
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Se fortaleció validación de variables de entorno:
  - Reglas de secreto de sesión (`APP_SESSION_SECRET`) en entornos no demo.
  - Restricción de credenciales demo por defecto fuera de demo.
  - Nuevos flags para control de modo demo y captcha.

### Autenticación, sesión y protección de API
- Se introdujo protección CSRF para métodos mutables (`POST/PUT/PATCH/DELETE`) con cookie + header (`x-csrf-token`).
- Se implementó validación de origen para reforzar protección same-origin.
- Se ajustó login/logout para emitir y limpiar token CSRF junto a sesión.
- Se bloqueó login demo cuando no está explícitamente habilitado (`DEMO_LOGIN_ENABLED=true`).
- Se implementó rate-limit en login operario (ventana, intentos, lock temporal).

### Flujos de negocio (Aprobación/SAP)
- Se agregaron guardas de transición de estado:
  - Pedido a aprobación: solo desde estados válidos.
  - Pedido a SAP: solo desde `Aprobado`.
  - Ajustes de inventario: validación de tipo y estado antes de flujo.
- Se mejoró idempotencia funcional (no reenviar en estados ya procesados).
- Se añadió retry/backoff y timeout configurable para disparo HTTP de flujos.

### RBAC y alcance por sede
- Se reforzó validación de alcance por sede en repositorios API (detalle/actualización/adjuntos), evitando operar entidades fuera de scope del usuario.

### Calidad UX y consistencia visual
- Se corrigieron estados faltantes y labels semánticos en `StatusBadge` (incluye `Abierta`, `Cerrada`, `No conforme`, etc.).
- Se normalizó visualización de resultados de calidad (`NoConforme` → `No conforme`).
- Se agregaron validaciones de límites numéricos en formularios de Pedidos e Inventario.

### CI/CD
- Se reforzó workflow CI con:
  - `typecheck`
  - `lint`
  - `build`
  - `npm audit` (en modo no bloqueante para no detener integración mientras se planifican upgrades de dependencias)

### Operación local y DX
- Se creó script de recuperación de entorno dev:
  - `npm run dev:reset`
  - Libera puertos 3000/3001/3002/3500 y limpia locks `.next/dev/lock`.
- Se agregó `npm run dev:3500` para levantar directamente en puerto 3500.
- También se habilitó equivalente en `pilot-static`.

## 3) Corrección específica de hidratación (SSR/cliente)
Se corrigió el error de hidratación por diferencias de formateo de fecha entre servidor y navegador.

### Causa
Uso de `toLocaleString(...)` en render de componentes cliente con SSR, susceptible a variaciones por runtime/locale.

### Solución aplicada
- Se creó helper determinístico: `src/lib/format/date.ts`.
- Se reemplazó `toLocaleString` por `formatDateTimeGt(...)` en páginas clave:
  - Home dashboard (`Mis pendientes`)
  - Inventario movimientos
  - Mantenimiento detalle
  - Pedidos detalle (timeline y adjuntos)
  - Calidad detalle
  - Integraciones SSFF

Resultado: render consistente entre SSR y cliente, eliminando mismatch por formato de fecha.

## 4) Archivos principales impactados
- `next.config.ts`
- `src/lib/config/env.ts`
- `src/lib/auth/*` (sesión, protección API, rate-limit, constantes)
- `src/app/api/auth/*`
- `src/app/api/flows/*`
- `src/lib/flows/triggers.ts`
- `src/lib/dataverse/repositories/*`
- `src/components/ui/StatusBadge.tsx`
- Páginas de módulos en `src/app/(portal)/*`
- `.github/workflows/main.yml`
- `scripts/dev-reset.sh`

## 5) Validación ejecutada
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅

## 6) Estado actual
- La rama `pilot` ya tiene un lote de hardening MVP subido.
- Quedan actividades de siguiente fase para cerrar postura enterprise completa:
  - pruebas automatizadas (unit/integration/e2e)
  - contrato OpenAPI versionado con backend
  - escaneo AV/DLP para adjuntos
  - observabilidad completa (trazas, métricas y SLO)
