# Architecture - ARGOS Plataforma Integral

## 1. Objetivo arquitectónico

Sustituir Power Pages por una UI moderna en Next.js, manteniendo Power Platform para datos y orquestación:

- UI/UX y API ligera en Next.js
- Dataverse como sistema de registro
- Power Automate para aprobación/SAP

## 2. Capas

## 2.1 Frontend

- **Next.js App Router + TypeScript**
- **Fluent UI v9** para look-and-feel corporativo Microsoft
- Navegación por módulos en un único portal
- Layout responsive con sidebar (desktop) + drawer (mobile)

## 2.2 AuthN/AuthZ

- Login con **MSAL Browser** (Entra ID)
- `id_token` enviado al backend y validado con JWKS (issuer/audience)
- Cookie de sesión `httpOnly` firmada (`HS256`)
- Resolución de roles por:
  - claim `roles`
  - mapeo de grupos Entra (`ENTRA_GROUP_*`)
- Scoping por `Sede` en claims (`sede` / `extension_Sede`) y enforcement en repositorio/API

## 2.3 API Layer (Next Route Handlers)

- BFF (Backend for Frontend) en `src/app/api`
- Guard de autenticación por endpoint (`requireApiUser`)
- Guard de autorización por rol en endpoints sensibles
- Contratos tipados y validación de payload con `zod`

## 2.4 Data Access

- Cliente Dataverse Web API (`client_credentials`)
- Repositorio con dos runtimes:
  - `dataverse` (real)
  - `demo` (mock in-memory)
- CRUD MVP implementado para:
  - `PedidoDotacion`
  - `MovimientoInventario`
  - `TicketMantenimiento`
- Registro de auditoría en `HistorialEvento`

## 2.5 Orquestación (Power Automate)

Servicio de trigger desacoplado (`lib/flows/triggers.ts`) con dos estrategias:

1. **HTTP trigger** (preferido)
   - Llamada directa a endpoint de flow
   - Soporte `x-api-key` o bearer token
2. **IntegrationRequest en Dataverse**
   - Portal inserta solicitud
   - Flow procesa evento desde Dataverse

Flows cubiertos:

- Aprobación Pedido Dotación
- Aprobación Ajuste Inventario
- SAP enviar pedido
- SAP sync status

## 3. Principales decisiones

1. **BFF en Next**
   - Evita exponer Dataverse/SAP directo desde browser.
   - Centraliza seguridad y trazabilidad.

2. **MSAL + validación server-side**
   - UI con experiencia SSO moderna.
   - API solo confía en sesión emitida tras verificar token Entra.

3. **Modo demo como fallback nativo**
   - Permite demo funcional sin bloquear por credenciales.
   - Acelera validación de UX/proceso en pilotos.

4. **SAP fuera de la app web**
   - Mantiene lógica de integración en flows (no en frontend).
   - Menor acoplamiento, menor riesgo de seguridad.

## 4. Seguridad

- Sin acceso directo a SAP desde browser
- Sesión firmada y `httpOnly`
- Enforcements por rol y sede en API/repo
- Sugerido para producción:
  - rotación de secretos
  - hardened cookie policy y SameSite por dominio
  - validación estricta de scopes/claims
  - observabilidad (logs + correlation IDs)

## 5. Escalabilidad y evolución

Siguientes pasos recomendados:

1. Pasar mock a persistencia real completa en Dataverse (mapeo final de campos)
2. Incorporar colas/reintentos para integración SAP
3. Embedding de Power BI por rol/sede
4. Tests E2E de procesos críticos (pedido aprobación + SAP)
5. Hardening de RBAC con App Roles de Entra + políticas por módulo

## 6. Limitaciones MVP

- Mapeos de columnas Dataverse (`crf1_*`) pueden requerir ajuste a naming real
- Adjuntos en pantallas están preparados pero no se implementó carga binaria completa
- Administración de usuarios/roles usa dataset base de demostración
