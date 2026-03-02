# ARGOS - Plataforma Integral

Portal corporativo responsivo construido con **Next.js + TypeScript + Fluent UI** para reemplazar la capa UI de Power Pages, manteniendo:

- **Dataverse** como sistema de registro (CRUD + scoping por sede)
- **Power Automate Cloud Flows** para aprobaciones e integración SAP
- **Microsoft Entra ID (MSAL)** para autenticación SSO
- **Modo Demo** automático cuando faltan credenciales de Dataverse

## 1. Alcance implementado (MVP)

- Login con Microsoft Entra ID (MSAL browser + validación server-side de `id_token`)
- Sesión segura con cookie `httpOnly` firmada (`HS256`)
- Navegación por rol: `SuperAdmin`, `AdminLocal`, `UsuarioPedidos`, `UsuarioFinal`, `OperarioBodega`, `InspectorCalidad`, `TecnicoMantenimiento`
- Filtro/scoping por `Sede` en capa de datos
- CRUD operativo para:
  - `PedidoDotacion`
  - `MovimientoInventario`
  - `TicketMantenimiento`
- Disparo de flows:
  - Enviar pedido a aprobación
  - Enviar ajuste de inventario a aprobación
  - Enviar pedido a SAP
  - Sincronizar estado SAP (manual / stub)
- Registro de eventos en `HistorialEvento`
- Pantallas completas:
  - `/login`, `/`
  - `/pedidos`, `/pedidos/nuevo`, `/pedidos/[id]`
  - `/inventario`, `/inventario/movimientos`, `/inventario/ajuste`
  - `/calidad`, `/calidad/nuevo`, `/calidad/[id]`
  - `/mantenimiento`, `/mantenimiento/nuevo`, `/mantenimiento/[id]`
  - `/admin/catalogos`, `/admin/usuarios-roles`

## 2. Requisitos

- Node.js 20+
- npm 10+

## 3. Instalación y ejecución

```bash
npm install
npm run dev -- --port 3500
```

Desarrollo local:

- URL local recomendada: `http://localhost:3500`
- Si `3000` está ocupado, mantener explícito `--port 3500`

Producción local:

```bash
npm run build
npm run start
```

## 4. Variables de entorno

Crear `.env.local` en la raíz.

### 4.1 Base

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | No | Nombre visible de la app |
| `APP_SESSION_SECRET` | Sí (prod) | Secreto para firmar cookie de sesión |
| `DEMO_MODE` | No | `true` para forzar modo demo |
| `DEMO_OPERARIO_PASSWORD` | No | Contraseña para login operario en modo demo (default: `Operario2026!`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Site key de Cloudflare Turnstile (habilita widget en login operario) |
| `TURNSTILE_SECRET_KEY` | No | Secret key de Cloudflare Turnstile (valida token en backend) |
| `DEFAULT_SEDES` | No | CSV de sedes por defecto (ej: `SEDE-CENTRAL,SEDE-NORTE`) |

### 4.2 Entra ID / MSAL

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_ENTRA_TENANT_ID` | Sí (SSO) | Tenant ID de Entra |
| `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Sí (SSO) | Client ID de la app pública web |
| `NEXT_PUBLIC_ENTRA_REDIRECT_URI` | No | Redirect explícito (si no, usa `http://localhost:3000/login`) |
| `ENTRA_TENANT_ID` | Sí (SSO) | Tenant ID para validación server-side |
| `ENTRA_CLIENT_ID` | Sí (SSO) | Audience esperada del `id_token` |

### 4.3 Mapeo de grupos Entra -> roles app

| Variable |
|---|
| `ENTRA_GROUP_SUPERADMIN` |
| `ENTRA_GROUP_ADMINLOCAL` |
| `ENTRA_GROUP_USUARIOPEDIDOS` |
| `ENTRA_GROUP_USUARIOFINAL` |
| `ENTRA_GROUP_OPERARIOBODEGA` |
| `ENTRA_GROUP_INSPECTORCALIDAD` |
| `ENTRA_GROUP_TECNICOMANTENIMIENTO` |

Si no llegan roles/grupos, se asigna `UsuarioFinal`.

### 4.4 Dataverse

| Variable | Requerida | Descripción |
|---|---|---|
| `DATAVERSE_URL` | Sí (modo real) | URL org Dataverse (`https://<org>.crm.dynamics.com`) |
| `DATAVERSE_TENANT_ID` | Sí (modo real) | Tenant del App Registration |
| `DATAVERSE_CLIENT_ID` | Sí (modo real) | Client ID app confidencial |
| `DATAVERSE_CLIENT_SECRET` | Sí (modo real) | Client secret app confidencial |

Si falta cualquiera, el sistema entra en modo demo automáticamente.

### 4.5 Flows (Power Automate)

| Variable | Requerida | Descripción |
|---|---|---|
| `FLOW_TRIGGER_MODE` | No | `http` (preferido) o `dataverse` |
| `FLOW_API_KEY` | No | Header `x-api-key` para endpoint HTTP |
| `FLOW_BEARER_TOKEN` | No | `Authorization: Bearer ...` para endpoint HTTP |
| `FLOW_APPROVAL_PEDIDO_URL` | No | Endpoint flow aprobación pedido |
| `FLOW_APPROVAL_AJUSTE_URL` | No | Endpoint flow aprobación ajuste |
| `FLOW_SAP_ENVIAR_PEDIDO_URL` | No | Endpoint flow SAP envío |
| `FLOW_SAP_SYNC_STATUS_URL` | No | Endpoint flow SAP sync |

Si no hay URL/config suficiente, el sistema registra `IntegrationRequest` (o stub en modo demo).

### 4.6 Captcha (operario, opcional)

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Site key para renderizar captcha en la UI |
| `TURNSTILE_SECRET_KEY` | No | Secret key para validar token en server |

Si ambas variables están configuradas, el login de operario exige completar captcha antes de crear sesión.

## 5. Seguridad de flows (recomendado)

### Opción A (preferida): HTTP trigger protegido

1. Publicar flow con trigger HTTP.
2. Proteger endpoint con:
   - Azure AD (JWT bearer), o
   - API key rotada + IP restrictions.
3. Configurar `FLOW_*_URL` y credenciales (`FLOW_API_KEY` o `FLOW_BEARER_TOKEN`).

### Opción B: patrón `IntegrationRequest` en Dataverse

1. El portal crea fila `IntegrationRequest`.
2. Flow en Power Automate se dispara por nueva fila.
3. Flow procesa y actualiza estado + resultado en Dataverse.

## 6. Modo demo / seed

- Si Dataverse no está configurado, se utiliza base mock en memoria con datos de ejemplo.
- Permite navegar módulos completos y validar UX/flujo.
- Login demo disponible en `/login` cuando no hay Entra configurado.

## 7. Estructura principal

```txt
src/
  app/
    (portal)/...                # páginas de negocio
    login/                      # login MSAL
    api/...                     # route handlers (auth, CRUD, flows)
  components/
    layout/                     # shell corporativo, navegación
    ui/                         # cabeceras y componentes comunes
    admin/                      # vistas admin
    providers/                  # Fluent Provider + Toaster
  lib/
    auth/                       # sesión, roles, guards, msal client
    config/                     # env server/client
    dataverse/                  # tipos, cliente web api, repositorio, mock store
    flows/                      # trigger service Power Automate
    http/                       # cliente fetch + helpers route
```

## 8. Notas de Dataverse

- Los nombres de entity set y campos están en:
  - `src/lib/dataverse/schema.ts`
  - mapeos por dominio en `src/lib/dataverse/repositories/*.ts`
- Ajustar prefijos (`crf1_*`) según tu solución Dataverse real.

## 9. Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
