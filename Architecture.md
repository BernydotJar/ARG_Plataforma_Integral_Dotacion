# Architecture - ARGOS Plataforma Integral

## 1. Objetivo arquitectónico

Implementar un portal web enterprise para dotación, inventario, calidad y mantenimiento, eliminando dependencia de Dataverse y alineando la solución con:

- Frontend/BFF en Next.js
- Backend de negocio en .NET 8 Web API
- Persistencia en Azure SQL Database
- Orquestación de integraciones vía Power Automate y Azure Functions

## 2. Capas

### 2.1 Frontend (Portal)

- Next.js App Router + TypeScript
- Fluent UI v9
- UX responsive (desktop/tablet/mobile)
- Módulos funcionales integrados en un único shell

### 2.2 BFF (Next Route Handlers)

- Endpoints en `src/app/api`
- Validación de payload (zod)
- Control de sesión/cookies
- RBAC y scoping por sede antes de invocar backend de negocio

### 2.3 Backend de negocio (externo a este repo)

- .NET 8 Web API
- Reglas de negocio: motor de kits, ventanas de bloqueo, auditoría, estados de flujo
- Integraciones SAP/firmas/documental mediante servicios externos

### 2.4 Datos

- Azure SQL Database como sistema de registro
- Row-level security y políticas de acceso por sede/rol implementadas en backend
- Auditoría transaccional para operaciones críticas

### 2.5 Integración

- Power Automate para aprobaciones y procesos SAP
- Azure Functions para sincronización SFTP con SuccessFactors
- Azure Blob Storage para staging documental

## 3. Seguridad

- Entra ID / External ID (B2C) para autenticación
- MFA para perfiles operativos
- Captcha opcional en login operario (Turnstile en este repo)
- Secretos y credenciales vía Key Vault (objetivo de despliegue)
- Recomendado: WAF (Front Door), rate limiting, correlation IDs

## 4. Runtime en este repositorio

Los repositorios de dominio operan con dos estrategias:

1. `demo`: mock in-memory local
2. `api`: consumo HTTP de backend .NET

Selección de modo:

- `DEMO_MODE=true` => demo
- Sin `BACKEND_API_BASE_URL` => demo
- Con `BACKEND_API_BASE_URL` => api

## 5. Contratos backend esperados

El frontend espera endpoints REST para:

- Pedidos + adjuntos
- Inventario (movimientos/stock)
- Mantenimiento (tickets)
- Calidad (inspecciones)
- Catálogos y administración de roles
- Registro de integración e historial

El BFF soporta payload directo o envelope `{ data: ... }`.

## 6. Decisiones principales

1. Mantener BFF en Next para encapsular sesión, seguridad y trazabilidad.
2. Centralizar reglas de negocio y persistencia en .NET + Azure SQL.
3. Conservar modo demo para pruebas funcionales sin bloquear despliegues.
4. Mantener SAP fuera del navegador y orquestar por flujos seguros.

## 7. Roadmap técnico inmediato

1. Consolidar contrato OpenAPI entre frontend y backend .NET.
2. Implementar observabilidad end-to-end (request-id, trazas, métricas).
3. Migrar naming legacy `lib/dataverse` a `lib/domain`.
4. Integrar pruebas E2E con backend real en ambiente QA.
5. Aplicar hardening de seguridad productiva (WAF, KV, políticas cookies por dominio).
