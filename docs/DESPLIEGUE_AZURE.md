# Guía de Despliegue en Azure — ARGOS Plataforma Integral

Esta guía cubre el despliegue del portal Next.js (frontend/BFF) en Azure. El backend .NET 8 y Azure SQL Database se despliegan por separado (fuera de este repo).

## 0. Infraestructura actual (piloto desplegado)

Aprovisionada el 2026-06-12 en la suscripción `Subscription1` (tenant LCH-TECHNOLOGIES):

| Recurso | Nombre | Detalle |
|---|---|---|
| Resource Group | `rg-argos-dotacion` | Metadata en eastus2; recursos en canadacentral |
| App Service Plan | `plan-argos-dotacion` | Linux **B1** (~USD 13/mes), **canadacentral** — eastus/eastus2 sin quota de App Service en esta suscripción |
| Web App | `argos-dotacion-pilot` | Node 22 LTS, startup `HOSTNAME=0.0.0.0 node server.js`, HTTPS-only, health check `/api/health` |
| Application Insights | `appi-argos-dotacion` | Conectado vía `APPLICATIONINSIGHTS_CONNECTION_STRING` |

- **URL:** https://argos-dotacion-pilot.azurewebsites.net
- **Modo actual:** demo (sin `BACKEND_API_BASE_URL`); datos in-memory por instancia.
- **Redespliegue:** `./scripts/deploy-azure.sh` (build standalone + zip deploy).
- **Pendiente manual (SSO):** agregar `https://argos-dotacion-pilot.azurewebsites.net/login` como redirect URI **SPA** en el App Registration de Entra (Portal → Entra ID → App registrations → la app del portal → Authentication). Sin esto el login corporativo desde Azure falla; el login operario demo sí funciona.
- Secretos (`APP_SESSION_SECRET`, `DEMO_OPERARIO_PASSWORD`) fueron generados aleatoriamente y viven solo en App Service → Configuration. Consultar con:
  `az webapp config appsettings list -n argos-dotacion-pilot -g rg-argos-dotacion --query "[?name=='DEMO_OPERARIO_PASSWORD'].value" -o tsv`
- Para eliminar todo el piloto: `az group delete --name rg-argos-dotacion`.

## 1. Opciones de despliegue

| Opción | Servicio | Cuándo usarla |
|---|---|---|
| **Contenedor** (recomendada) | Azure App Service (Linux container) o Azure Container Apps | Builds reproducibles, imagen mínima, mismo artefacto en todos los ambientes |
| **Node nativo** | Azure App Service (Node 20 LTS) | Sin registry de contenedores; despliegue directo con `npm start` |

### 1.1 Despliegue con contenedor

El repo incluye un `Dockerfile` multi-stage (deps → builder → runner) que usa el output `standalone` de Next.js y corre como usuario no-root.

```bash
# Build local
docker build -t argos-portal:latest .

# Probar localmente
docker run -p 3000:3000 --env-file .env.local argos-portal:latest

# Publicar a Azure Container Registry
az acr login --name <registry>
docker tag argos-portal:latest <registry>.azurecr.io/argos-portal:<version>
docker push <registry>.azurecr.io/argos-portal:<version>
```

La imagen incluye un `HEALTHCHECK` que consulta `GET /api/health` cada 30 segundos.

### 1.2 Despliegue Node nativo (App Service) — usado por el piloto

- Runtime: **Node 22 LTS** (App Service ya no ofrece Node 20 para apps nuevas)
- Build local + zip deploy del output standalone (sin Oryx): ver `scripts/deploy-azure.sh`
- Arranque: `HOSTNAME=0.0.0.0 node server.js` con `SCM_DO_BUILD_DURING_DEPLOYMENT=false`
- **Importante:** las variables `NEXT_PUBLIC_*` (redirect URI de Entra, site key de Turnstile) se **inyectan en tiempo de build**, no de runtime — el build debe hacerse con los valores del dominio destino. Las site keys de Turnstile están atadas a dominio: la de localhost no sirve en `*.azurewebsites.net`.

## 2. Variables de entorno por ambiente

Configurar en **App Service → Configuration → Application settings** (o en Container Apps → Environment variables). Nunca commitear valores reales; ver `.env.example` para el catálogo completo.

### 2.1 Obligatorias en producción

| Variable | Descripción |
|---|---|
| `APP_SESSION_SECRET` | Secreto de firma de sesión, **mínimo 32 caracteres**. Generar con `openssl rand -base64 48` |
| `APP_ORIGIN` | Origen público de la app, p. ej. `https://argos.empresa.com` (valida CSRF de origen) |
| `ENTRA_TENANT_ID` / `ENTRA_CLIENT_ID` | App Registration de Microsoft Entra ID |
| `NEXT_PUBLIC_ENTRA_TENANT_ID` / `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Mismos valores, expuestos al cliente para MSAL |
| `NEXT_PUBLIC_ENTRA_REDIRECT_URI` | `https://<dominio>/login` (debe coincidir con el App Registration) |
| `BACKEND_API_BASE_URL` | URL del backend .NET (sin esta variable la app arranca en **modo demo**) |
| `BACKEND_API_KEY` o `BACKEND_API_BEARER_TOKEN` | Credencial hacia el backend |

> **Importante:** `DEMO_MODE=true` está bloqueado en producción — el servidor se niega a arrancar. Igualmente, si el ambiente no es demo, el arranque falla con `APP_SESSION_SECRET` débil o con la contraseña de operario por defecto. Esta validación corre al **arrancar el servidor** (no al compilar).

### 2.2 Opcionales

| Variable | Default | Descripción |
|---|---|---|
| `SESSION_DURATION_HOURS` | `8` | Duración de la sesión (cookie + JWT) |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Nivel mínimo del logger estructurado |
| `AUTH_MAX_ATTEMPTS` / `AUTH_WINDOW_MS` / `AUTH_LOCK_MS` | `5` / `900000` / `900000` | Rate limiting de login operario |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | — | Captcha Cloudflare Turnstile para login operario |
| `FLOW_*` | — | URLs y credenciales de Power Automate (aprobaciones / SAP) |
| `ENTRA_GROUP_*` | — | Object IDs de grupos Entra → roles de la app |

### 2.3 Secretos con Azure Key Vault

Usar referencias de Key Vault en App Service para no exponer secretos en la configuración:

```
APP_SESSION_SECRET = @Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/argos-session-secret/)
BACKEND_API_KEY    = @Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/argos-backend-key/)
```

Requiere habilitar **Managed Identity** en el App Service y darle rol `Key Vault Secrets User` sobre el vault.

## 3. Microsoft Entra ID (App Registration)

1. **Azure Portal → Entra ID → App registrations → New registration**
   - Tipo: Single tenant (o según política corporativa)
   - Redirect URI (tipo *Single-page application*): `https://<dominio>/login`
2. **Token configuration:** agregar claim de grupos (`groups`) para el mapeo de roles, o usar App Roles.
3. **Grupos → roles:** crear los grupos de seguridad y configurar sus Object IDs en `ENTRA_GROUP_SUPERADMIN`, `ENTRA_GROUP_ADMINLOCAL`, etc.
4. El servidor valida el `id_token` contra el JWKS de Microsoft (`login.microsoftonline.com/<tenant>/discovery/v2.0/keys`) con audiencia = client ID; no se requiere client secret para este flujo.

## 4. Health probes

Configurar el health check del servicio hacia:

```
GET /api/health
```

Respuesta esperada (HTTP 200):

```json
{
  "status": "ok",
  "timestamp": "2026-06-12T22:08:32.101Z",
  "uptimeSeconds": 3,
  "mode": "backend",
  "backendConfigured": true
}
```

- En App Service: **Monitoring → Health check → Path** = `/api/health`.
- Verificar tras cada despliegue que `mode` sea `"backend"` — si aparece `"demo"`, falta `BACKEND_API_BASE_URL` (en producción el arranque fallará antes si `DEMO_MODE=true`).

## 5. Logs y observabilidad

- El logger estructurado (`src/lib/observability/logger.ts`) emite **una línea JSON por evento** a stdout/stderr — App Service Log Stream y Application Insights la ingieren directamente.
- Cada respuesta de API incluye el header `x-request-id`; las llamadas al backend .NET llevan `x-correlation-id`. Ambos aparecen en los logs para correlación end-to-end.
- Habilitar **Application Insights** en el App Service (auto-instrumentación Node) para trazas, métricas y alertas. Ver [OPERACIONES.md](OPERACIONES.md) para el runbook.

## 6. Checklist de despliegue a producción

- [ ] `APP_SESSION_SECRET` único por ambiente, ≥32 chars, en Key Vault
- [ ] `APP_ORIGIN` apunta al dominio público con HTTPS
- [ ] `DEMO_MODE` **no** definida (o `false`) y `DEMO_LOGIN_ENABLED=false` si no aplica el piloto
- [ ] `BACKEND_API_BASE_URL` + credencial configuradas y health check responde `mode: "backend"`
- [ ] App Registration con redirect URI del dominio productivo
- [ ] Grupos Entra mapeados (`ENTRA_GROUP_*`)
- [ ] Health probe configurado a `/api/health`
- [ ] Application Insights conectado y log stream visible
- [ ] CI verde (typecheck, lint, tests, build, audit) en el commit desplegado
- [ ] HTTPS only habilitado en App Service (HSTS ya se emite desde la app)
