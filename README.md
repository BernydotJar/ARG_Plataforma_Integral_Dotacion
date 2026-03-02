# ARGOS - Plataforma Integral

Portal corporativo responsivo construido con **Next.js + TypeScript + Fluent UI** para el frente web, conectado a un **backend .NET 8 Web API** (fuente de verdad en **Azure SQL Database**) y con orquestación de integraciones vía **Power Automate**.

## 1. Arquitectura actual (pivot sin Dataverse)

- **Frontend/BFF:** Next.js (App Router) + Route Handlers
- **Backend de negocio:** .NET 8 Web API (externo a este repo)
- **Persistencia:** Azure SQL Database (gestionada por backend)
- **Autenticación:** Microsoft Entra ID / External ID (B2C)
- **Integración:** Power Automate (aprobaciones + SAP)
- **Fallback:** Modo demo in-memory cuando no existe `BACKEND_API_BASE_URL`

## 2. Alcance MVP implementado en este repo

- Login corporativo con Entra ID + sesión segura
- Login operario piloto (demo) con captcha opcional (Turnstile)
- RBAC por roles y scoping por sede
- Módulos de negocio:
  - Pedidos
  - Inventario
  - Calidad
  - Mantenimiento
  - Administración (catálogos/roles)
- CRUD operativo para Pedidos/Movimientos/Tickets (vía backend API o demo)
- Adjuntos en detalle de pedidos (carga/listado/eliminación)
- Disparo de flujos de aprobación/SAP con registro de integración

## 3. Instalación y ejecución

Requisitos:

- Node.js 20+
- npm 10+

Comandos:

```bash
npm install
npm run dev -- --port 3500
```

Build:

```bash
npm run lint
npm run build
npm run start
```

## 4. Variables de entorno

Crear `.env.local` en la raíz.

### 4.1 Base

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | No | Nombre visible de la app |
| `APP_SESSION_SECRET` | Sí (prod) | Secreto para cookie de sesión |
| `DEMO_MODE` | No | `true` para forzar modo demo |
| `DEFAULT_SEDES` | No | CSV de sedes por defecto |
| `DEMO_OPERARIO_PASSWORD` | No | Contraseña login operario demo |

### 4.2 Entra ID / External ID

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_ENTRA_TENANT_ID` | Sí (SSO) | Tenant ID Entra |
| `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Sí (SSO) | Client ID app pública |
| `NEXT_PUBLIC_ENTRA_REDIRECT_URI` | No | Redirect explícito |
| `ENTRA_TENANT_ID` | Sí (SSO) | Validación server-side |
| `ENTRA_CLIENT_ID` | Sí (SSO) | Audience del id_token |

Mapeo opcional de grupos -> roles:

- `ENTRA_GROUP_SUPERADMIN`
- `ENTRA_GROUP_ADMINLOCAL`
- `ENTRA_GROUP_USUARIOPEDIDOS`
- `ENTRA_GROUP_USUARIOFINAL`
- `ENTRA_GROUP_OPERARIOBODEGA`
- `ENTRA_GROUP_INSPECTORCALIDAD`
- `ENTRA_GROUP_TECNICOMANTENIMIENTO`

### 4.3 Backend API (.NET 8 + Azure SQL)

| Variable | Requerida | Descripción |
|---|---|---|
| `BACKEND_API_BASE_URL` | Sí (modo real) | URL base del backend API |
| `BACKEND_API_KEY` | No | Header `x-api-key` |
| `BACKEND_API_BEARER_TOKEN` | No | Bearer token servicio-servicio |
| `BACKEND_API_TIMEOUT_MS` | No | Timeout HTTP (default 10000) |

Si no existe `BACKEND_API_BASE_URL`, la app opera en **modo demo**.

### 4.4 Captcha operario (opcional)

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Render captcha en UI |
| `TURNSTILE_SECRET_KEY` | No | Valida token en backend Next |

### 4.5 Power Automate Flows

| Variable | Requerida | Descripción |
|---|---|---|
| `FLOW_TRIGGER_MODE` | No | `http` (preferido) o `stub` |
| `FLOW_API_KEY` | No | `x-api-key` para trigger HTTP |
| `FLOW_BEARER_TOKEN` | No | Bearer para trigger HTTP |
| `FLOW_APPROVAL_PEDIDO_URL` | No | Endpoint aprobación pedido |
| `FLOW_APPROVAL_AJUSTE_URL` | No | Endpoint aprobación ajuste |
| `FLOW_SAP_ENVIAR_PEDIDO_URL` | No | Endpoint SAP enviar pedido |
| `FLOW_SAP_SYNC_STATUS_URL` | No | Endpoint SAP sync estado |

## 5. Contratos esperados del Backend API

Este frontend espera endpoints REST equivalentes a:

- `GET/POST /pedidos`
- `GET/PATCH/DELETE /pedidos/{id}`
- `GET/POST /pedidos/{id}/adjuntos`
- `DELETE /pedidos/{id}/adjuntos/{attachmentId}`
- `GET/POST /inventario/movimientos`
- `PATCH /inventario/movimientos/{id}`
- `GET /inventario/stock`
- `GET/POST /mantenimiento/tickets`
- `GET/PATCH /mantenimiento/tickets/{id}`
- `GET/POST /calidad`
- `GET /calidad/{id}`
- `GET /admin/catalogos`
- `GET/POST /admin/catalogos/centros-costo`
- `GET/POST /admin/catalogos/kits`
- `GET /admin/usuarios-roles`
- `POST /integration/historial`
- `POST /integration/requests`

Admite respuesta directa o sobre `{ data: ... }`.

## 6. Estructura principal

```txt
src/
  app/
    (portal)/...                 # páginas funcionales
    api/...                      # BFF (auth, CRUD, flows)
  components/                    # UI reutilizable
  lib/
    auth/                        # sesión y autorización
    backend/                     # cliente HTTP hacia .NET API
    config/                      # env server/client
    dataverse/                   # modelos + repositorios (carpeta legacy de nombre)
    flows/                       # disparo de Power Automate
    http/                        # fetch client browser
```

## 7. Notas de transición

- El nombre de carpeta `lib/dataverse` se mantiene temporalmente por compatibilidad, pero la ejecución real ya está orientada a **Backend API + Azure SQL**.
- `src/lib/dataverse/client.ts` quedó como stub explícito (Dataverse deshabilitado).
- Próximo paso recomendado: renombrar carpeta `dataverse` a `data`/`domain` para eliminar herencia de naming.
