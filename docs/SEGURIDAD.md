# Postura de Seguridad — ARGOS Plataforma Integral

Resumen del modelo de seguridad implementado en el portal (frontend/BFF). La seguridad del backend transaccional definitivo requiere integración y validación independiente; el backend .NET histórico no está en este repositorio.

## 1. Autenticación

| Mecanismo | Detalle |
|---|---|
| **Entra ID SSO** | Flujo redirect con MSAL (`@azure/msal-browser`). El `id_token` se verifica **server-side** con `jose` contra el JWKS de Microsoft (issuers v2.0 y STS), validando audiencia (= client ID) y firma. Nunca se confía en claims sin verificar. |
| **Sesión propia** | Tras validar el token Entra, el BFF emite su propio JWT HS256 (secreto `APP_SESSION_SECRET`, ≥32 chars obligatorio fuera de demo) en cookie `httpOnly`, `secure` (prod), `SameSite=Lax`. Duración configurable (`SESSION_DURATION_HOURS`, default 8 h). |
| **Login operario (piloto)** | Password + Cloudflare Turnstile opcional + rate limiting (5 intentos / 15 min por defecto, bloqueo 15 min). Pensado solo para el piloto; deshabilitar con `DEMO_LOGIN_ENABLED=false`. |

## 2. Autorización (RBAC + alcance por sede)

- Roles: `SuperAdmin`, `AdminLocal`, `UsuarioPedidos`, `UsuarioFinal`, `OperarioBodega`, `InspectorCalidad`, `TecnicoMantenimiento` (`src/lib/types/app.ts`).
- Mapeo desde claims `roles` o grupos Entra (`ENTRA_GROUP_*`). Los roles desconocidos o ausentes se rechazan; las sedes deben estar asignadas explícitamente, salvo acceso global de `SuperAdmin`.
- Todas las rutas de API pasan por `requireApiUser()` (`src/lib/auth/api-auth.ts`): sesión válida + rol permitido.
- Datos filtrados por sede (`scopeBySede`); `SuperAdmin` recibe comodín `*`.

## 3. Protección de mutaciones (CSRF)

Doble control en todo POST/PUT/PATCH/DELETE:

1. **Origen:** el header `Origin` debe coincidir con `APP_ORIGIN` o el host efectivo de la petición (considerando `x-forwarded-host`/`x-forwarded-proto`).
2. **Double-submit token:** cookie `argos_csrf` + header `x-csrf-token` deben coincidir.

## 4. Cabeceras HTTP (next.config.ts)

- `Content-Security-Policy` con `default-src 'self'`, allowlist explícita para Microsoft login, Turnstile, Power BI y Power Automate; `frame-ancestors 'none'`.
- `Strict-Transport-Security` (solo producción), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva.
- **Limitación conocida:** `script-src`/`style-src` permiten `'unsafe-inline'` (requerido hoy por Fluent UI/Next inline styles). Mejora futura: nonces CSP.

## 5. Validación de entrada

- Esquemas **Zod** en los route handlers para cuerpo y parámetros.
- Los errores devuelven mensajes genéricos + `requestId`; los detalles internos van al log, no al cliente.

## 6. Gestión de secretos

- `.env*` está en `.gitignore` (solo `.env.example` con placeholders se versiona). Verificado: ningún archivo env existe en el historial de git.
- Producción: secretos vía Azure Key Vault con Managed Identity (ver [DESPLIEGUE_AZURE.md](DESPLIEGUE_AZURE.md) §2.3).
- Salvaguardas de arranque (runtime, no build): rechaza secreto de sesión débil/por defecto y contraseña de operario por defecto fuera de demo. En producción también rechaza `DEMO_MODE=true`, `DEMO_LOGIN_ENABLED=true` y ausencia de backend persistente. Este es un control transitorio hasta aprobar y construir el almacenamiento SQL.

## 7. Dependencias y CI

- CI bloquea el merge si fallan typecheck, lint, unit tests, build o `npm audit --audit-level=high`.
- Next.js usa la línea 16.4.x y el build reproducible emplea el compilador predeterminado Turbopack.
- El último `npm audit` ejecutado en QA reportó cero vulnerabilidades; el resultado debe repetirse sobre cada SHA candidato de release.

## 8. Mejoras futuras recomendadas

1. **CSP con nonces** para eliminar `'unsafe-inline'`.
2. **SAST automatizado** (GitHub CodeQL) en CI.
3. **Rate limiting distribuido** (el actual es in-memory por instancia; con múltiples réplicas considerar Azure Front Door/APIM o un store compartido).
4. **Paginación server-side** en listados grandes para mitigar respuestas no acotadas.
5. **Trazas OpenTelemetry** end-to-end (hoy: correlation IDs + logs estructurados).

## Seguridad del alcance septiembre 2026

Las rutas de pedidos y adjuntos limitan la lectura a `SuperAdmin`, `AdminLocal` y `UsuarioPedidos`, y las mutaciones a `SuperAdmin` y `AdminLocal`. `UsuarioFinal` no tiene acceso a pedidos; los permisos deben revalidarse si SUMMA aprueba una experiencia de usuario final. Véanse las pruebas negativas de `src/app/api/pedidos/permissions.test.ts`.

## Control explícito de roles de inventario (RF-15/17/19)

- Las APIs `/api/inventario/*` autorizan exclusivamente a `SuperAdmin` y `AdminLocal`.
- `UsuarioFinal`, `UsuarioPedidos` y el rol heredado `OperarioBodega` no pueden leer ni mutar inventario.
- `src/app/api/inventario/inventory-permissions.test.ts` valida rutas negativas con sesiones y tokens CSRF sintéticos.
- La segregación de sedes y la concurrencia SQL son gates independientes: no se han acreditado por esta restricción de roles.
- El acceso demo de operarios solo puede aparecer en la UI cuando se declara `NEXT_PUBLIC_OPERARIO_LOGIN_ENABLED=true` y sigue sujeto al control del backend. Los botones demo administrativos requieren `NEXT_PUBLIC_DEMO_LOGIN_ENABLED=true`, sin habilitación productiva.
