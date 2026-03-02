# ARGOS - Fase 1 Execution Plan (13 semanas)

## Objetivo
Alinear la ejecución técnica del portal con las fases operativas acordadas para llegar al hito de 90 días.

## Fases acordadas
| # | Etapa | Semanas | Entregable | Inicio | Fin | Riesgo/Dependencia |
|---|---|---|---|---|---|---|
| 1 | Levantamiento y diseño funcional | Sem 1-3 | Wireframes e historias aprobadas | Sem 1 | Sem 3 | Holgura de 1 semana para revisión y firma del negocio |
| 2 | Setup infraestructura y CI/CD | Sem 2-4 | Ambientes DEV/QA activos | Sem 2 | Sem 4 | Dependencia de infraestructura controlada por DATTICS |
| 3 | Autenticación SSO + B2C | Sem 4-7 | Login corporativo y operarios funcionales | Sem 4 | Sem 7 | Alto: configuración OIDC/B2C en tenant Argos |
| 4 | Integración SFTP (SuccessFactors) | Sem 6-8 | Job procesando altas/bajas/cambios | Sem 6 | Sem 8 | Alto: credenciales y rutas SFTP (`infodotSSFF`) |
| 5 | Módulos Core: maestros, tallas y motor de kits | Sem 8-12 | Parametrización + ventanas de bloqueo listas | Sem 8 | Sem 12 | Depende del cierre de fase 4 para asegurar hito 90 días |

## Estado actual en este repositorio
- `1` Parcial completo: base UX y módulos principales implementados.
- `2` Parcial completo: CI para build/lint y deploy de Pages operativo en rama `pilot`.
- `3` Parcial: SSO Entra activo; flujo B2C (operarios) pendiente.
- `4` Pendiente: job SFTP SSFF no implementado aún.
- `5` En progreso: catálogos de centros de costo y kits ya operativos; faltan ventanas de tallas y lógica completa del motor.

## Próximas acciones inmediatas (orden de ejecución)
1. Implementar login de operarios (B2C) con política de seguridad y fallback controlado.
2. Definir contrato técnico SSFF SFTP y crear módulo de ingestión con trazabilidad.
3. Cerrar ventanas de actualización de tallas por sede/periodo (bloqueo nacional y local).
4. Completar motor de kits por cargo/género/sede/ciclo con recálculo por cambios.

## Nota de alineación
Este plan se ejecuta sobre la arquitectura vigente del proyecto (`Next.js + Dataverse + Power Automate`) para maximizar velocidad de entrega del piloto y reducir riesgo de re-plataforma durante el primer hito.
