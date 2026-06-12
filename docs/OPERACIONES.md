# Runbook de Operaciones — ARGOS Plataforma Integral

Guía operativa para diagnóstico y mantenimiento del portal en ambientes desplegados.

## 1. Health check

```
GET /api/health        # sin autenticación
```

| Campo | Valores | Interpretación |
|---|---|---|
| `status` | `ok` | El proceso responde |
| `mode` | `backend` / `demo` | `demo` en producción indica configuración incompleta (falta `BACKEND_API_BASE_URL`) |
| `backendConfigured` | `true`/`false` | Si existe URL de backend configurada |
| `uptimeSeconds` | número | Detecta reinicios recientes (crash-loop si siempre es bajo) |

## 2. Logs

### 2.1 Formato

El logger (`src/lib/observability/logger.ts`) emite una línea JSON por evento:

```json
{"timestamp":"2026-06-12T22:00:00.000Z","level":"error","message":"backend api error response","app":"argos-portal","path":"/pedidos","status":502,"correlationId":"…","backendRequestId":"…"}
```

- Nivel mínimo configurable con `LOG_LEVEL` (`debug` | `info` | `warn` | `error`). Default: `info` en producción.
- En App Service: **Log Stream** o consultas KQL en Application Insights (`traces | where message has "argos-portal"`).

### 2.2 Correlación de errores

Cadena de identificadores para seguir una falla end-to-end:

1. El cliente recibe `x-request-id` en cada respuesta del BFF (también viene en el cuerpo de error como `requestId`).
2. El BFF genera `x-correlation-id` por cada llamada al backend .NET; si el backend falla, el error del BFF incluye `corr: <id>` y `backend-ref: <x-request-id del backend>`.
3. Con esos IDs se busca en los logs del BFF y del backend respectivamente.

## 3. Autenticación y sesiones

| Aspecto | Comportamiento |
|---|---|
| Sesión | JWT HS256 firmado con `APP_SESSION_SECRET`, cookie httpOnly `argos_session`, duración `SESSION_DURATION_HOURS` (default 8 h) |
| CSRF | Cookie `argos_csrf` + header `x-csrf-token` obligatorios en mutaciones; además se valida el header `Origin` contra `APP_ORIGIN` |
| Login Entra ID | MSAL redirect → `id_token` verificado server-side contra JWKS de Microsoft |
| Login operario (piloto) | Password + captcha opcional; rate limit de `AUTH_MAX_ATTEMPTS` intentos por `AUTH_WINDOW_MS`, bloqueo de `AUTH_LOCK_MS` |

### Problemas comunes

- **"Origen no permitido" (403):** `APP_ORIGIN` no coincide con el dominio real (revisar https vs http, trailing slash, host del proxy con `x-forwarded-host`).
- **Sesiones caducan "solas":** rotar `APP_SESSION_SECRET` invalida todas las sesiones activas (esperado tras un cambio de secreto).
- **Usuario sin permisos tras login:** los roles vienen de claims/grupos del token Entra. Verificar mapeo `ENTRA_GROUP_*` y que el App Registration emita el claim `groups`.
- **Bloqueo por rate limit:** esperar `AUTH_LOCK_MS` (default 15 min) o reiniciar la instancia (el contador es in-memory por proceso).

## 4. Arranque del servidor falla

La validación de entorno corre al arrancar (no al compilar). Mensajes posibles:

| Error | Causa | Acción |
|---|---|---|
| `APP_SESSION_SECRET debe estar configurado…` | Secreto ausente, por defecto o <32 chars en ambiente no demo | Configurar secreto fuerte |
| `DEMO_OPERARIO_PASSWORD usa valor por defecto…` | Password de operario sin cambiar en ambiente no demo | Definir password fuerte o deshabilitar login operario |
| `DEMO_MODE=true no está permitido en producción` | Variable de demo en producción | Eliminar `DEMO_MODE` del ambiente |

## 5. Modo demo vs backend

- **Demo:** sin `BACKEND_API_BASE_URL` (o `DEMO_MODE=true` fuera de producción). Datos in-memory, se reinician con el proceso. Solo para desarrollo/preview.
- **Backend:** llamadas al .NET API con timeout `BACKEND_API_TIMEOUT_MS` (default 10 s). Errores del backend se propagan como 502 con correlación.

## 6. PWA / Service worker

- `public/sw.js` cachea assets estáticos y páginas públicas; las rutas privadas son network-only.
- Tras un despliegue, el SW detecta la versión nueva y solicita refresh al usuario. Si hay assets obsoletos persistentes, subir la versión del cache (`argos-pwa-vN`) en `sw.js`.
- `/sw.js` se sirve con `Cache-Control: no-cache` (configurado en `next.config.ts`), por lo que las actualizaciones del SW no quedan atrapadas en CDN.

## 7. Verificación local antes de desplegar

```bash
npm run typecheck   # tipos
npm run lint        # estilo
npm test            # unit tests (vitest)
npm run build       # build de producción (genera .next/standalone)
```

Los cuatro comandos corren en CI (`.github/workflows/main.yml`) más `npm audit --audit-level=high` como gate bloqueante.
